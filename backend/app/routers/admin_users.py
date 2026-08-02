from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

# Same "no real auth yet" tradeoff as the rest of /admin - deliberately unauthenticated,
# not linked from the app's navigation. Never exposes password_hash/recovery_code_hash,
# even hashed - no legitimate reason for those to leave the database.
router = APIRouter()


@router.get("", response_model=list[schemas.AdminUserSummary])
def list_users(db: Session = Depends(get_db)):
    profiles = db.query(models.UserProfile).order_by(models.UserProfile.created_at.desc()).all()
    return [
        schemas.AdminUserSummary(
            id=p.id,
            user_id=p.user_id,
            name=p.name,
            level=p.level,
            default_location=p.default_location,
            created_at=p.created_at,
            has_password=p.password_hash is not None,
            workout_count=len(p.wod_history),
            last_workout_at=max((h.created_at for h in p.wod_history), default=None),
        )
        for p in profiles
    ]
