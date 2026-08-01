import datetime
import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db

router = APIRouter()


@router.get("", response_model=list[schemas.SharedWodSummary])
def list_shared_wods(db: Session = Depends(get_db)):
    return crud.list_shared_wods(db)


@router.post("", response_model=schemas.SharedWodSummary)
def share_wod(data: schemas.SharedWodCreate, db: Session = Depends(get_db)):
    profile = crud.get_profile_by_user_id(db, data.user_id)
    if not profile:
        raise HTTPException(404, "Profiel niet gevonden")
    return crud.create_shared_wod(db, profile, data)


@router.get("/{shared_wod_id}/load", response_model=schemas.GeneratedWod)
def load_shared_wod(shared_wod_id: int, user_id: str, db: Session = Depends(get_db)):
    profile = crud.get_profile_by_user_id(db, user_id)
    if not profile:
        raise HTTPException(404, "Profiel niet gevonden")
    shared = crud.get_shared_wod(db, shared_wod_id)
    if not shared:
        raise HTTPException(404, "Gedeelde WOD niet gevonden")
    wod = json.loads(shared.wod_json)
    wod["profile_id"] = profile.id
    wod["generated_at"] = datetime.datetime.utcnow().isoformat()
    return wod
