import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Table, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

profile_excluded_exercise = Table(
    "profile_excluded_exercise",
    Base.metadata,
    Column("profile_id", ForeignKey("user_profiles.id"), primary_key=True),
    Column("exercise_id", ForeignKey("exercises.id"), primary_key=True),
)


class Exercise(Base):
    __tablename__ = "exercises"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    muscle_group: Mapped[str] = mapped_column(String(50), nullable=False)
    # beginner, intermediate, advanced
    level: Mapped[str] = mapped_column(String(20), nullable=False)
    # barbell, dumbbell, kettlebell, rack, bodyweight, cardio, gymnastics
    category: Mapped[str] = mapped_column(String(30), nullable=False)
    # gym: requires crossfit-box equipment. home: doable without equipment.
    requires_gym: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_cardio: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # assault_bike, ski_erg, row, run - only set when is_cardio is true
    cardio_type: Mapped[str | None] = mapped_column(String(30), nullable=True)
    # a "second category": marks exercises that fit Hyrox-style training, independent of
    # (in addition to) the equipment category above.
    is_hyrox: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    rx_weight_male_kg: Mapped[float | None] = mapped_column(nullable=True)
    rx_weight_female_kg: Mapped[float | None] = mapped_column(nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Groups equipment-variants of the same movement (e.g. "farmers_carry" for both DB and KB
    # Farmers Carry) so the generator picks at most one variant per WOD - never both.
    base_movement: Mapped[str | None] = mapped_column(String(50), nullable=True)
    # Specific gear this exercise needs when requires_gym=True (see constants.HomeEquipment),
    # checked against the profile's owned home_equipment for location=home. None + requires_gym
    # means gym-only with no home-equipment escape hatch (e.g. a sled).
    equipment_tag: Mapped[str | None] = mapped_column(String(30), nullable=True)
    # Mobility/activation drills (inchworm, high knees, ...) that are only ever appropriate for
    # the warm-up block, never selected for the main WOD block.
    warmup_only: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # True for exercises inserted by sync.sync_exercises_from_source() that haven't been
    # reviewed yet - excluded from every WOD-generation pool (see wod_generator.py) until an
    # admin approves them via /admin/oefeningen. The external source has no notion of our
    # niveau/RX-gewicht scale, so those fields are guessed conservatively on insert and MUST be
    # human-checked before the exercise is safe to hand out (this app's injury/conditie safety
    # logic is gated on `level` being trustworthy).
    pending_review: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class FixedWod(Base):
    __tablename__ = "fixed_wods"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    # murph, girls, soldier
    wod_category: Mapped[str] = mapped_column(String(30), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    structure: Mapped[str] = mapped_column(Text, nullable=False)
    time_cap_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # Structured equivalent of `structure` (free text, still used by FixedWodDetailPage's
    # read-only view) - lets load_fixed_wod() expand this into the same GeneratedWod shape
    # load_predefined_wod() produces, so a benchmark WOD gets the full builder/timer/save
    # experience instead of only "save a result". Same fields/semantics as PredefinedWod's.
    training_type: Mapped[str] = mapped_column(String(20), nullable=False, default="FOR_TIME")
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=20)
    rounds_override: Mapped[str | None] = mapped_column(String(20), nullable=True)
    rep_scheme_override: Mapped[str | None] = mapped_column(String(60), nullable=True)

    movements: Mapped[list["FixedWodMovement"]] = relationship(
        back_populates="fixed_wod", cascade="all, delete-orphan",
        order_by="FixedWodMovement.position",
    )


class FixedWodMovement(Base):
    __tablename__ = "fixed_wod_movements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    fixed_wod_id: Mapped[int] = mapped_column(ForeignKey("fixed_wods.id"), nullable=False)
    exercise_id: Mapped[int] = mapped_column(ForeignKey("exercises.id"), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    reps: Mapped[int | None] = mapped_column(Integer, nullable=True)
    distance_meters: Mapped[int | None] = mapped_column(Integer, nullable=True)
    calories: Mapped[int | None] = mapped_column(Integer, nullable=True)

    fixed_wod: Mapped["FixedWod"] = relationship(back_populates="movements")
    exercise: Mapped["Exercise"] = relationship()


class PredefinedWod(Base):
    __tablename__ = "predefined_wods"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    # AMRAP, EMOM, TABATA, FOR_TIME - shown to the user as "Anders" for FOR_TIME
    training_type: Mapped[str] = mapped_column(String(20), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    # beginner, intermediate, advanced - display only, not used for filtering
    level: Mapped[str] = mapped_column(String(20), nullable=False)
    # only meaningful for training_type == FOR_TIME, where the round/rep structure
    # varies per WOD (e.g. "3" + "21-15-9", or "1" + "aflopend"). AMRAP/EMOM/TABATA
    # derive their shape from training_type + duration_minutes instead (see wod_generator).
    rounds_override: Mapped[str | None] = mapped_column(String(20), nullable=True)
    rep_scheme_override: Mapped[str | None] = mapped_column(String(60), nullable=True)
    # True for a partner/Buddy WOD (I-Go-You-Go, split-reps or synchro format - the exact
    # format is explained in `description`). The movements/reps listed are the workout's
    # total; the description tells the two partners how to divide it.
    is_buddy: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    movements: Mapped[list["PredefinedWodMovement"]] = relationship(
        back_populates="predefined_wod", cascade="all, delete-orphan",
        order_by="PredefinedWodMovement.position",
    )


class PredefinedWodMovement(Base):
    __tablename__ = "predefined_wod_movements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    predefined_wod_id: Mapped[int] = mapped_column(ForeignKey("predefined_wods.id"), nullable=False)
    exercise_id: Mapped[int] = mapped_column(ForeignKey("exercises.id"), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    reps: Mapped[int | None] = mapped_column(Integer, nullable=True)
    distance_meters: Mapped[int | None] = mapped_column(Integer, nullable=True)
    calories: Mapped[int | None] = mapped_column(Integer, nullable=True)

    predefined_wod: Mapped["PredefinedWod"] = relationship(back_populates="movements")
    exercise: Mapped["Exercise"] = relationship()


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    # stable external identifier so a future multi-user database/auth system
    # can map onto existing profiles without changing the primary key.
    user_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    # PBKDF2 hash ("salt$digest", see app/security.py). Nullable so profiles created before
    # this feature existed keep working - the first login attempt for such a profile claims
    # it with whatever password is entered (see crud.login_or_create_profile).
    password_hash: Mapped[str | None] = mapped_column(String(160), nullable=True)
    # PBKDF2 hash of a one-time-shown recovery code (see app/security.py), generated whenever
    # password_hash is newly set. Lets a user reset a forgotten password without email/SMS.
    recovery_code_hash: Mapped[str | None] = mapped_column(String(160), nullable=True)
    # None = niveau-filter staat uit (volledige oefeningenpool, geen beperking op niveau).
    level: Mapped[str | None] = mapped_column(String(20), nullable=True, default=None)
    # gym or home - default training location for this profile
    default_location: Mapped[str] = mapped_column(String(10), nullable=False, default="gym")
    # true = always use the profile level, false = allow deviating per WOD.
    use_profile_level_default: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    # JSON list of equipment tags the user owns at home, e.g. ["pull_up_bar", "barbell"].
    # Relaxes the location="home" filter for exercises needing that specific equipment.
    home_equipment: Mapped[str] = mapped_column(Text, default="[]", nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow, nullable=False
    )

    injuries: Mapped[list["Injury"]] = relationship(
        back_populates="profile", cascade="all, delete-orphan"
    )
    excluded_exercises: Mapped[list["Exercise"]] = relationship(
        secondary=profile_excluded_exercise
    )
    wod_history: Mapped[list["WodHistory"]] = relationship(
        back_populates="profile", cascade="all, delete-orphan"
    )
    exercise_weights: Mapped[list["ProfileExerciseWeight"]] = relationship(
        back_populates="profile", cascade="all, delete-orphan"
    )


class ProfileExerciseWeight(Base):
    """A personal working weight for one exercise, saved so future generated WODs can default
    to it instead of the RX weight - still editable per-WOD via ExerciseRow like before."""
    __tablename__ = "profile_exercise_weights"
    __table_args__ = (UniqueConstraint("profile_id", "exercise_id", name="uq_profile_exercise_weight"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    profile_id: Mapped[int] = mapped_column(ForeignKey("user_profiles.id"), nullable=False)
    exercise_id: Mapped[int] = mapped_column(ForeignKey("exercises.id"), nullable=False)
    weight_kg: Mapped[float] = mapped_column(nullable=False)

    profile: Mapped["UserProfile"] = relationship(back_populates="exercise_weights")
    exercise: Mapped["Exercise"] = relationship()


class Injury(Base):
    __tablename__ = "injuries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    profile_id: Mapped[int] = mapped_column(ForeignKey("user_profiles.id"), nullable=False)
    description: Mapped[str] = mapped_column(String(200), nullable=False)
    # optional muscle group to exclude from generated workouts, e.g. "schouders"
    affected_muscle_group: Mapped[str | None] = mapped_column(String(50), nullable=True)
    # optional key into wod_generator.CONDITION_RULES (e.g. "zwangerschap") - drives exercise
    # exclusions that a single muscle group can't express (a condition, not a body part).
    condition_key: Mapped[str | None] = mapped_column(String(50), nullable=True)

    profile: Mapped["UserProfile"] = relationship(back_populates="injuries")


class WodHistory(Base):
    __tablename__ = "wod_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    profile_id: Mapped[int] = mapped_column(ForeignKey("user_profiles.id"), nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow, nullable=False
    )
    # generated or fixed
    source: Mapped[str] = mapped_column(String(20), nullable=False)
    fixed_wod_id: Mapped[int | None] = mapped_column(ForeignKey("fixed_wods.id"), nullable=True)
    # full generated wod payload (blocks, exercises, weights) stored as JSON text
    wod_json: Mapped[str] = mapped_column(Text, nullable=False)
    # free-text result, e.g. "12:34" or "5 rounds + 3 reps"
    result: Mapped[str | None] = mapped_column(String(100), nullable=True)
    # free-text personal note, separate from the result (e.g. "voelde zwaar, RX gehaald")
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    favorite: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # personal 1-5 rating of this logged workout (how it felt / would you do it again) -
    # None until the user rates it, same "optional, edited after the fact" pattern as result/note.
    rating: Mapped[int | None] = mapped_column(Integer, nullable=True)

    profile: Mapped["UserProfile"] = relationship(back_populates="wod_history")
    fixed_wod: Mapped["FixedWod | None"] = relationship()


class SharedWod(Base):
    """A generated or manually-built WOD a user chose to share - shows up for every sporter
    under Ideeën, category "Gedeeld door andere sporters"."""
    __tablename__ = "shared_wods"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    profile_id: Mapped[int] = mapped_column(ForeignKey("user_profiles.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    training_type: Mapped[str] = mapped_column(String(20), nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    # full GeneratedWod payload (blocks, exercises, weights), same shape as WodHistory.wod_json
    wod_json: Mapped[str] = mapped_column(Text, nullable=False)
    shared_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow, nullable=False
    )

    profile: Mapped["UserProfile"] = relationship()


class Favorite(Base):
    """Per-profile bookmark on a shared library item (fixed or predefined WOD) - separate from
    WodHistory.favorite, which marks a WOD you've actually logged, not just one you'd like to try."""
    __tablename__ = "favorites"
    __table_args__ = (UniqueConstraint("profile_id", "item_type", "item_id", name="uq_favorite_item"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    profile_id: Mapped[int] = mapped_column(ForeignKey("user_profiles.id"), nullable=False)
    # "fixed_wod" or "predefined_wod"
    item_type: Mapped[str] = mapped_column(String(20), nullable=False)
    item_id: Mapped[int] = mapped_column(Integer, nullable=False)


class Friendship(Base):
    __tablename__ = "friendships"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    profile_id: Mapped[int] = mapped_column(ForeignKey("user_profiles.id"), nullable=False)
    friend_profile_id: Mapped[int] = mapped_column(ForeignKey("user_profiles.id"), nullable=False)
    # pending or accepted
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
