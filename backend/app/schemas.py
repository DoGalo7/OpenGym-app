from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.constants import CardioType, Category, HomeEquipment, Level, Location, MuscleGroup, TrainingType


# --- Exercises ---


class ExerciseSummary(BaseModel):
    id: int
    name: str
    muscle_group: str
    category: str

    model_config = ConfigDict(from_attributes=True)


class ExerciseRead(ExerciseSummary):
    level: str
    requires_gym: bool
    is_cardio: bool
    cardio_type: str | None
    is_hyrox: bool
    rx_weight_male_kg: float | None
    rx_weight_female_kg: float | None
    description: str | None
    equipment_tag: str | None
    warmup_only: bool
    base_movement: str | None = None


class ExerciseAdminCreate(BaseModel):
    """Full editable exercise shape for the (unauthenticated, not linked from the app's
    navigation - see routers/admin_exercises.py) admin page."""
    name: str = Field(min_length=1, max_length=120)
    muscle_group: MuscleGroup
    level: Level
    category: Category
    requires_gym: bool = False
    equipment_tag: str | None = None
    is_cardio: bool = False
    cardio_type: CardioType | None = None
    is_hyrox: bool = False
    rx_weight_male_kg: float | None = None
    rx_weight_female_kg: float | None = None
    description: str | None = None
    base_movement: str | None = None
    warmup_only: bool = False


class ExerciseAdminUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    muscle_group: MuscleGroup | None = None
    level: Level | None = None
    category: Category | None = None
    requires_gym: bool | None = None
    equipment_tag: str | None = None
    is_cardio: bool | None = None
    cardio_type: CardioType | None = None
    is_hyrox: bool | None = None
    rx_weight_male_kg: float | None = None
    rx_weight_female_kg: float | None = None
    description: str | None = None
    base_movement: str | None = None
    warmup_only: bool | None = None


# --- Fixed WODs ---


class FixedWodRead(BaseModel):
    id: int
    name: str
    wod_category: str
    description: str
    structure: str
    time_cap_minutes: int | None

    model_config = ConfigDict(from_attributes=True)


# --- Predefined WODs ---


class PredefinedWodMovementSummary(BaseModel):
    exercise_name: str
    reps: int | None = None
    distance_meters: int | None = None
    calories: int | None = None


class PredefinedWodSummary(BaseModel):
    id: int
    name: str
    training_type: str
    description: str
    duration_minutes: int
    level: str
    movements: list[PredefinedWodMovementSummary]
    # True when every movement is doable without gym equipment (derived from each
    # movement's Exercise.requires_gym) - lets the Ideeën page show a "Ook thuis"-tag
    # without the frontend needing to know about equipment_tag/cardio_type internals.
    home_friendly: bool = False
    # True when >=70% of movements are tagged is_hyrox on Exercise - lets the Ideeën page
    # offer a "Hyrox-stijl" filter without duplicating that flag onto PredefinedWod itself
    # (it's fully derivable from the movements already loaded here). See routers/wods.py
    # for why 70% and not "any"/"majority".
    is_hyrox: bool = False
    # Direct passthrough of PredefinedWod.is_buddy (not derived, unlike home_friendly/is_hyrox
    # above) - a partner-WOD format isn't something the movement list alone tells you.
    is_buddy: bool = False
    # Direct passthrough of PredefinedWod.is_power - curated tag, same reasoning as is_buddy.
    is_power: bool = False


# --- Injuries ---


class InjuryCreate(BaseModel):
    description: str = Field(min_length=1, max_length=200)
    affected_muscle_group: MuscleGroup | None = None
    # key into wod_generator.CONDITION_RULES, e.g. "zwangerschap" - see that dict's docstring
    condition_key: str | None = None


class InjuryRead(InjuryCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)


# --- Profiles ---


class ProfileLogin(BaseModel):
    user_id: str = Field(min_length=1, max_length=64)
    name: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=4, max_length=100)


