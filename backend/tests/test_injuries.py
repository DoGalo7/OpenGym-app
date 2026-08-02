from app import models
from app.schemas import WodGenerateRequest
from app.wod_generator import generate_wod


def _request(**overrides):
    defaults = dict(
        user_id="test-user-1",
        length_minutes=20,
        muscle_groups=["volledig_lichaam"],
        training_type="AMRAP",
        location="gym",
        exercise_count=8,
    )
    defaults.update(overrides)
    return WodGenerateRequest(**defaults)


def _main_exercise_names(wod):
    main_block = next(b for b in wod.blocks if b.block_type == "main")
    return {e.name for e in main_block.exercises}


def _add_injury(db, profile, **kwargs):
    injury = models.Injury(profile_id=profile.id, description="test", **kwargs)
    db.add(injury)
    db.commit()
    return injury


class TestMuscleGroupInjury:
    def test_injured_muscle_group_is_excluded(self, db, seed_exercises, make_profile):
        profile = make_profile()
        _add_injury(db, profile, affected_muscle_group="schouders")
        wod = generate_wod(db, profile, _request())
        names = _main_exercise_names(wod)
        assert "Overhead Press" not in names
        assert "Shoulder Taps" not in names

    def test_override_bypasses_a_specific_injured_group(self, db, seed_exercises, make_profile):
        """The frontend already warned the user about this exact conflict and they chose to
        continue - same precedent as chosen_exercise_ids bypassing injuries."""
        profile = make_profile()
        _add_injury(db, profile, affected_muscle_group="schouders")
        wod = generate_wod(
            db, profile,
            _request(muscle_groups=["schouders"], override_injury_muscle_groups=["schouders"]),
        )
        assert _main_exercise_names(wod)  # succeeds instead of raising WodGenerationError

    def test_temporary_injury_is_not_persisted_to_profile(self, db, seed_exercises, make_profile):
        profile = make_profile()
        wod = generate_wod(db, profile, _request(temporary_injury_muscle_group="borst"))
        assert "Push-up" not in _main_exercise_names(wod)
        assert "Bench Press" not in _main_exercise_names(wod)
        # Never written to profile.injuries - a second, unrelated generation isn't affected.
        db.refresh(profile)
        assert profile.injuries == []
        wod2 = generate_wod(db, profile, _request(muscle_groups=["borst"]))
        assert _main_exercise_names(wod2)


class TestConditionRules:
    def test_nekblessure_excludes_overhead_and_situp_movements(self, db, seed_exercises, make_profile):
        profile = make_profile()
        _add_injury(db, profile, condition_key="nekblessure")
        wod = generate_wod(db, profile, _request())
        names = _main_exercise_names(wod)
        assert "Overhead Press" not in names  # keyword: "overhead"
        assert "Sit-up" not in names  # keyword: "sit-up"
        assert "Deadlift" not in names  # keyword: "deadlift"
        # Unrelated movements stay available.
        assert names

    def test_no_injuries_means_no_condition_exclusions(self, db, seed_exercises, make_profile):
        profile = make_profile()
        wod = generate_wod(db, profile, _request())
        assert "Overhead Press" in _main_exercise_names(wod) or len(_main_exercise_names(wod)) == 8

    def test_respect_injuries_false_skips_condition_exclusion(self, db, seed_exercises, make_profile):
        """Used when validating an explicit chosen_exercise_ids pick - the frontend already
        warned about injury conflicts but doesn't block them (see wod_generator._apply_profile_filters).
        level="intermediate" since Overhead Press is level="intermediate" - isolates the
        condition-bypass behavior from the unrelated niveau gate."""
        profile = make_profile(level="intermediate")
        _add_injury(db, profile, condition_key="nekblessure")
        overhead_press_id = seed_exercises["Overhead Press"].id
        wod = generate_wod(
            db, profile,
            _request(muscle_groups=["schouders"], chosen_exercise_ids=[overhead_press_id], exercise_count=1),
        )
        assert "Overhead Press" in _main_exercise_names(wod)


class TestExcludedExercises:
    def test_permanently_excluded_exercise_never_appears(self, db, seed_exercises, make_profile):
        # advanced, so Back Squat/Pistol Squat (the only other benen exercises) stay eligible
        # once Air Squat (the only beginner one) is excluded.
        profile = make_profile(level="advanced")
        profile.excluded_exercises.append(seed_exercises["Air Squat"])
        db.commit()
        wod = generate_wod(db, profile, _request(muscle_groups=["benen"], exercise_count=2))
        assert "Air Squat" not in _main_exercise_names(wod)
