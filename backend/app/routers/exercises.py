from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

router = APIRouter()


@router.get("", response_model=list[schemas.ExerciseRead])
def list_exercises(
    muscle_group: str | None = None,
    category: str | None = None,
    level: str | None = None,
    requires_gym: bool | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.Exercise)
    if muscle_group:
        query = query.filter_by(muscle_group=muscle_group)
    if category:
        query = query.filter_by(category=category)
    if level:
        query = query.filter_by(level=level)
    if requires_gym is not None:
        query = query.filter_by(requires_gym=requires_gym)
    return query.order_by(models.Exercise.name).all()


@router.get("/{exercise_id}", response_model=schemas.ExerciseRead)
def get_exercise(exercise_id: int, db: Session = Depends(get_db)):
    exercise = db.get(models.Exercise, exercise_id)
    if not exercise:
        raise HTTPException(404, "Oefening niet gevonden")
    return exercise
