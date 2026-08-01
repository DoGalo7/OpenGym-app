# Curated starter set of "voorgedefinieerde workouts" (workout-ideeen), grouped by
# training_type so the frontend can offer an AMRAP / EMOM / Tabata / Anders (FOR_TIME)
# browse menu. Structures (rep schemes, time domains, movement combos) are based on
# well-established, publicly documented CrossFit programming patterns for each training
# type - not reproductions of specific named benchmark WODs (those live in fixed_wods.py).
# Every movement references an exercise name that must exist in seed/exercises.py; the
# seeder resolves these names to Exercise ids at insert time.
#
# rounds_override/rep_scheme_override are only read for training_type == "FOR_TIME" (see
# wod_generator._shape_predefined) - AMRAP/EMOM/TABATA derive their shape automatically.
PREDEFINED_WODS = [
    # --- AMRAP ---
    {
        "name": "Full Body Blast",
        "training_type": "AMRAP",
        "description": "Laagdrempelige full-body AMRAP om je conditie op te bouwen.",
        "duration_minutes": 12,
        "level": "beginner",
        "movements": [
            {"exercise_name": "Air Squat", "reps": 15},
            {"exercise_name": "Push-up", "reps": 10},
            {"exercise_name": "Sit-up", "reps": 15},
        ],
    },
    {
        "name": "Pull & Push Power",
        "training_type": "AMRAP",
        "description": "Bovenlichaam-AMRAP die trekkracht, duwkracht en een sprong combineert.",
        "duration_minutes": 15,
        "level": "intermediate",
        "movements": [
            {"exercise_name": "Kipping Pull-up", "reps": 8},
            {"exercise_name": "DB Shoulder Press", "reps": 10},
            {"exercise_name": "Box Jump", "reps": 12},
        ],
    },
    {
        "name": "Engine Builder",
        "training_type": "AMRAP",
        "description": "Hoog tempo AMRAP die kracht en conditie combineert.",
        "duration_minutes": 20,
        "level": "intermediate",
        "movements": [
            {"exercise_name": "Burpee", "reps": 10},
            {"exercise_name": "KB Swing Russian", "reps": 15},
            {"exercise_name": "Row", "distance_meters": 200},
        ],
    },
    {
        "name": "Heavy Metal",
        "training_type": "AMRAP",
        "description": "Zware AMRAP voor gevorderden met deadlifts en push press.",
        "duration_minutes": 20,
        "level": "advanced",
        "movements": [
            {"exercise_name": "Deadlift", "reps": 10},
            {"exercise_name": "Push Press", "reps": 8},
            {"exercise_name": "Box Jump", "reps": 12},
        ],
    },
    {
        "name": "Endurance Grinder",
        "training_type": "AMRAP",
        "description": "Lange uithoudings-AMRAP met gymnastiek en een hardloopstuk.",
        "duration_minutes": 30,
        "level": "advanced",
        "movements": [
            {"exercise_name": "Wall Ball Shot", "reps": 15},
            {"exercise_name": "Toes-to-Bar", "reps": 10},
            {"exercise_name": "Running", "distance_meters": 200},
        ],
    },
    # --- EMOM ---
    {
        "name": "Quick Starter",
        "training_type": "EMOM",
        "description": "Korte EMOM om kennis te maken met roterende oefeningen op de minuut.",
        "duration_minutes": 10,
        "level": "beginner",
        "movements": [
            {"exercise_name": "Air Squat", "reps": 12},
            {"exercise_name": "Push-up", "reps": 10},
        ],
    },
    {
        "name": "Total Body Rotation",
        "training_type": "EMOM",
        "description": "EMOM die het hele lichaam laat roteren langs vier oefeningen.",
        "duration_minutes": 16,
        "level": "intermediate",
        "movements": [
            {"exercise_name": "DB Thruster", "reps": 10},
            {"exercise_name": "Row", "calories": 12},
            {"exercise_name": "Sit-up", "reps": 15},
            {"exercise_name": "Box Jump", "reps": 10},
        ],
    },
    {
        "name": "Strength & Sweat",
        "training_type": "EMOM",
        "description": "Combineert een zware kniebuiging met conditiewerk op de minuut.",
        "duration_minutes": 20,
        "level": "intermediate",
        "movements": [
            {"exercise_name": "Back Squat", "reps": 5},
            {"exercise_name": "Burpee", "reps": 10},
            {"exercise_name": "KB Swing American", "reps": 12},
            {"exercise_name": "Double Unders", "reps": 20},
        ],
    },
    {
        "name": "Barbell Cycling",
        "training_type": "EMOM",
        "description": "Technische barbell-EMOM voor gevorderden: clean, squat en jerk.",
        "duration_minutes": 12,
        "level": "advanced",
        "movements": [
            {"exercise_name": "Power Clean", "reps": 5},
            {"exercise_name": "Front Squat", "reps": 5},
            {"exercise_name": "Push Jerk", "reps": 5},
        ],
    },
    {
        "name": "Cardio Rotation",
        "training_type": "EMOM",
        "description": "Lange EMOM die cardiomachines afwisselt met kracht en gymnastiek.",
        "duration_minutes": 30,
        "level": "advanced",
        "movements": [
            {"exercise_name": "Assault Bike", "calories": 12},
            {"exercise_name": "Wall Ball Shot", "reps": 15},
            {"exercise_name": "Toes-to-Bar", "reps": 8},
            {"exercise_name": "KB Clean", "reps": 10},
            {"exercise_name": "Running", "distance_meters": 200},
        ],
    },
    # --- TABATA ---
    {
        "name": "Tabata Classics",
        "training_type": "TABATA",
        "description": "De klassieke Tabata-combinatie: benen, borst en buik.",
        "duration_minutes": 16,
        "level": "beginner",
        "movements": [
            {"exercise_name": "Air Squat"},
            {"exercise_name": "Push-up"},
            {"exercise_name": "Sit-up"},
            {"exercise_name": "Mountain Climbers"},
        ],
    },
    {
        "name": "Kettlebell Tabata",
        "training_type": "TABATA",
        "description": "Korte, pittige Tabata met kettlebell-oefeningen.",
        "duration_minutes": 8,
        "level": "intermediate",
        "movements": [
            {"exercise_name": "KB Swing Russian"},
            {"exercise_name": "Goblet Squat"},
        ],
    },
    {
        "name": "Engine Tabata",
        "training_type": "TABATA",
        "description": "Tabata gericht op conditie en core.",
        "duration_minutes": 12,
        "level": "intermediate",
        "movements": [
            {"exercise_name": "Burpee"},
            {"exercise_name": "Double Unders"},
            {"exercise_name": "Mountain Climbers"},
        ],
    },
    {
        "name": "Upper Body Tabata",
        "training_type": "TABATA",
        "description": "Tabata die focust op borst, triceps en schouders.",
        "duration_minutes": 16,
        "level": "advanced",
        "movements": [
            {"exercise_name": "Push-up"},
            {"exercise_name": "Ring Dip"},
            {"exercise_name": "Pike Push-up"},
            {"exercise_name": "DB Shoulder Press"},
        ],
    },
    {
        "name": "Full Send Tabata",
        "training_type": "TABATA",
        "description": "Vijf zware oefeningen kort na elkaar - een pittige conditietest.",
        "duration_minutes": 20,
        "level": "advanced",
        "movements": [
            {"exercise_name": "Wall Ball Shot"},
            {"exercise_name": "Box Jump"},
            {"exercise_name": "KB Swing American"},
            {"exercise_name": "Burpee"},
            {"exercise_name": "Mountain Climbers"},
        ],
    },
    # --- FOR_TIME ("Anders") ---
    {
        "name": "Classic Triplet",
        "training_type": "FOR_TIME",
        "description": "Klassiek dalend schema: 21-15-9 van twee oefeningen, zo snel mogelijk.",
        "duration_minutes": 15,
        "level": "intermediate",
        "rounds_override": "3",
        "rep_scheme_override": "21-15-9",
        "movements": [
            {"exercise_name": "Thruster", "reps": 21},
            {"exercise_name": "Kipping Pull-up", "reps": 21},
        ],
    },
    {
        "name": "Chipper Challenge",
        "training_type": "FOR_TIME",
        "description": "Vijf oefeningen in aflopende reeks - werk je van veel naar weinig.",
        "duration_minutes": 20,
        "level": "intermediate",
        "rounds_override": "1",
        "rep_scheme_override": "aflopend",
        "movements": [
            {"exercise_name": "Double Unders", "reps": 50},
            {"exercise_name": "Wall Ball Shot", "reps": 40},
            {"exercise_name": "Sit-up", "reps": 30},
            {"exercise_name": "Box Jump", "reps": 20},
            {"exercise_name": "Burpee", "reps": 10},
        ],
    },
    {
        "name": "Deadlift Domination",
        "training_type": "FOR_TIME",
        "description": "Zwaar 21-15-9-schema met deadlifts en burpees.",
        "duration_minutes": 10,
        "level": "advanced",
        "rounds_override": "3",
        "rep_scheme_override": "21-15-9",
        "movements": [
            {"exercise_name": "Deadlift", "reps": 21},
            {"exercise_name": "Burpee", "reps": 21},
        ],
    },
    {
        "name": "Row & Grind",
        "training_type": "FOR_TIME",
        "description": "Rechttoe-rechtaan for-time workout met roeien en kracht.",
        "duration_minutes": 15,
        "level": "intermediate",
        "rounds_override": "1",
        "rep_scheme_override": "flat",
        "movements": [
            {"exercise_name": "Row", "distance_meters": 500},
            {"exercise_name": "Wall Ball Shot", "reps": 30},
            {"exercise_name": "Kipping Pull-up", "reps": 20},
            {"exercise_name": "Air Squat", "reps": 40},
        ],
    },
    {
        "name": "The Ladder",
        "training_type": "FOR_TIME",
        "description": "Oplopende ladder tot 10 - hoe verder, hoe zwaarder.",
        "duration_minutes": 18,
        "level": "advanced",
        "rounds_override": "1",
        "rep_scheme_override": "oplopende ladder 2-4-6-8-10",
        "movements": [
            {"exercise_name": "DB Snatch", "reps": 10},
            {"exercise_name": "Box Jump", "reps": 10},
        ],
    },
]
