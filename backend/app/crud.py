import json

from sqlalchemy.orm import Session

from app import models, schemas


# --- Profiles ---


def get_profile_by_user_id(db: Session, user_id: str) -> models.UserProfile | None:
    return db.query(models.UserProfile).filter_by(user_id=user_id).first()


def get_or_create_profile(db: Session, data: schemas.ProfileCreate) -> models.UserProfile:
    profile = get_profile_by_user_id(db, data.user_id)
    if profile:
        return profile
    profile = models.UserProfile(user_id=data.user_id, name=data.name)
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


def update_profile(db: Session, profile: models.UserProfile, data: schemas.ProfileUpdate) -> models.UserProfile:
    for field, value in data.model_dump(exclude_unset=True, mode="json").items():
        if field == "home_equipment":
            value = json.dumps(value)
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile


def profile_to_read(profile: models.UserProfile) -> schemas.ProfileRead:
    return schemas.ProfileRead(
        id=profile.id,
        user_id=profile.user_id,
        name=profile.name,
        level=profile.level,
        default_location=profile.default_location,
        use_profile_level_default=profile.use_profile_level_default,
        home_equipment=json.loads(profile.home_equipment),
        created_at=profile.created_at,
        injuries=[schemas.InjuryRead.model_validate(i) for i in profile.injuries],
        excluded_exercises=[schemas.ExerciseSummary.model_validate(e) for e in profile.excluded_exercises],
    )


# --- Injuries ---


def add_injury(db: Session, profile: models.UserProfile, data: schemas.InjuryCreate) -> models.Injury:
    injury = models.Injury(
        profile_id=profile.id,
        description=data.description,
        affected_muscle_group=data.affected_muscle_group.value if data.affected_muscle_group else None,
    )
    db.add(injury)
    db.commit()
    db.refresh(injury)
    return injury


def remove_injury(db: Session, profile: models.UserProfile, injury_id: int) -> bool:
    injury = db.query(models.Injury).filter_by(id=injury_id, profile_id=profile.id).first()
    if not injury:
        return False
    db.delete(injury)
    db.commit()
    return True


# --- Excluded exercises ---


def add_excluded_exercise(db: Session, profile: models.UserProfile, exercise_id: int) -> models.UserProfile:
    exercise = db.get(models.Exercise, exercise_id)
    if not exercise:
        raise ValueError("Oefening niet gevonden")
    if exercise not in profile.excluded_exercises:
        profile.excluded_exercises.append(exercise)
        db.commit()
        db.refresh(profile)
    return profile


def remove_excluded_exercise(db: Session, profile: models.UserProfile, exercise_id: int) -> bool:
    exercise = next((e for e in profile.excluded_exercises if e.id == exercise_id), None)
    if not exercise:
        return False
    profile.excluded_exercises.remove(exercise)
    db.commit()
    return True


# --- Friendships ---


def list_friendships(db: Session, profile: models.UserProfile) -> list[schemas.FriendshipRead]:
    outgoing = db.query(models.Friendship).filter_by(profile_id=profile.id).all()
    incoming = db.query(models.Friendship).filter_by(friend_profile_id=profile.id).all()

    results = []
    for f in outgoing:
        friend = db.get(models.UserProfile, f.friend_profile_id)
        results.append(schemas.FriendshipRead(
            id=f.id, friend_user_id=friend.user_id, friend_name=friend.name, status=f.status, direction="outgoing"
        ))
    for f in incoming:
        friend = db.get(models.UserProfile, f.profile_id)
        results.append(schemas.FriendshipRead(
            id=f.id, friend_user_id=friend.user_id, friend_name=friend.name, status=f.status, direction="incoming"
        ))
    return results


def create_friend_request(db: Session, profile: models.UserProfile, friend_user_id: str) -> models.Friendship:
    friend = get_profile_by_user_id(db, friend_user_id)
    if not friend:
        raise ValueError("Gebruiker niet gevonden")
    if friend.id == profile.id:
        raise ValueError("Je kunt jezelf niet toevoegen als vriend")

    existing = db.query(models.Friendship).filter(
        ((models.Friendship.profile_id == profile.id) & (models.Friendship.friend_profile_id == friend.id))
        | ((models.Friendship.profile_id == friend.id) & (models.Friendship.friend_profile_id == profile.id))
    ).first()
    if existing:
        raise ValueError("Er bestaat al een vriendschap of open verzoek met deze gebruiker")

    friendship = models.Friendship(profile_id=profile.id, friend_profile_id=friend.id, status="pending")
    db.add(friendship)
    db.commit()
    db.refresh(friendship)
    return friendship


def accept_friendship(db: Session, profile: models.UserProfile, friendship_id: int) -> models.Friendship:
    friendship = db.query(models.Friendship).filter_by(id=friendship_id, friend_profile_id=profile.id).first()
    if not friendship:
        raise ValueError("Vriendschapsverzoek niet gevonden")
    friendship.status = "accepted"
    db.commit()
    db.refresh(friendship)
    return friendship


# --- History ---


def create_history(db: Session, profile: models.UserProfile, data: schemas.HistoryCreate) -> models.WodHistory:
    entry = models.WodHistory(
        profile_id=profile.id,
        source=data.source,
        fixed_wod_id=data.fixed_wod_id,
        wod_json=json.dumps(data.wod_json),
        result=data.result,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def list_history(db: Session, profile: models.UserProfile, source: str | None, limit: int) -> list[models.WodHistory]:
    query = db.query(models.WodHistory).filter_by(profile_id=profile.id)
    if source:
        query = query.filter_by(source=source)
    return query.order_by(models.WodHistory.created_at.desc()).limit(limit).all()


def get_history(db: Session, profile: models.UserProfile, history_id: int) -> models.WodHistory | None:
    return db.query(models.WodHistory).filter_by(id=history_id, profile_id=profile.id).first()


def update_history(db: Session, entry: models.WodHistory, data: schemas.HistoryUpdate) -> models.WodHistory:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(entry, field, value)
    db.commit()
    db.refresh(entry)
    return entry


def delete_history(db: Session, entry: models.WodHistory) -> None:
    db.delete(entry)
    db.commit()


def history_to_read(entry: models.WodHistory) -> schemas.HistoryRead:
    return schemas.HistoryRead(
        id=entry.id,
        profile_id=entry.profile_id,
        created_at=entry.created_at,
        source=entry.source,
        fixed_wod_id=entry.fixed_wod_id,
        wod_json=json.loads(entry.wod_json),
        result=entry.result,
        note=entry.note,
        favorite=entry.favorite,
    )


# --- Favorites (library bookmarks) ---


def list_favorites(db: Session, profile: models.UserProfile) -> list[models.Favorite]:
    return db.query(models.Favorite).filter_by(profile_id=profile.id).all()


def add_favorite(db: Session, profile: models.UserProfile, item_type: str, item_id: int) -> models.Favorite:
    existing = db.query(models.Favorite).filter_by(
        profile_id=profile.id, item_type=item_type, item_id=item_id
    ).first()
    if existing:
        return existing
    favorite = models.Favorite(profile_id=profile.id, item_type=item_type, item_id=item_id)
    db.add(favorite)
    db.commit()
    db.refresh(favorite)
    return favorite


def remove_favorite(db: Session, profile: models.UserProfile, item_type: str, item_id: int) -> bool:
    favorite = db.query(models.Favorite).filter_by(
        profile_id=profile.id, item_type=item_type, item_id=item_id
    ).first()
    if not favorite:
        return False
    db.delete(favorite)
    db.commit()
    return True
