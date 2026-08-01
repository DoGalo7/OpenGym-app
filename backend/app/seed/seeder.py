from sqlalchemy.orm import Session

from app.models import Exercise, FixedWod, PredefinedWod, PredefinedWodMovement
from app.seed.exercises import EXERCISES
from app.seed.fixed_wods import FIXED_WODS
from app.seed.predefined_wods import PREDEFINED_WODS


def run_seed(db: Session) -> None:
    """Idempotent: EXERCISES is the source of truth for exercise metadata - already-seeded rows
    (matched by name) are kept in sync with it (covers e.g. later re-tagging equipment_tag/
    requires_gym/base_movement without a full reseed), and any brand-new names are inserted.
    Safe to call on every startup, including against an already-populated database."""
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

    if db.query(FixedWod).count() == 0:
        db.add_all(FixedWod(**data) for data in FIXED_WODS)
    if db.query(PredefinedWod).count() == 0:
        exercise_ids = {name: id_ for name, id_ in db.query(Exercise.name, Exercise.id).all()}
        for entry in PREDEFINED_WODS:
            wod = PredefinedWod(
                name=entry["name"],
                training_type=entry["training_type"],
                description=entry["description"],
                duration_minutes=entry["duration_minutes"],
                level=entry["level"],
                rounds_override=entry.get("rounds_override"),
                rep_scheme_override=entry.get("rep_scheme_override"),
            )
            db.add(wod)
            db.flush()  # assign wod.id for the movements below
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
