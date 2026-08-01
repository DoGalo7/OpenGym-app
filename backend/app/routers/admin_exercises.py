from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

# Not linked from the app's navigation, and deliberately unauthenticated - the same "no real
# auth yet" tradeoff documented for the rest of the app (see CLAUDE.md), just for exercise
# data management instead of profiles. Reachable directly at /admin/oefeningen.
router = APIRouter()


@router.get("", response_model=list[schemas.ExerciseRead])
def list_all_exercises(db: Session = Depends(get_db)):
    return db.query(models.Exercise).order_by(models.Exercise.name).all()


@router.post("", response_model=schemas.ExerciseRead)
def create_exercise(data: schemas.ExerciseAdminCreate, db: Session = Depends(get_db)):
    exercise = models.Exercise(**data.model_dump(mode="json"))
    db.add(exercise)
    db.commit()
    db.refresh(exercise)
    return exercise


@router.patch("/{exercise_id}", response_model=schemas.ExerciseRead)
def update_exercise(exercise_id: int, data: schemas.ExerciseAdminUpdate, db: Session = Depends(get_db)):
    exercise = db.get(models.Exercise, exercise_id)
    if not exercise:
        raise HTTPException(404, "Oefening niet gevonden")
    for field, value in data.model_dump(exclude_unset=True, mode="json").items():
        setattr(exercise, field, value)
    db.commit()
    db.refresh(exercise)
    return exercise


@router.delete("/{exercise_id}", status_code=204)
def delete_exercise(exercise_id: int, db: Session = Depends(get_db)):
    exercise = db.get(models.Exercise, exercise_id)
    if not exercise:
        raise HTTPException(404, "Oefening niet gevonden")
    try:
        db.delete(exercise)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            400,
            "Deze oefening wordt nog gebruikt (bijv. in een workout-idee, geschiedenis of "
            "gewicht) en kan niet verwijderd worden.",
        )
