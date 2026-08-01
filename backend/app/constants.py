from enum import Enum


class Level(str, Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"


LEVEL_RANK = {
    Level.beginner: 1,
    Level.intermediate: 2,
    Level.advanced: 3,
}


class MuscleGroup(str, Enum):
    schouders = "schouders"
    rug = "rug"
    borst = "borst"
    armen = "armen"
    benen = "benen"
    billen = "billen"
    buik = "buik"
    volledig_lichaam = "volledig_lichaam"
    cardio = "cardio"


class Category(str, Enum):
    barbell = "barbell"
    dumbbell = "dumbbell"
    kettlebell = "kettlebell"
    rack = "rack"
    bodyweight = "bodyweight"
    cardio = "cardio"
    gymnastics = "gymnastics"


class CardioType(str, Enum):
    assault_bike = "assault_bike"
    ski_erg = "ski_erg"
    row = "row"
    run = "run"


class TrainingType(str, Enum):
    emom = "EMOM"
    amrap = "AMRAP"
    for_time = "FOR_TIME"
    tabata = "TABATA"


class Location(str, Enum):
    gym = "gym"
    home = "home"


class WodCategory(str, Enum):
    murph = "murph"
    girls = "girls"
    soldier = "soldier"


class HomeEquipment(str, Enum):
    pull_up_bar = "pull_up_bar"
    barbell = "barbell"
    dumbbell = "dumbbell"
    kettlebell = "kettlebell"
    jump_rope = "jump_rope"
    assault_bike = "assault_bike"
    row = "row"
    ski_erg = "ski_erg"
