import datetime
import json
import random
from math import ceil

from sqlalchemy.orm import Session

from app.constants import LEVEL_RANK, Level
from app.models import Exercise, PredefinedWod, UserProfile
from app.schemas import ExerciseInWod, ExerciseSummary, GeneratedWod, WodBlock, WodGenerateRequest

LEVEL_MULTIPLIER = {"beginner": 0.7, "intermediate": 1.0, "advanced": 1.3}
WARMUP_CATEGORIES = {"bodyweight", "gymnastics"}
WARMUP_MAX_LEVEL_RANK = LEVEL_RANK[Level.intermediate]
ALL_MUSCLE_GROUPS = {"schouders", "rug", "borst", "armen", "benen", "billen", "buik", "volledig_lichaam"}
DEFAULT_WARMUP_EXERCISES = 3

# Natural unit per cardio machine, matching how these are actually programmed in a WOD
# (running/rowing/ski erg in meters, assault bike in calories) instead of pure time.
# Values are illustrative meters-per-minute / calories-per-minute paces, same spirit as
# the other rep/weight heuristics in this file. The raw pace-based estimate is then
# snapped to a "typical" round WOD number (e.g. a run is always 100/200/400/800/1200m,
# never an arbitrary value like 650m).
CARDIO_PACE_METERS_PER_MIN = {"run": 160, "row": 125, "ski_erg": 110}
CARDIO_PACE_CALORIES_PER_MIN = 10  # assault_bike
CARDIO_TYPICAL_DISTANCES = {
    "run": [100, 200, 400, 800, 1200, 1600, 2000],
    "row": [250, 500, 750, 1000, 1500, 2000],
    "ski_erg": [250, 500, 750, 1000, 1500],
}
CARDIO_TYPICAL_CALORIES = [10, 15, 20, 25, 30, 40, 50]

CARRY_DISTANCE_METERS = {"beginner": 60, "intermediate": 100, "advanced": 150}
DEFAULT_CARRY_DISTANCE_METERS = 100  # used when no level filter is active

# Soft cap on the total number of movements (strength + cardio) in an automatically
# generated WOD - a real metcon rarely reads as more than ~6 distinct movements. Only
# applies when the user hasn't explicitly overridden exercise_count themselves.
DEFAULT_MAX_EXERCISES = 6



class WodGenerationError(Exception):
    """Raised when a WOD can't be generated with the requested filters. Message is user-facing Dutch text."""


