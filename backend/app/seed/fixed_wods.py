# "structure" is newline-separated: first line is the scheme label (e.g. "Voor tijd",
# "AMRAP 20 minuten"), the rest are individual movements - one per line. This keeps the
# frontend renderable as a clean label + list instead of one dense paragraph (used by
# FixedWodDetailPage's read-only view).
#
# "movements" is the structured equivalent - each references an exercise name that must
# exist in seed/exercises.py - used by wod_generator.load_fixed_wod() to expand this into
# the same GeneratedWod shape a generated/predefined WOD has (timer, block cards, editable
# reps/weight, swap), same as PredefinedWod's own movements. Where the official prescription
# uses a fixed rep-scheme (21-15-9, a descending ladder, ...), "reps" holds the starting/
# anchor rep count and rounds_override/rep_scheme_override communicate the rest - same
# convention as seed/predefined_wods.py's FOR_TIME entries (see e.g. "Classic Triplet").
# 1 mile is snapped to a clean 1600m, matching how cardio distances are programmed elsewhere.
FIXED_WODS = [
    {
        "name": "Murph",
        "wod_category": "murph",
        "description": (
            "Hero WOD ter nagedachtenis aan luitenant Michael Murphy. Traditioneel gedaan op "
            "Memorial Day. De pull-ups, push-ups en squats mogen opgedeeld worden, "
            "bijvoorbeeld in 20 ronden van 5 pull-ups, 10 push-ups en 15 air squats."
        ),
        "structure": "Voor tijd\n1 mile hardlopen\n100 pull-ups\n200 push-ups\n300 air squats\n1 mile hardlopen",
        "time_cap_minutes": 60,
        "training_type": "FOR_TIME",
        "duration_minutes": 60,
        "rounds_override": "1",
        "rep_scheme_override": "flat",
        "movements": [
            {"exercise_name": "Running", "distance_meters": 1600},
            {"exercise_name": "Kipping Pull-up", "reps": 100},
            {"exercise_name": "Push-up", "reps": 200},
            {"exercise_name": "Air Squat", "reps": 300},
            {"exercise_name": "Running", "distance_meters": 1600},
        ],
    },
    {
        "name": "Fran",
        "wod_category": "girls",
        "description": "Klassieke 'Girl WOD', berucht om zijn intensiteit ondanks de korte duur.",
        "structure": "21-15-9 voor tijd\nThrusters (43/30 kg)\nPull-ups",
        "time_cap_minutes": None,
        "training_type": "FOR_TIME",
        "duration_minutes": 15,
        "rounds_override": "3",
        "rep_scheme_override": "21-15-9",
        "movements": [
            {"exercise_name": "Thruster", "reps": 21},
            {"exercise_name": "Kipping Pull-up", "reps": 21},
        ],
    },
    {
        "name": "Grace",
        "wod_category": "girls",
        "description": "Korte, zware WOD die kracht-uithoudingsvermogen test.",
        "structure": "30 herhalingen voor tijd\nClean & Jerk (61/43 kg)",
        "time_cap_minutes": None,
        "training_type": "FOR_TIME",
        "duration_minutes": 10,
        "rounds_override": "1",
        "rep_scheme_override": "flat",
        "movements": [
            {"exercise_name": "Clean and Jerk", "reps": 30},
        ],
    },
    {
        "name": "Diane",
        "wod_category": "girls",
        "description": "Zware deadlifts gecombineerd met een gymnastiek-skill.",
        "structure": "21-15-9 voor tijd\nDeadlifts (102/70 kg)\nHandstand Push-ups",
        "time_cap_minutes": None,
        "training_type": "FOR_TIME",
        "duration_minutes": 12,
        "rounds_override": "3",
        "rep_scheme_override": "21-15-9",
        "movements": [
            {"exercise_name": "Deadlift", "reps": 21},
            {"exercise_name": "Handstand Push-up", "reps": 21},
        ],
    },
    {
        "name": "Helen",
        "wod_category": "girls",
        "description": "Klassieke combinatie van cardio, kracht en trekkracht.",
        "structure": "3 ronden voor tijd\n400m hardlopen\n21 Kettlebell swings (24/16 kg)\n12 Pull-ups",
        "time_cap_minutes": None,
        "training_type": "FOR_TIME",
        "duration_minutes": 12,
        "rounds_override": "3",
        "rep_scheme_override": "flat",
        "movements": [
            {"exercise_name": "Running", "distance_meters": 400},
            {"exercise_name": "KB Swing Russian", "reps": 21},
            {"exercise_name": "Kipping Pull-up", "reps": 12},
        ],
    },
    {
        "name": "Cindy",
        "wod_category": "girls",
        "description": "Zoveel mogelijk ronden in 20 minuten - test uithoudingsvermogen.",
        "structure": "AMRAP 20 minuten\n5 Pull-ups\n10 Push-ups\n15 Air Squats",
        "time_cap_minutes": 20,
        "training_type": "AMRAP",
        "duration_minutes": 20,
        "movements": [
            {"exercise_name": "Kipping Pull-up", "reps": 5},
            {"exercise_name": "Push-up", "reps": 10},
            {"exercise_name": "Air Squat", "reps": 15},
        ],
    },
    {
        "name": "Annie",
        "wod_category": "girls",
        "description": "Snelle, hoog-volume WOD gericht op coordinatie en buikspieren.",
        "structure": "50-40-30-20-10 voor tijd\nDouble-unders\nSit-ups",
        "time_cap_minutes": None,
        "training_type": "FOR_TIME",
        # 150 reps per oefening is een flinke hoeveelheid volume voor een niet-elite sporter
        # (vooral double-unders lopen vaak op als je ze nog aan het leren bent) - 10 min was
        # aan de krappe kant als realistische totaaltijd-inschatting.
        "duration_minutes": 15,
        "rounds_override": "1",
        "rep_scheme_override": "aflopend 50-40-30-20-10",
        "movements": [
            {"exercise_name": "Double Unders", "reps": 50},
            {"exercise_name": "Sit-up", "reps": 50},
        ],
    },
    {
        "name": "DT",
        "wod_category": "soldier",
        "description": "Hero WOD ter nagedachtenis aan Special Forces Sergeant Timothy Davis.",
        "structure": "5 ronden voor tijd\n12 Deadlifts\n9 Hang Power Cleans\n6 Push Jerks (halterstang 70/47.5 kg)",
        "time_cap_minutes": None,
        "training_type": "FOR_TIME",
        "duration_minutes": 15,
        "rounds_override": "5",
        "rep_scheme_override": "flat",
        "movements": [
            {"exercise_name": "Deadlift", "reps": 12},
            {"exercise_name": "Hang Power Clean", "reps": 9},
            {"exercise_name": "Push Jerk", "reps": 6},
        ],
    },
    {
        "name": "Nate",
        "wod_category": "soldier",
        "description": "Hero WOD ter nagedachtenis aan Chief Petty Officer Nate Hardy.",
        "structure": "AMRAP 20 minuten\n2 Muscle-ups\n4 Handstand Push-ups\n8 Kettlebell swings (32/24 kg)",
        "time_cap_minutes": 20,
        "training_type": "AMRAP",
        "duration_minutes": 20,
        "movements": [
            {"exercise_name": "Bar Muscle-up", "reps": 2},
            {"exercise_name": "Handstand Push-up", "reps": 4},
            {"exercise_name": "KB Swing American", "reps": 8},
        ],
    },
]
