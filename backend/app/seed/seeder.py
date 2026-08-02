from sqlalchemy.orm import Session

from app.models import Exercise, FixedWod, PredefinedWod, PredefinedWodMovement
from app.seed.exercises import EXERCISES
from app.seed.fixed_wods import FIXED_WODS
from app.seed.predefined_wods import PREDEFINED_WODS


def run_seed(db: Session) -> None:
    """Idempotent: the seed modules are the source of truth for reference data - already-seeded
    rows (matched by name) are kept in sync with them, and brand-new names are inserted. Safe to
    call on every startup, including against an already-populated database.

    Existing rows keep their id when synced (only their fields/movements are replaced) so that
    Favorite rows (which reference fixed/predefined WOD ids) don't silently dangle after a seed
    update - only renaming an entry (not just re-tagging its content) would still orphan a
    favorite, since matching here is by name."""
    existing_by_name = {e.name: e for e in db.query(Exercise).all()}
    new_exercises = []
    for data in EXERCISES:
        existing = existing_by_name.get(data["name"])
        if existing:
            for field, value in data.items():
                setattr(existing, field, value)
        else:
            new_exercises.append(Exercise(**data))
    if new_exercises:
        db.add_all(new_exercises)
        db.flush()  # assign ids so predefined-wod seeding below can resolve exercise names

    existing_fixed_by_name = {w.name: w for w in db.query(FixedWod).all()}
    for data in FIXED_WODS:
        existing = existing_fixed_by_name.get(data["name"])
        if existing:
            for field, value in data.items():
                setattr(existing, field, value)
        else:
            db.add(FixedWod(**data))

    exercise_ids = {name: id_ for name, id_ in db.query(Exercise.name, Exercise.id).all()}
    existing_predefined_by_name = {w.name: w for w in db.query(PredefinedWod).all()}
    for entry in PREDEFINED_WODS:
        wod = existing_predefined_by_name.get(entry["name"])
        if wod:
            wod.training_type = entry["training_type"]
            wod.description = entry["description"]
            wod.duration_minutes = entry["duration_minutes"]
            wod.level = entry["level"]
            wod.rounds_override = entry.get("rounds_override")
            wod.rep_scheme_override = entry.get("rep_scheme_override")
            wod.is_buddy = entry.get("is_buddy", False)
            db.query(PredefinedWodMovement).filter_by(predefined_wod_id=wod.id).delete()
        else:
            wod = PredefinedWod(
                name=entry["name"],
                training_type=entry["training_type"],
                description=entry["description"],
                duration_minutes=entry["duration_minutes"],
                level=entry["level"],
                rounds_override=entry.get("rounds_override"),
                rep_scheme_override=entry.get("rep_scheme_override"),
                is_buddy=entry.get("is_buddy", False),
            )
            db.add(wod)
        db.flush()  # assign/confirm wod.id for the movements below
        for position, movement in enumerate(entry["movements"]):
            exercise_id = exercise_ids.get(movement["exercise_name"])
            if exercise_id is None:
                raise ValueError(f"Onbekende oefening in seed: {movement['exercise_name']}")
            db.add(PredefinedWodMovement(
                predefined_wod_id=wod.id,
                exercise_id=exercise_id,
                position=position,
                reps=movement.get("reps"),
                distance_meters=movement.get("distance_meters"),
                calories=movement.get("calories"),
            ))
    db.commit()