def generate_wod(db: Session, profile: UserProfile, request: WodGenerateRequest) -> GeneratedWod:
    all_exercises = db.query(Exercise).all()
    filtered = _apply_profile_filters(all_exercises, profile, request)
    # A manually chosen exercise is a deliberate, informed choice (the picker warns about
    # injury conflicts but doesn't block them) - so validate explicit picks against a pool
    # that skips the injury filter, while auto-filled slots still stay injury-safe.
    choosable_filtered = _apply_profile_filters(all_exercises, profile, request, respect_injuries=False)

    effective_level = _effective_level(profile, request)
    target_groups = {mg.value for mg in request.muscle_groups}
    # "Volledig lichaam" means "any muscle group is fair game", not "only exercises literally
    # tagged volledig_lichaam" - that pool was too narrow (missing e.g. Push-up/borst, Sit-up/
    # buik, Air Squat/benen), making both the main block and warm-up feel repetitive. Only used
    # for pool-filtering below - _slot_count still sizes off the original (narrow) target_groups
    # so picking "volledig lichaam" doesn't inflate the exercise count to one-per-muscle-group.
    pool_groups = ALL_MUSCLE_GROUPS if target_groups == {"volledig_lichaam"} else target_groups

    def _to_main_pool(exercises: list[Exercise]) -> list[Exercise]:
        return [
            e for e in exercises
            if not e.is_cardio
            and not e.warmup_only
            and e.muscle_group in pool_groups
            and (effective_level is None or LEVEL_RANK[e.level] <= LEVEL_RANK[effective_level])
            and (not request.hyrox_style or e.is_hyrox)
        ]

    main_pool = _to_main_pool(filtered)
    choosable_main_pool = _to_main_pool(choosable_filtered)
    if not main_pool and not request.chosen_exercise_ids:
        raise WodGenerationError(
            "Geen oefeningen gevonden die passen bij de gekozen spiergroepen, locatie en niveau. "
            "Probeer een andere combinatie."
        )

    # Cardio pieces (when requested) count toward the same total movement budget as the
    # strength/skill exercises, matching real chipper/Hyrox-style programming (e.g. a
    # 45-minute AMRAP reads as ~7-8 movements total, cardio included, not 7-8 strength
    # movements plus cardio bolted on separately).
    # Hyrox-style training is almost always paired with cardio, so it counts as an
    # implicit "include_cardio" even when the toggle itself wasn't explicitly set.
    n_cardio = _cardio_piece_count(request) if (request.include_cardio or request.hyrox_style) else 0
    if request.exercise_count:
        # An explicit exercise_count is the exact total, cardio included - no floor.
        n_cardio = min(n_cardio, request.exercise_count)
        n_slots = max(0, request.exercise_count - n_cardio)
    else:
        # Auto-generated total (strength + cardio) is soft-capped at DEFAULT_MAX_EXERCISES.
        total_target = min(_slot_count(request, target_groups), DEFAULT_MAX_EXERCISES)
        n_cardio = min(n_cardio, total_target)
        n_slots = max(2, total_target - n_cardio)
    preferred_categories = {c.value for c in request.preferred_categories}
    chosen = _select_main_exercises(
        main_pool, choosable_main_pool, pool_groups, n_slots, request.chosen_exercise_ids, preferred_categories
    )
    used_ids = {e.id for e in chosen}

    main_exercises = [
        _to_exercise_in_wod(e, effective_level, request, main_pool, used_ids)
        for e in chosen
    ]

    # Cardio is one of the movements inside the main block/round, not a separate timed
    # segment - this matches how CrossFit/Hyrox-style metcons actually program a cardio
    # piece (e.g. "3 rounds: 500m row, 15 wall balls") rather than bolting a standalone
    # cardio interval onto the end of the WOD.
    if n_cardio:
        all_cardio = [e for e in filtered if e.is_cardio and (not request.hyrox_style or e.is_hyrox)]
        cardio_exercises = _pick_cardio_exercises(all_cardio, request, n_cardio)
        cardio_minutes = min(5, max(2, round(request.length_minutes * 0.2)))
        for cardio_exercise in cardio_exercises:
            main_exercises.append(_cardio_to_exercise_in_wod(
                cardio_exercise, cardio_minutes, all_cardio, used_ids | {cardio_exercise.id}
            ))
            used_ids.add(cardio_exercise.id)

    rounds, interval_seconds, rep_scheme = _shape_training_type(request, chosen)
    main_block = WodBlock(
        block_type="main",
        training_type=request.training_type.value,
        duration_minutes=request.length_minutes,
        rounds=rounds,
        interval_seconds=interval_seconds,
        rep_scheme=rep_scheme,
        exercises=main_exercises,
    )

    blocks: list[WodBlock] = []

    if request.include_warmup and request.warmup_minutes:
        blocks.append(_build_warmup_block(filtered, pool_groups, request, used_ids))

    blocks.append(main_block)

    total_duration = request.length_minutes + (request.warmup_minutes or 0 if request.include_warmup else 0)

    return GeneratedWod(
        profile_id=profile.id,
        location=request.location.value,
        level_used=effective_level,
        total_duration_minutes=total_duration,
        blocks=blocks,
        generated_at=datetime.datetime.utcnow(),
    )


