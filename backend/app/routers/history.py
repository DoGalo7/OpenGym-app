from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db

router = APIRouter()


def _get_profile_or_404(db: Session, user_id: str):
    profile = crud.get_profile_by_user_id(db, user_id)
    if not profile:
        raise HTTPException(404, "Profiel niet gevonden")
    return profile


@router.post("", response_model=schemas.HistoryRead)
def create_history(data: schemas.HistoryCreate, db: Session = Depends(get_db)):
    profile = _get_profile_or_404(db, data.user_id)
    entry = crud.create_history(db, profile, data)
    return crud.history_to_read(entry)


@router.get("/{user_id}", response_model=list[schemas.HistoryRead])
def list_history(user_id: str, source: str | None = None, limit: int = 50, db: Session = Depends(get_db)):
    profile = _get_profile_or_404(db, user_id)
    entries = crud.list_history(db, profile, source, limit)
    return [crud.history_to_read(e) for e in entries]


@router.get("/{user_id}/{history_id}", response_model=schemas.HistoryRead)
def get_history(user_id: str, history_id: int, db: Session = Depends(get_db)):
    profile = _get_profile_or_404(db, user_id)
    entry = crud.get_history(db, profile, history_id)
    if not entry:
        raise HTTPException(404, "Geschiedenis-item niet gevonden")
    return crud.history_to_read(entry)


@router.patch("/{user_id}/{history_id}", response_model=schemas.HistoryRead)
def patch_history(user_id: str, history_id: int, data: schemas.HistoryUpdate, db: Session = Depends(get_db)):
    profile = _get_profile_or_404(db, user_id)
    entry = crud.get_history(db, profile, history_id)
    if not entry:
        raise HTTPException(404, "Geschiedenis-item niet gevonden")
    entry = crud.update_history(db, entry, data)
    return crud.history_to_read(entry)


@router.delete("/{user_id}/{history_id}", status_code=204)
def delete_history(user_id: str, history_id: int, db: Session = Depends(get_db)):
    profile = _get_profile_or_404(db, user_id)
    entry = crud.get_history(db, profile, history_id)
    if not entry:
        raise HTTPException(404, "Geschiedenis-item niet gevonden")
    crud.delete_history(db, entry)