class ProfileRecover(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    recovery_code: str = Field(min_length=1, max_length=20)
    new_password: str = Field(min_length=4, max_length=100)


class ProfileUpdate(BaseModel):
    name: str | None = None
    # explicit null clears the level (turns off niveau-filtering)
    level: Level | None = None
    default_location: Location | None = None
    use_profile_level_default: bool | None = None
    home_equipment: list[HomeEquipment] | None = None


class ProfileRead(BaseModel):
    id: int
    user_id: str
    name: str
    level: str | None
    default_location: str
    use_profile_level_default: bool
    home_equipment: list[str] = []
    created_at: datetime
    # Only ever set in the response right after a new recovery code was generated (new
    # profile, legacy profile claimed, or first password set on this device) - never on a
    # normal login/GET, since the plaintext code isn't stored anywhere to hand back later.
    recovery_code: str | None = None
    injuries: list[InjuryRead] = []
    excluded_exercises: list[ExerciseSummary] = []
    exercise_weights: list["ExerciseWeightRead"] = []

    model_config = ConfigDict(from_attributes=True)


class AdminUserSummary(BaseModel):
    """/api/admin/users - deliberately excludes password_hash/recovery_code_hash (even
    hashed, they have no reason to leave the database) and other profile detail
    (injuries/exclusions/etc.) not relevant to a signup overview."""
    id: int
    user_id: str
    name: str
    level: str | None
    default_location: str
    created_at: datetime
    has_password: bool
    workout_count: int
    last_workout_at: datetime | None


class ExcludedExerciseAdd(BaseModel):
    exercise_id: int


# --- Personal exercise weights ---


class ExerciseWeightSet(BaseModel):
    weight_kg: float = Field(gt=0, le=500)


class ExerciseWeightRead(BaseModel):
    exercise_id: int
    exercise_name: str
    weight_kg: float


# --- Friendships ---


class FriendRequestCreate(BaseModel):
    friend_user_id: str = Field(min_length=1, max_length=64)


class FriendshipUpdate(BaseModel):
    status: Literal["accepted"]


class FriendshipRead(BaseModel):
    id: int
    friend_user_id: str
    friend_name: str
    status: str
    direction: Literal["outgoing", "incoming"]


class FriendActivityEntry(BaseModel):
    friend_name: str
    wod_name: str
    source: str
    created_at: datetime
    result: str | None
    rating: int | None


# --- WOD generation ---


class WodGenerateRequest(BaseModel):
    user_id: str = Field(min_length=1, max_length=64)
    length_minutes: int = Field(ge=5, le=90)
    muscle_groups: list[MuscleGroup] = Field(min_length=1)
    training_type: TrainingType
    location: Location
    include_cardio: bool = False
    cardio_type: CardioType | None = None
    # overrides the automatically computed number of cardio pieces when set
    cardio_count: int | None = Field(default=None, ge=1, le=4)
    include_warmup: bool = False
    warmup_minutes: int | None = Field(default=None, ge=3, le=20)
    # overrides the default of 3 warm-up exercises when set
    warmup_exercise_count: int | None = Field(default=None, ge=1, le=8)
    # only honored when the profile's use_profile_level_default is False
    deviate_level: Level | None = None
    # empty = fully auto-generated by the WOD generator
    chosen_exercise_ids: list[int] = []
    # exercise_id -> user's own weight in kg
    own_weights: dict[int, float] = {}
    # transient display hint only, never persisted on the profile
    sex: Literal["male", "female"] | None = None
    # overrides the automatically computed number of main-block exercises when set
    exercise_count: int | None = Field(default=None, ge=1, le=10)
    # categories to prioritize when auto-filling exercise slots (e.g. prefer barbell/dumbbell)
    preferred_categories: list[Category] = []
    # restricts exercise selection to Hyrox-tagged movements and favors extra cardio pieces
    hyrox_style: bool = False
    # a one-off injury/beperking for just this WOD, never saved to the profile
    temporary_injury_muscle_group: MuscleGroup | None = None
    # muscle groups where the frontend already warned about a profile-injury conflict and the
    # user explicitly chose to continue anyway - same "explicit choice overrides automatic
    # constraints" precedent as chosen_exercise_ids
    override_injury_muscle_groups: list[MuscleGroup] = []


class WarmupRequest(BaseModel):
    """Builds a standalone warm-up block - used to add one after the fact to a WOD that didn't
    get one at creation time (a loaded predefined-workout idea, or a generated WOD where the
    user skipped the warm-up toggle and changed their mind)."""
    user_id: str = Field(min_length=1, max_length=64)
    muscle_groups: list[MuscleGroup] = Field(min_length=1)
    location: Location
    warmup_minutes: int = Field(ge=3, le=20)
    warmup_exercise_count: int | None = Field(default=None, ge=1, le=8)
    # exercise ids already in the WOD's main block - kept out of the warm-up for variety
    exclude_exercise_ids: list[int] = []
    temporary_injury_muscle_group: MuscleGroup | None = None
    override_injury_muscle_groups: list[MuscleGroup] = []


class StretchWodRequest(BaseModel):
    """Builds a full Stretch & Core-WOD - static holds (duration_seconds) covering the
    requested muscle groups, instead of the usual reps-based metcon."""
    user_id: str = Field(min_length=1, max_length=64)
    muscle_groups: list[MuscleGroup] = Field(min_length=1)
    location: Location
    length_minutes: int = Field(ge=5, le=60)
    temporary_injury_muscle_group: MuscleGroup | None = None
    override_injury_muscle_groups: list[MuscleGroup] = []
    # overrides the default of 4 stretch/core-oefeningen when set
    exercise_count: int | None = Field(default=None, ge=1, le=10)


class ExerciseInWod(BaseModel):
    exercise_id: int
    name: str
    muscle_group: str
    category: str
    reps: int | None = None
    duration_seconds: int | None = None
    distance_meters: int | None = None
    calories: int | None = None
    # assault_bike, ski_erg, row, run - only set for cardio exercises. Lets the frontend
    # recompute a correct distance/calorie value when swapping to another cardio exercise.
    cardio_type: str | None = None
    own_weight_kg: float | None = None
    suggested_weight_male_kg: float | None = None
    suggested_weight_female_kg: float | None = None
    alternatives: list[ExerciseSummary] = []


class WodBlock(BaseModel):
    block_type: Literal["warmup", "main", "cardio"]
    training_type: str | None = None
    duration_minutes: int
    # e.g. 5, or "AMRAP"
    rounds: int | str | None = None
    interval_seconds: int | None = None
    # e.g. "21-15-9", "flat"
    rep_scheme: str | None = None
    exercises: list[ExerciseInWod]


class GeneratedWod(BaseModel):
    profile_id: int
    location: str
    level_used: str | None
    total_duration_minutes: int
    blocks: list[WodBlock]
    generated_at: datetime


# --- Shared WODs ---


class SharedWodCreate(BaseModel):
    user_id: str = Field(min_length=1, max_length=64)
    name: str = Field(min_length=1, max_length=120)
    wod: GeneratedWod
    # when set, only this friend sees the shared WOD instead of every sporter
    recipient_user_id: str | None = Field(default=None, max_length=64)


class SharedWodSummary(BaseModel):
    id: int
    name: str
    training_type: str
    duration_minutes: int
    shared_by_name: str
    movements: list[PredefinedWodMovementSummary]
    recipient_name: str | None = None


# --- History ---


class HistoryCreate(BaseModel):
    user_id: str = Field(min_length=1, max_length=64)
    source: Literal["generated", "fixed"]
    fixed_wod_id: int | None = None
    # GeneratedWod.model_dump() for "generated", a small snapshot dict for "fixed"
    wod_json: dict
    result: str | None = None


class HistoryUpdate(BaseModel):
    result: str | None = Field(default=None, max_length=100)
    note: str | None = Field(default=None, max_length=500)
    favorite: bool | None = None
    rating: int | None = Field(default=None, ge=1, le=5)


class HistoryRead(BaseModel):
    id: int
    profile_id: int
    created_at: datetime
    source: str
    fixed_wod_id: int | None
    wod_json: dict
    result: str | None
    note: str | None = None
    favorite: bool = False
    rating: int | None = None


# --- Favorites (bookmarked library items - fixed/predefined WODs, not logged history) ---


class FavoriteCreate(BaseModel):
    user_id: str = Field(min_length=1, max_length=64)
    item_type: Literal["fixed_wod", "predefined_wod"]
    item_id: int


class FavoriteRead(BaseModel):
    item_type: str
    item_id: int