def load_predefined_wod(db: Session, profile: UserProfile, predefined_wod: PredefinedWod) -> GeneratedWod:
    """Expands a curated PredefinedWod into the exact same GeneratedWod shape the
    generator produces, so the frontend can drop it straight into the WOD-maken page
    and reuse all existing swap/edit/save functionality unchanged."""
    all_exercises = db.query(Exercise).all()
    exercises_by_id = {e.id: e for e in all_exercises}
    movements = sorted(predefined_wod.movements, key=lambda m: m.position)

    main_exercises: list[ExerciseInWod] = []
    used_ids: set[int] = set()
    for movement in movements:
        exercise = exercises_by_id[movement.exercise_id]
        main_exercises.append(ExerciseInWod(
            exercise_id=exercise.id,
            name=exercise.name,
            muscle_group=exercise.muscle_group,
            category=exercise.category,
            reps=movement.reps,
            distance_meters=movement.distance_meters,
            calories=movement.calories,
            cardio_type=exercise.cardio_type if exercise.is_cardio else None,
            suggested_weight_male_kg=exercise.rx_weight_male_kg,
            suggested_weight_female_kg=exercise.rx_weight_female_kg,
            alternatives=_alternatives_for(exercise, all_exercises, used_ids | {exercise.id}),
        ))
        used_ids.add(exercise.id)

    rounds, interval_seconds, rep_scheme = _shape_predefined(predefined_wod, len(movements))
    main_block = WodBlock(
        block_type="main",
        training_type=predefined_wod.training_type,
        duration_minutes=predefined_wod.duration_minutes,
        rounds=rounds,
        interval_seconds=interval_seconds,
        rep_scheme=rep_scheme,
        exercises=main_exercises,
    )

    return GeneratedWod(
        profile_id=profile.id,
        location=profile.default_location,
        level_used=predefined_wod.level,
        total_duration_minutes=predefined_wod.duration_minutes,
        blocks=[main_block],
        generated_at=datetime.datetime.utcnow(),
    )


def _shape_predefined(predefined_wod: PredefinedWod, movement_count: int):
    training_type = predefined_wod.training_type
    if training_type == "AMRAP":
        return "AMRAP", None, "flat"
    if training_type == "EMOM":
        return predefined_wod.duration_minutes, 60, "roterend, 1 oefening per minuut"
    if training_type == "TABATA":
        suffix = " per oefening" if movement_count > 1 else ""
        return 8, 20, f"20s werk / 10s rust, 8 ronden{suffix}"
    # FOR_TIME - shape varies per WOD (21-15-9, chipper, ladder, ...)
    rounds = int(predefined_wod.rounds_override) if predefined_wod.rounds_override else 1
    rep_scheme = predefined_wod.rep_scheme_override or "flat"
    return rounds, None, rep_scheme


def _apply_profile_filters(
    exercises: list[Exercise], profile: UserProfile, request: WodGenerateRequest, respect_injuries: bool = True
) -> list[Exercise]:
    injured_groups = (
        {i.affected_muscle_group for i in profile.injuries if i.affected_muscle_group} if respect_injuries else set()
    )
    excluded_ids = {e.id for e in profile.excluded_exercises}
    home_only = request.location.value == "home"
    home_equipment = set(json.loads(profile.home_equipment)) if home_only else set()

    def _home_allowed(e: Exercise) -> bool:
        if not home_only or not e.requires_gym:
            return True
        # Owned home equipment (see constants.HomeEquipment) relaxes the plain
        # bodyweight-only restriction for the specific gear it unlocks.
        if e.equipment_tag and e.equipment_tag in home_equipment:
            return True
        if e.is_cardio and e.cardio_type in home_equipment:
            return True
        return False

    return [
        e for e in exercises
        if e.muscle_group not in injured_groups
        and e.id not in excluded_ids
        and _home_allowed(e)
    ]


def _effective_level(profile: UserProfile, request: WodGenerateRequest) -> str | None:
    if not profile.use_profile_level_default and request.deviate_level:
        return request.deviate_level.value
    return profile.level


