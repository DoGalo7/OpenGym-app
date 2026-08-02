from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app import crud, models, schemas
from app.database import get_db
from app.wod_generator import (
    WodGenerationError,
    build_standalone_warmup,
    build_stretch_wod,
    generate_wod,
    load_fixed_wod,
    load_predefined_wod,
)

router = APIRouter()


@router.post("/generate", response_model=schemas.GeneratedWod)
def generate(data: schemas.WodGenerateRequest, db: Session = Depends(get_db)):
    profile = crud.get_profile_by_user_id(db, data.user_id)
    if not profile:
        raise HTTPException(404, "Profiel niet gevonden")
    try:
        return generate_wod(db, profile, data)
    except WodGenerationError as e:
        raise HTTPException(400, str(e))


@router.post("/warmup", response_model=schemas.WodBlock)
def warmup(data: schemas.WarmupRequest, db: Session = Depends(get_db)):
    profile = crud.get_profile_by_user_id(db, data.user_id)
    if not profile:
        raise HTTPException(404, "Profiel niet gevonden")
    return build_standalone_warmup(db, profile, data)


@router.post("/stretch", response_model=schemas.GeneratedWod)
def stretch(data: schemas.StretchWodRequest, db: Session = Depends(get_db)):
    profile = crud.get_profile_by_user_id(db, data.user_id)
    if not profile:
        raise HTTPException(404, "Profiel niet gevonden")
    try:
        return build_stretch_wod(db, profile, data)
    except WodGenerationError as e:
        raise HTTPException(400, str(e))


@router.get("/fixed", response_model=list[schemas.FixedWodRead])
def list_fixed_wods(wod_category: str | None = None, db: Session = Depends(get_db)):
    query = db.query(models.FixedWod)
    if wod_category:
        query = query.filter_by(wod_category=wod_category)
    return query.order_by(models.FixedWod.wod_category, models.FixedWod.name).all()


@router.get("/fixed/{fixed_wod_id}", response_model=schemas.FixedWodRead)
def get_fixed_wod(fixed_wod_id: int, db: Session = Depends(get_db)):
    fixed_wod = db.get(models.FixedWod, fixed_wod_id)
    if not fixed_wod:
        raise HTTPException(404, "Vaste WOD niet gevonden")
    return fixed_wod


@router.get("/fixed/{fixed_wod_id}/load", response_model=schemas.GeneratedWod)
def load_fixed(fixed_wod_id: int, user_id: str, db: Session = Depends(get_db)):
    profile = crud.get_profile_by_user_id(db, user_id)
    if not profile:
        raise HTTPException(404, "Profiel niet gevonden")
    fixed_wod = db.get(models.FixedWod, fixed_wod_id)
    if not fixed_wod:
        raise HTTPException(404, "Vaste WOD niet gevonden")
    return load_fixed_wod(db, profile, fixed_wod)


@router.get("/predefined", response_model=list[schemas.PredefinedWodSummary])
def list_predefined_wods(training_type: str | None = None, db: Session = Depends(get_db)):
    # Eager-load movements + their exercise via a single joined query (this dataset is small -
    # ~20 WODs x ~4 movements - so the row-multiplication joinedload causes is negligible, and it
    # saves 2 extra network round trips per request compared to selectinload, which matters a lot
    # against a remote Postgres where each round trip carries real latency.
    query = db.query(models.PredefinedWod).options(
        joinedload(models.PredefinedWod.movements).joinedload(models.PredefinedWodMovement.exercise)
    )
    if training_type:
        query = query.filter_by(training_type=training_type)
    wods = query.order_by(models.PredefinedWod.training_type, models.PredefinedWod.duration_minutes).all()
    return [
        schemas.PredefinedWodSummary(
            id=w.id,
            name=w.name,
            training_type=w.training_type,
            description=w.description,
            duration_minutes=w.duration_minutes,
            level=w.level,
            movements=[
                schemas.PredefinedWodMovementSummary(
                    exercise_name=m.exercise.name,
                    reps=m.reps,
                    distance_meters=m.distance_meters,
                    calories=m.calories,
                )
                for m in sorted(w.movements, key=lambda m: m.position)
            ],
            home_friendly=all(not m.exercise.requires_gym for m in w.movements),
            # 70% threshold (not "any"/"majority") - tuned against the actual seeded WODs so
            # generic bodyweight WODs that happen to include an Air Squat or Push-up (both
            # is_hyrox=True as *generic* Hyrox-adjacent moves) don't get mistagged, while every
            # WOD from the dedicated Hyrox-style seeding batch still qualifies.
            is_hyrox=bool(w.movements) and sum(1 for m in w.movements if m.exercise.is_hyrox) >= len(w.movements) * 0.7,
            is_buddy=w.is_buddy,
        )
        for w in wods
    ]


@router.get("/predefined/{predefined_wod_id}/load", response_model=schemas.GeneratedWod)
def load_predefined(predefined_wod_id: int, user_id: str, db: Session = Depends(get_db)):
    profile = crud.get_profile_by_user_id(db, user_id)
    if not profile:
        raise HTTPException(404, "Profiel niet gevonden")
    predefined_wod = db.get(models.PredefinedWod, predefined_wod_id)
    if not predefined_wod:
        raise HTTPException(404, "Voorgedefinieerde workout niet gevonden")
    return load_predefined_wod(db, profile, predefined_wod)
