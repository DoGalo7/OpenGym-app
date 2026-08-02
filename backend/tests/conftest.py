import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import models
from app.database import Base

# In-memory SQLite per test, isolated from the dev/prod database - Base.metadata is shared
# across the whole app but not tied to a specific engine, so binding create_all() to a fresh
# engine here doesn't touch backend/open_gym.db.


@pytest.fixture
def db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    session_local = sessionmaker(bind=engine)
    session = session_local()
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


def make_exercise(db, name, muscle_group, category="bodyweight", level="beginner", **kwargs):
    exercise = models.Exercise(
        name=name,
        muscle_group=muscle_group,
        category=category,
        level=level,
        requires_gym=kwargs.pop("requires_gym", False),
        **kwargs,
    )
    db.add(exercise)
    db.commit()
    db.refresh(exercise)
    return exercise


@pytest.fixture
def seed_exercises(db):
    """A small, deliberately curated pool - not the real seed/exercises.py data, so these
    tests stay stable regardless of future changes to the curated dataset. Covers every muscle
    group, all three niveaus, gym-only vs. home-friendly, and specific movement names that
    wod_generator.CONDITION_RULES keys off of (e.g. "Overhead Press", "Sit-up", "Deadlift")."""
    exercises = {}
    specs = [
        # name, muscle_group, category, level, requires_gym, equipment_tag
        ("Air Squat", "benen", "bodyweight", "beginner", False, None),
        ("Back Squat", "benen", "barbell", "intermediate", True, "barbell"),
        ("Pistol Squat", "benen", "gymnastics", "advanced", False, None),
        ("Push-up", "borst", "bodyweight", "beginner", False, None),
        ("Bench Press", "borst", "barbell", "intermediate", True, "barbell"),
        ("Deadlift", "rug", "barbell", "intermediate", True, "barbell"),
        ("Superman", "rug", "bodyweight", "beginner", False, None),
        ("Overhead Press", "schouders", "barbell", "intermediate", True, "barbell"),
        ("Shoulder Taps", "schouders", "bodyweight", "beginner", False, None),
        ("Tricep Dips", "armen", "bodyweight", "beginner", False, None),
        ("DB Bicep Curl", "armen", "dumbbell", "beginner", True, "dumbbell"),
        ("Glute Bridge", "billen", "bodyweight", "beginner", False, None),
        ("Barbell Hip Thrust", "billen", "barbell", "intermediate", True, "barbell"),
        ("Sit-up", "buik", "bodyweight", "beginner", False, None),
        ("Toes-to-Bar", "buik", "rack", "advanced", True, "pull_up_bar"),
        ("Burpee", "volledig_lichaam", "bodyweight", "beginner", False, None),
        ("Thruster", "volledig_lichaam", "barbell", "advanced", True, "barbell"),
        ("Row", "cardio", "cardio", "beginner", True, None),
    ]
    for name, muscle_group, category, level, requires_gym, equipment_tag in specs:
        kwargs = {"requires_gym": requires_gym}
        if equipment_tag:
            kwargs["equipment_tag"] = equipment_tag
        if category == "cardio":
            kwargs["is_cardio"] = True
            kwargs["cardio_type"] = "row"
        exercises[name] = make_exercise(db, name, muscle_group, category=category, level=level, **kwargs)
    # A stretching-category exercise, to guard against it leaking into a real metcon block.
    exercises["Cobra Stretch"] = make_exercise(db, "Cobra Stretch", "buik", category="stretching", level="beginner")
    return exercises


@pytest.fixture
def make_profile(db):
    counter = {"n": 0}

    def _make(level="beginner", home_equipment=None, use_profile_level_default=True):
        counter["n"] += 1
        profile = models.UserProfile(
            user_id=f"test-user-{counter['n']}",
            name=f"Test User {counter['n']}",
            level=level,
            use_profile_level_default=use_profile_level_default,
            home_equipment="[]" if home_equipment is None else json.dumps(home_equipment),
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
        return profile

    return _make