def _slot_count(request: WodGenerateRequest, target_groups: set[str]) -> int:
    if request.exercise_count:
        return request.exercise_count
    if request.training_type.value == "TABATA":
        return max(1, request.length_minutes // 4)
    n_slots = min(max(round(request.length_minutes / 6), 2), DEFAULT_MAX_EXERCISES)
    n_slots = max(n_slots, len(target_groups))
    return min(n_slots, DEFAULT_MAX_EXERCISES)


def _cardio_piece_count(request: WodGenerateRequest) -> int:
    if request.cardio_count:
        return request.cardio_count
    # Longer WODs (30 min+) or Hyrox-style sessions get a second cardio touch woven in,
    # mirroring how chipper/Hyrox-style metcons interleave multiple cardio pieces
    # (e.g. row + bike + run) instead of a single one.
    return 2 if (request.length_minutes >= 30 or request.hyrox_style) else 1


def _select_main_exercises(
    pool: list[Exercise], choosable_pool: list[Exercise], target_groups: set[str], n_slots: int,
    chosen_exercise_ids: list[int], preferred_categories: set[str] | None = None,
) -> list[Exercise]:
    # chosen_exercise_ids are validated against choosable_pool (injury-permissive - the
    # frontend already warned about any conflict) - auto-filled slots below still draw
    # only from pool, which stays injury-safe.
    choosable_by_id = {e.id: e for e in choosable_pool}
    preferred_categories = preferred_categories or set()

    chosen: list[Exercise] = []
    rejected = []
    for eid in chosen_exercise_ids:
        if eid in choosable_by_id:
            chosen.append(choosable_by_id[eid])
        else:
            rejected.append(eid)
    if rejected:
        raise WodGenerationError(
            f"Deze oefeningen zijn niet beschikbaar met de huidige filters (uitsluiting, "
            f"locatie of niveau): {rejected}."
        )

    def _pick(candidates: list[Exercise]) -> Exercise:
        if preferred_categories:
            preferred = [e for e in candidates if e.category in preferred_categories]
            if preferred:
                return random.choice(preferred)
        return random.choice(candidates)

    # base_movement groups equipment-variants of the same movement (e.g. DB/KB Farmers Carry) -
    # auto-fill never picks a second variant of one already present. An explicit chosen_exercise_id
    # pick is exempt (same "explicit choice overrides automatic constraints" precedent as injuries).
    used_ids = {e.id for e in chosen}
    used_base_movements = {e.base_movement for e in chosen if e.base_movement}
    available = [e for e in pool if e.id not in used_ids and e.base_movement not in used_base_movements]
    remaining = max(0, n_slots - len(chosen))

    def _consume(pick: Exercise) -> None:
        chosen.append(pick)
        available.remove(pick)
        if pick.base_movement:
            used_base_movements.add(pick.base_movement)
            available[:] = [e for e in available if e.base_movement != pick.base_movement]

    covered_groups = {e.muscle_group for e in chosen}
    # Python set iteration order is fixed for the lifetime of the process (not re-randomized per
    # call), so iterating target_groups directly would - when n_slots is smaller than the number
    # of groups - consistently favor the same subset of groups (e.g. always skipping "borst"/
    # "benen") for as long as the server process stays up. Shuffle to a fresh order every call.
    shuffled_groups = list(target_groups)
    random.shuffle(shuffled_groups)
    for group in shuffled_groups:
        if remaining <= 0:
            break
        if group in covered_groups:
            continue
        candidates = [e for e in available if e.muscle_group == group]
        if not candidates:
            continue
        pick = _pick(candidates)
        _consume(pick)
        remaining -= 1

    while remaining > 0 and available:
        pick = _pick(available)
        _consume(pick)
        remaining -= 1

    return chosen


def _shape_training_type(request: WodGenerateRequest, chosen: list[Exercise]):
    training_type = request.training_type.value
    if training_type == "EMOM":
        return request.length_minutes, 60, "roterend, 1 oefening per minuut"
    if training_type == "AMRAP":
        return "AMRAP", None, "flat"
    if training_type == "FOR_TIME":
        rep_scheme = "21-15-9" if len(chosen) == 2 else "flat"
        return 3, None, rep_scheme
    if training_type == "TABATA":
        return 8, 20, "20s werk / 10s rust, 8 ronden"
    return None, None, "flat"


def _reps_for(exercise: Exercise, effective_level: str | None) -> int:
    multiplier = LEVEL_MULTIPLIER.get(effective_level, 1.0)
    base = 5 if exercise.category == "barbell" else 6 if exercise.category in ("rack", "gymnastics") else 8
    return max(1, ceil(base * multiplier))


def _is_carry(exercise: Exercise) -> bool:
    # Carries are programmed by distance in real training, not by rep count.
    return "carry" in exercise.name.lower()


def _alternatives_for(exercise: Exercise, pool: list[Exercise], exclude_ids: set[int], limit: int = 3) -> list[ExerciseSummary]:
    same_category = [
        e for e in pool
        if e.id not in exclude_ids and e.id != exercise.id
        and e.muscle_group == exercise.muscle_group and e.category == exercise.category
    ]
    same_group_other_category = [
        e for e in pool
        if e.id not in exclude_ids and e.id != exercise.id
        and e.muscle_group == exercise.muscle_group and e.category != exercise.category
    ]

    result = []
    seen_ids: set[int] = set()
    for e in same_category + same_group_other_category:
        if e.id in seen_ids:
            continue
        seen_ids.add(e.id)
        result.append(ExerciseSummary(id=e.id, name=e.name, muscle_group=e.muscle_group, category=e.category))
        if len(result) >= limit:
            break
    return result


def _to_exercise_in_wod(
    exercise: Exercise, effective_level: str | None, request: WodGenerateRequest, pool: list[Exercise], exclude_ids: set[int]
) -> ExerciseInWod:
    is_carry = _is_carry(exercise)
    return ExerciseInWod(
        exercise_id=exercise.id,
        name=exercise.name,
        muscle_group=exercise.muscle_group,
        category=exercise.category,
        reps=None if is_carry else _reps_for(exercise, effective_level),
        distance_meters=CARRY_DISTANCE_METERS.get(effective_level, DEFAULT_CARRY_DISTANCE_METERS) if is_carry else None,
        own_weight_kg=request.own_weights.get(exercise.id),
        suggested_weight_male_kg=exercise.rx_weight_male_kg,
        suggested_weight_female_kg=exercise.rx_weight_female_kg,
        alternatives=_alternatives_for(exercise, pool, exclude_ids),
    )


def _build_warmup_block(
    filtered: list[Exercise], target_groups: set[str], request: WodGenerateRequest, exclude_ids: set[int]
) -> WodBlock:
    base_pool = [
        e for e in filtered
        if e.category in WARMUP_CATEGORIES
        and e.muscle_group in target_groups
        and LEVEL_RANK[e.level] <= WARMUP_MAX_LEVEL_RANK
    ]
    # Fixed default (not derived from len(target_groups), which - now that "volledig lichaam"
    # expands to all 8 groups for pool-filtering - would always max this out at 5). The frontend
    # lets the user explicitly ask for more via warmup_exercise_count.
    n_warmup = request.warmup_exercise_count or DEFAULT_WARMUP_EXERCISES

    # Prefer variety (skip exercises already picked for the main block), but for a single
    # or narrow muscle-group selection the main block can claim most/all warmup-eligible
    # exercises, leaving nothing here. Rather than ship an empty or too-thin warm-up, fall
    # back to reusing main-block exercises once the variety-preserving pool runs too dry.
    warmup_pool = [e for e in base_pool if e.id not in exclude_ids]
    if len(warmup_pool) < min(2, len(base_pool)):
        warmup_pool = base_pool

    chosen: list[Exercise] = []

    opener = next((e for e in warmup_pool if e.name == "Jumping Jack"), None)
    if opener:
        chosen.append(opener)

    # base_movement groups equipment/variant-duplicates of the same movement (e.g. Burpee vs
    # Burpee Broad Jump) - never pick a second one into the same block (see _select_main_exercises
    # for the identical rule on the main block).
    used_ids = {e.id for e in chosen}
    used_base_movements = {e.base_movement for e in chosen if e.base_movement}
    available = [e for e in warmup_pool if e.id not in used_ids and e.base_movement not in used_base_movements]
    remaining = n_warmup - len(chosen)

    def _consume(pick: Exercise) -> None:
        chosen.append(pick)
        available.remove(pick)
        if pick.base_movement:
            used_base_movements.add(pick.base_movement)
            available[:] = [e for e in available if e.base_movement != pick.base_movement]

    covered_groups = {e.muscle_group for e in chosen}
    # See the identical comment in _select_main_exercises: shuffle so this doesn't consistently
    # favor the same subset of groups for the lifetime of the server process.
    shuffled_groups = list(target_groups)
    random.shuffle(shuffled_groups)
    for group in shuffled_groups:
        if remaining <= 0:
            break
        if group in covered_groups:
            continue
        candidates = [e for e in available if e.muscle_group == group]
        if not candidates:
            continue
        pick = random.choice(candidates)
        _consume(pick)
        remaining -= 1

    while remaining > 0 and available:
        pick = random.choice(available)
        _consume(pick)
        remaining -= 1

    warmup_exercises = [
        ExerciseInWod(
            exercise_id=e.id,
            name=e.name,
            muscle_group=e.muscle_group,
            category=e.category,
            reps=10,
            alternatives=_alternatives_for(e, warmup_pool, {c.id for c in chosen}),
        )
        for e in chosen
    ]

    return WodBlock(
        block_type="warmup",
        training_type=None,
        duration_minutes=request.warmup_minutes or 0,
        rounds=2,
        interval_seconds=None,
        rep_scheme=None,
        exercises=warmup_exercises,
    )


def _pick_cardio_exercises(all_cardio: list[Exercise], request: WodGenerateRequest, n_cardio: int) -> list[Exercise]:
    if not all_cardio:
        return []

    first_pool = all_cardio
    if request.cardio_type:
        matched = [e for e in all_cardio if e.cardio_type == request.cardio_type.value]
        first_pool = matched or all_cardio

    chosen = [random.choice(first_pool)]
    remaining_pool = [e for e in all_cardio if e.id != chosen[0].id]
    while len(chosen) < n_cardio and remaining_pool:
        pick = random.choice(remaining_pool)
        chosen.append(pick)
        remaining_pool = [e for e in remaining_pool if e.id != pick.id]
    return chosen


def _snap_to_typical(value: float, typical_values: list[int]) -> int:
    return min(typical_values, key=lambda v: abs(v - value))


def _cardio_to_exercise_in_wod(
    exercise: Exercise, cardio_minutes: int, pool: list[Exercise], exclude_ids: set[int]
) -> ExerciseInWod:
    calories = None
    distance_meters = None
    if exercise.cardio_type == "assault_bike":
        raw_calories = cardio_minutes * CARDIO_PACE_CALORIES_PER_MIN
        calories = _snap_to_typical(raw_calories, CARDIO_TYPICAL_CALORIES)
    else:
        pace = CARDIO_PACE_METERS_PER_MIN.get(exercise.cardio_type, 125)
        raw_distance = cardio_minutes * pace
        typical = CARDIO_TYPICAL_DISTANCES.get(exercise.cardio_type, CARDIO_TYPICAL_DISTANCES["row"])
        distance_meters = _snap_to_typical(raw_distance, typical)

    return ExerciseInWod(
        exercise_id=exercise.id,
        name=exercise.name,
        muscle_group=exercise.muscle_group,
        category=exercise.category,
        distance_meters=distance_meters,
        calories=calories,
        cardio_type=exercise.cardio_type,
        alternatives=_alternatives_for(exercise, pool, exclude_ids),
    )
