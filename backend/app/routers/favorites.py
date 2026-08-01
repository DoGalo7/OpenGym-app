from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db

router = APIRouter()


@router.get("/{user_id}", response_model=list[schemas.FavoriteRead])
def list_favorites(user_id: str, db: Session = Depends(get_db)):
    profile = crud.get_profile_by_user_id(db, user_id)
    if not profile:
        raise HTTPException(404, "Profiel niet gevonden")
    return crud.list_favorites(db, profile)


@router.post("", response_model=schemas.FavoriteRead)
def add_favorite(data: schemas.FavoriteCreate, db: Session = Depends(get_db)):
    profile = crud.get_profile_by_user_id(db, data.user_id)
    if not profile:
        raise HTTPException(404, "Profiel niet gevonden")
    return crud.add_favorite(db, profile, data.item_type, data.item_id)


@router.delete("/{user_id}/{item_type}/{item_id}", status_code=204)
def remove_favorite(user_id: str, item_type: str, item_id: int, db: Session = Depends(get_db)):
    profile = crud.get_profile_by_user_id(db, user_id)
    if not profile:
        raise HTTPException(404, "Profiel niet gevonden")
    if not crud.remove_favorite(db, profile, item_type, item_id):
        raise HTTPException(404, "Favoriet niet gevonden")
