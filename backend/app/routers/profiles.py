from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.database import get_db

router = APIRouter()


def _get_profile_or_404(db: Session, user_id: str) -> models.UserProfile:
    profile = crud.get_profile_by_user_id(db, user_id)
    if not profile:
        raise HTTPException(404, "Profiel niet gevonden")
    return profile


@router.post("/get-or-create", response_model=schemas.ProfileRead)
def get_or_create_profile(data: schemas.ProfileCreate, db: Session = Depends(get_db)):
    try:
        return crud.profile_to_read(crud.get_or_create_profile(db, data))
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.get("/by-name/{name}", response_model=schemas.ProfileRead)
def get_profile_by_name(name: str, db: Session = Depends(get_db)):
    profile = crud.get_profile_by_name(db, name)
    if not profile:
        raise HTTPException(404, "Profiel niet gevonden")
    return crud.profile_to_read(profile)


@router.get("/{user_id}", response_model=schemas.ProfileRead)
def get_profile(user_id: str, db: Session = Depends(get_db)):
    return crud.profile_to_read(_get_profile_or_404(db, user_id))


@router.patch("/{user_id}", response_model=schemas.ProfileRead)
def patch_profile(user_id: str, data: schemas.ProfileUpdate, db: Session = Depends(get_db)):
    profile = _get_profile_or_404(db, user_id)
    return crud.profile_to_read(crud.update_profile(db, profile, data))


@router.post("/{user_id}/injuries", response_model=schemas.InjuryRead)
def add_injury(user_id: str, data: schemas.InjuryCreate, db: Session = Depends(get_db)):
    profile = _get_profile_or_404(db, user_id)
    return crud.add_injury(db, profile, data)


@router.delete("/{user_id}/injuries/{injury_id}", status_code=204)
def delete_injury(user_id: str, injury_id: int, db: Session = Depends(get_db)):
    profile = _get_profile_or_404(db, user_id)
    if not crud.remove_injury(db, profile, injury_id):
        raise HTTPException(404, "Blessure niet gevonden")


@router.post("/{user_id}/excluded-exercises", response_model=schemas.ProfileRead)
def add_excluded_exercise(user_id: str, data: schemas.ExcludedExerciseAdd, db: Session = Depends(get_db)):
    profile = _get_profile_or_404(db, user_id)
    try:
        return crud.profile_to_read(crud.add_excluded_exercise(db, profile, data.exercise_id))
    except ValueError as e:
        raise HTTPException(404, str(e))


@router.delete("/{user_id}/excluded-exercises/{exercise_id}", status_code=204)
def delete_excluded_exercise(user_id: str, exercise_id: int, db: Session = Depends(get_db)):
    profile = _get_profile_or_404(db, user_id)
    if not crud.remove_excluded_exercise(db, profile, exercise_id):
        raise HTTPException(404, "Oefening stond niet in de uitsluitingslijst")


@router.get("/{user_id}/friends", response_model=list[schemas.FriendshipRead])
def list_friends(user_id: str, db: Session = Depends(get_db)):
    profile = _get_profile_or_404(db, user_id)
    return crud.list_friendships(db, profile)


@router.post("/{user_id}/friends", response_model=schemas.FriendshipRead)
def request_friend(user_id: str, data: schemas.FriendRequestCreate, db: Session = Depends(get_db)):
    profile = _get_profile_or_404(db, user_id)
    try:
        friendship = crud.create_friend_request(db, profile, data.friend_user_id)
    except ValueError as e:
        raise HTTPException(400, str(e))
    friend = db.get(models.UserProfile, friendship.friend_profile_id)
    return schemas.FriendshipRead(
        id=friendship.id, friend_user_id=friend.user_id, friend_name=friend.name,
        status=friendship.status, direction="outgoing",
    )


@router.patch("/{user_id}/friends/{friendship_id}", response_model=schemas.FriendshipRead)
def accept_friend(user_id: str, friendship_id: int, data: schemas.FriendshipUpdate, db: Session = Depends(get_db)):
    profile = _get_profile_or_404(db, user_id)
    try:
        friendship = crud.accept_friendship(db, profile, friendship_id)
    except ValueError as e:
        raise HTTPException(404, str(e))
    requester = db.get(models.UserProfile, friendship.profile_id)
    return schemas.FriendshipRead(
        id=friendship.id, friend_user_id=requester.user_id, friend_name=requester.name,
        status=friendship.status, direction="incoming",
    )
