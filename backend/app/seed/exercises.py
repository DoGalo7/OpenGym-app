# Curated starter dataset (~145 exercises). Not sourced online - see sync.py for why.
# `is_hyrox` tags exercises that fit Hyrox-style training - the official 8 race stations
# (SkiErg, Sled Push, Sled Pull, Burpee Broad Jumps, Row, Farmers Carry, Sandbag Lunges,
# Wall Balls, each after a 1km run) plus movements that commonly appear in Hyrox-style gym
# programming (kettlebell swings, pull-ups, air squats, push-ups, ground-to-overhead).
# Sandbag-specific gear isn't modeled separately - DB/bodyweight walking lunges stand in.
# Extra beginner/warmup-friendly movements (incl. an intermediate-only "buffer" move per
# muscle group) were added after a stress test showed the warm-up block could end up empty
# for some single-muscle-group selections. This guarantees a non-empty warm-up at the
# default beginner level; advanced-level single-muscle-group WODs can still occasionally
# get a thin/empty warm-up - see project history for details.
#
# `equipment_tag` names the specific piece of gear an exercise needs at requires_gym=True
# (see constants.HomeEquipment) - it's what location=home checks against the profile's owned
# home_equipment to decide whether the exercise is unlocked. None means no gear beyond what
# bodyweight-only training needs.
EXERCISES = [
    # --- Barbell (12, requires_gym=True, equipment_tag=barbell) ---
    {"name": "Back Squat", "muscle_group": "benen", "level": "intermediate", "category": "barbell", "requires_gym": True, "equipment_tag": "barbell", "rx_weight_male_kg": 60, "rx_weight_female_kg": 40},
    {"name": "Front Squat", "muscle_group": "benen", "level": "advanced", "category": "barbell", "requires_gym": True, "equipment_tag": "barbell", "rx_weight_male_kg": 50, "rx_weight_female_kg": 35},
    {"name": "Deadlift", "muscle_group": "rug", "level": "intermediate", "category": "barbell", "requires_gym": True, "equipment_tag": "barbell", "rx_weight_male_kg": 70, "rx_weight_female_kg": 50},
    {"name": "Sumo Deadlift High Pull", "muscle_group": "volledig_lichaam", "level": "intermediate", "category": "barbell", "requires_gym": True, "equipment_tag": "barbell", "rx_weight_male_kg": 40, "rx_weight_female_kg": 25},
    {"name": "Overhead Press", "muscle_group": "schouders", "level": "intermediate", "category": "barbell", "requires_gym": True, "equipment_tag": "barbell", "rx_weight_male_kg": 35, "rx_weight_female_kg": 20},
    {"name": "Push Press", "muscle_group": "schouders", "level": "intermediate", "category": "barbell", "requires_gym": True, "equipment_tag": "barbell", "rx_weight_male_kg": 45, "rx_weight_female_kg": 30},
    {"name": "Push Jerk", "muscle_group": "schouders", "level": "advanced", "category": "barbell", "requires_gym": True, "equipment_tag": "barbell", "rx_weight_male_kg": 50, "rx_weight_female_kg": 35},
    {"name": "Bench Press", "muscle_group": "borst", "level": "intermediate", "category": "barbell", "requires_gym": True, "equipment_tag": "barbell", "rx_weight_male_kg": 60, "rx_weight_female_kg": 40},
    {"name": "Barbell Bent-over Row", "muscle_group": "rug", "level": "intermediate", "category": "barbell", "requires_gym": True, "equipment_tag": "barbell", "rx_weight_male_kg": 40, "rx_weight_female_kg": 25},
    {"name": "Thruster", "muscle_group": "volledig_lichaam", "level": "advanced", "category": "barbell", "requires_gym": True, "equipment_tag": "barbell", "rx_weight_male_kg": 43, "rx_weight_female_kg": 30, "base_movement": "thruster"},
    {"name": "Power Clean", "muscle_group": "volledig_lichaam", "level": "advanced", "category": "barbell", "requires_gym": True, "equipment_tag": "barbell", "rx_weight_male_kg": 60, "rx_weight_female_kg": 40},
    {"name": "Hang Power Snatch", "muscle_group": "volledig_lichaam", "level": "advanced", "category": "barbell", "requires_gym": True, "equipment_tag": "barbell", "rx_weight_male_kg": 40, "rx_weight_female_kg": 30},
    {"name": "Ground to Overhead", "muscle_group": "volledig_lichaam", "level": "intermediate", "category": "barbell", "requires_gym": True, "equipment_tag": "barbell", "rx_weight_male_kg": 40, "rx_weight_female_kg": 25, "is_hyrox": True},
    {"name": "Barbell Hip Thrust", "muscle_group": "billen", "level": "intermediate", "category": "barbell", "requires_gym": True, "equipment_tag": "barbell", "rx_weight_male_kg": 50, "rx_weight_female_kg": 35},
    {"name": "Barbell Overhead Carry", "muscle_group": "volledig_lichaam", "level": "advanced", "category": "barbell", "requires_gym": True, "equipment_tag": "barbell", "rx_weight_male_kg": 30, "rx_weight_female_kg": 20},

    # --- Extra barbell/Olympic-lifting bewegingen (6) - toegevoegd n.a.v. een "top 100
    # CrossFit-oefeningen" vergelijking; de eerdere set had alleen Power Clean/Hang Power
    # Snatch/Push Jerk, geen van de klassieke squat-varianten van clean/snatch/jerk.
    {"name": "Overhead Squat", "muscle_group": "benen", "level": "advanced", "category": "barbell", "requires_gym": True, "equipment_tag": "barbell", "rx_weight_male_kg": 43, "rx_weight_female_kg": 30},
    {"name": "Squat Clean", "muscle_group": "volledig_lichaam", "level": "advanced", "category": "barbell", "requires_gym": True, "equipment_tag": "barbell", "rx_weight_male_kg": 60, "rx_weight_female_kg": 40},
    {"name": "Hang Power Clean", "muscle_group": "volledig_lichaam", "level": "advanced", "category": "barbell", "requires_gym": True, "equipment_tag": "barbell", "rx_weight_male_kg": 55, "rx_weight_female_kg": 38},
    {"name": "Clean and Jerk", "muscle_group": "volledig_lichaam", "level": "advanced", "category": "barbell", "requires_gym": True, "equipment_tag": "barbell", "rx_weight_male_kg": 61, "rx_weight_female_kg": 43},
    {"name": "Squat Snatch", "muscle_group": "volledig_lichaam", "level": "advanced", "category": "barbell", "requires_gym": True, "equipment_tag": "barbell", "rx_weight_male_kg": 43, "rx_weight_female_kg": 30, "base_movement": "snatch"},
    {"name": "Split Jerk", "muscle_group": "schouders", "level": "advanced", "category": "barbell", "requires_gym": True, "equipment_tag": "barbell", "rx_weight_male_kg": 52, "rx_weight_female_kg": 36},

    # --- Dumbbell (14, requires_gym=True, equipment_tag=dumbbell) ---
    # Previously requires_gym=False (always available at home) - wrong: not everyone owns
    # dumbbells, so this is now gated behind the "Dumbbells" home-equipment checkbox like barbell.
    {"name": "DB Shoulder Press", "muscle_group": "schouders", "level": "beginner", "category": "dumbbell", "requires_gym": True, "equipment_tag": "dumbbell", "rx_weight_male_kg": 20, "rx_weight_female_kg": 12},
    {"name": "DB Bench Press", "muscle_group": "borst", "level": "beginner", "category": "dumbbell", "requires_gym": True, "equipment_tag": "dumbbell", "rx_weight_male_kg": 22, "rx_weight_female_kg": 14},
    {"name": "DB Chest Fly", "muscle_group": "borst", "level": "beginner", "category": "dumbbell", "requires_gym": True, "equipment_tag": "dumbbell", "rx_weight_male_kg": 12, "rx_weight_female_kg": 8},
    {"name": "DB Bent-over Row", "muscle_group": "rug", "level": "beginner", "category": "dumbbell", "requires_gym": True, "equipment_tag": "dumbbell", "rx_weight_male_kg": 22, "rx_weight_female_kg": 14},
    {"name": "DB Single-Arm Row", "muscle_group": "rug", "level": "intermediate", "category": "dumbbell", "requires_gym": True, "equipment_tag": "dumbbell", "rx_weight_male_kg": 24, "rx_weight_female_kg": 16},
    {"name": "DB Tricep Extension", "muscle_group": "armen", "level": "beginner", "category": "dumbbell", "requires_gym": True, "equipment_tag": "dumbbell", "rx_weight_male_kg": 10, "rx_weight_female_kg": 6},
    {"name": "DB Walking Lunge", "muscle_group": "benen", "level": "beginner", "category": "dumbbell", "requires_gym": True, "equipment_tag": "dumbbell", "rx_weight_male_kg": 20, "rx_weight_female_kg": 12, "is_hyrox": True},
    {"name": "DB Thruster", "muscle_group": "volledig_lichaam", "level": "intermediate", "category": "dumbbell", "requires_gym": True, "equipment_tag": "dumbbell", "rx_weight_male_kg": 20, "rx_weight_female_kg": 12, "base_movement": "thruster"},
    {"name": "DB Snatch", "muscle_group": "volledig_lichaam", "level": "intermediate", "category": "dumbbell", "requires_gym": True, "equipment_tag": "dumbbell", "rx_weight_male_kg": 22, "rx_weight_female_kg": 15, "base_movement": "snatch"},
    {"name": "DB Romanian Deadlift", "muscle_group": "benen", "level": "beginner", "category": "dumbbell", "requires_gym": True, "equipment_tag": "dumbbell", "rx_weight_male_kg": 24, "rx_weight_female_kg": 16},
    {"name": "DB Sumo Squat", "muscle_group": "billen", "level": "beginner", "category": "dumbbell", "requires_gym": True, "equipment_tag": "dumbbell", "rx_weight_male_kg": 20, "rx_weight_female_kg": 12},
    {"name": "DB Farmers Carry", "muscle_group": "volledig_lichaam", "level": "beginner", "category": "dumbbell", "requires_gym": True, "equipment_tag": "dumbbell", "rx_weight_male_kg": 24, "rx_weight_female_kg": 16, "is_hyrox": True, "base_movement": "farmers_carry"},
    {"name": "DB Lateral Raise", "muscle_group": "schouders", "level": "beginner", "category": "dumbbell", "requires_gym": True, "equipment_tag": "dumbbell", "rx_weight_male_kg": 8, "rx_weight_female_kg": 5},
    {"name": "DB Bicep Curl", "muscle_group": "armen", "level": "beginner", "category": "dumbbell", "requires_gym": True, "equipment_tag": "dumbbell", "rx_weight_male_kg": 12, "rx_weight_female_kg": 8},
    {"name": "DB Clean", "muscle_group": "volledig_lichaam", "level": "intermediate", "category": "dumbbell", "requires_gym": True, "equipment_tag": "dumbbell", "rx_weight_male_kg": 22, "rx_weight_female_kg": 15},
    {"name": "Devil Press", "muscle_group": "volledig_lichaam", "level": "advanced", "category": "dumbbell", "requires_gym": True, "equipment_tag": "dumbbell", "rx_weight_male_kg": 22, "rx_weight_female_kg": 15},
    # Added for the For Time chipper batch below - plank-position alternating row, distinct
    # from DB Bent-over Row/DB Single-Arm Row (no existing exercise covers it).
    {"name": "DB Renegade Row", "muscle_group": "rug", "level": "intermediate", "category": "dumbbell", "requires_gym": True, "equipment_tag": "dumbbell", "rx_weight_male_kg": 22, "rx_weight_female_kg": 14},

    # --- Kettlebell (7, requires_gym=True, equipment_tag=kettlebell) ---
    # Same fix as dumbbells above - was requires_gym=False, always available at home regardless
    # of whether the profile actually owns a kettlebell.
    {"name": "KB Swing Russian", "muscle_group": "billen", "level": "beginner", "category": "kettlebell", "requires_gym": True, "equipment_tag": "kettlebell", "rx_weight_male_kg": 24, "rx_weight_female_kg": 16, "is_hyrox": True},
    {"name": "KB Swing American", "muscle_group": "schouders", "level": "intermediate", "category": "kettlebell", "requires_gym": True, "equipment_tag": "kettlebell", "rx_weight_male_kg": 24, "rx_weight_female_kg": 16, "is_hyrox": True},
    {"name": "Goblet Squat", "muscle_group": "benen", "level": "beginner", "category": "kettlebell", "requires_gym": True, "equipment_tag": "kettlebell", "rx_weight_male_kg": 20, "rx_weight_female_kg": 12},
    {"name": "KB Clean", "muscle_group": "volledig_lichaam", "level": "intermediate", "category": "kettlebell", "requires_gym": True, "equipment_tag": "kettlebell", "rx_weight_male_kg": 20, "rx_weight_female_kg": 12},
    {"name": "KB Snatch", "muscle_group": "schouders", "level": "advanced", "category": "kettlebell", "requires_gym": True, "equipment_tag": "kettlebell", "rx_weight_male_kg": 20, "rx_weight_female_kg": 12, "base_movement": "snatch"},
    {"name": "Turkish Get-Up", "muscle_group": "volledig_lichaam", "level": "advanced", "category": "kettlebell", "requires_gym": True, "equipment_tag": "kettlebell", "rx_weight_male_kg": 16, "rx_weight_female_kg": 10},
    {"name": "KB Farmers Carry", "muscle_group": "volledig_lichaam", "level": "intermediate", "category": "kettlebell", "requires_gym": True, "equipment_tag": "kettlebell", "rx_weight_male_kg": 20, "rx_weight_female_kg": 12, "is_hyrox": True, "base_movement": "farmers_carry"},
    {"name": "KB Thruster", "muscle_group": "volledig_lichaam", "level": "intermediate", "category": "kettlebell", "requires_gym": True, "equipment_tag": "kettlebell", "rx_weight_male_kg": 20, "rx_weight_female_kg": 12, "base_movement": "thruster"},

    # --- Rack (7, requires_gym=True, equipment_tag=pull_up_bar - bodyweight pull-up rig movements) ---
    {"name": "Ring Row", "muscle_group": "rug", "level": "beginner", "category": "rack", "requires_gym": True, "equipment_tag": "pull_up_bar", "is_hyrox": True},
    {"name": "Strict Pull-up", "muscle_group": "rug", "level": "intermediate", "category": "rack", "requires_gym": True, "equipment_tag": "pull_up_bar", "is_hyrox": True},
    {"name": "Kipping Pull-up", "muscle_group": "rug", "level": "intermediate", "category": "rack", "requires_gym": True, "equipment_tag": "pull_up_bar", "is_hyrox": True},
    {"name": "Chin-up", "muscle_group": "armen", "level": "intermediate", "category": "rack", "requires_gym": True, "equipment_tag": "pull_up_bar"},
    {"name": "Ring Dip", "muscle_group": "armen", "level": "intermediate", "category": "rack", "requires_gym": True, "equipment_tag": "pull_up_bar"},
    {"name": "Toes-to-Bar", "muscle_group": "buik", "level": "advanced", "category": "rack", "requires_gym": True, "equipment_tag": "pull_up_bar"},
    {"name": "Bar Muscle-up", "muscle_group": "rug", "level": "advanced", "category": "rack", "requires_gym": True, "equipment_tag": "pull_up_bar"},
    {"name": "Chest-to-Bar Pull-up", "muscle_group": "rug", "level": "advanced", "category": "rack", "requires_gym": True, "equipment_tag": "pull_up_bar"},
    {"name": "Ring Muscle-up", "muscle_group": "rug", "level": "advanced", "category": "rack", "requires_gym": True, "equipment_tag": "pull_up_bar"},
    {"name": "Knees-to-Elbow", "muscle_group": "buik", "level": "intermediate", "category": "rack", "requires_gym": True, "equipment_tag": "pull_up_bar"},

    # --- Bodyweight (10, requires_gym=False, no weight) ---
    # warmup_only was audited across the whole file (2026-08-02): Arm Circles/Wall Angels/
    # Scapular Push-up below were missing it - pure mobility/activation drills with no real
    # rep-scored-WOD tradition, unlike e.g. Superman/Bird Dog/Glute Bridge/Plank which are
    # dual-purpose (also seen as light scaled main-block movements) and were deliberately left
    # as main-pool-eligible to avoid re-thinning the schouders/rug home pools fixed earlier.
    {"name": "Air Squat", "muscle_group": "benen", "level": "beginner", "category": "bodyweight", "requires_gym": False, "is_hyrox": True},
    {"name": "Push-up", "muscle_group": "borst", "level": "beginner", "category": "bodyweight", "requires_gym": False, "is_hyrox": True},
    {"name": "Sit-up", "muscle_group": "buik", "level": "beginner", "category": "bodyweight", "requires_gym": False},
    {"name": "Burpee", "muscle_group": "volledig_lichaam", "level": "beginner", "category": "bodyweight", "requires_gym": False, "base_movement": "burpee"},
    {"name": "Burpee Broad Jump", "muscle_group": "volledig_lichaam", "level": "intermediate", "category": "bodyweight", "requires_gym": False, "is_hyrox": True, "base_movement": "burpee"},
    {"name": "Walking Lunge", "muscle_group": "benen", "level": "beginner", "category": "bodyweight", "requires_gym": False, "is_hyrox": True},
    {"name": "Plank", "muscle_group": "buik", "level": "beginner", "category": "bodyweight", "requires_gym": False},
    {"name": "Mountain Climbers", "muscle_group": "buik", "level": "beginner", "category": "bodyweight", "requires_gym": False, "warmup_only": True},
    {"name": "Jumping Jack", "muscle_group": "volledig_lichaam", "level": "beginner", "category": "bodyweight", "requires_gym": False, "warmup_only": True},
    {"name": "Glute Bridge", "muscle_group": "billen", "level": "beginner", "category": "bodyweight", "requires_gym": False},
    {"name": "Superman", "muscle_group": "rug", "level": "beginner", "category": "bodyweight", "requires_gym": False},
    {"name": "Shoulder Taps", "muscle_group": "schouders", "level": "beginner", "category": "bodyweight", "requires_gym": False},
    {"name": "Arm Circles", "muscle_group": "schouders", "level": "beginner", "category": "bodyweight", "requires_gym": False, "warmup_only": True},
    {"name": "Pike Push-up", "muscle_group": "schouders", "level": "intermediate", "category": "bodyweight", "requires_gym": False},
    {"name": "Tricep Dips", "muscle_group": "armen", "level": "beginner", "category": "bodyweight", "requires_gym": False},
    {"name": "Diamond Push-up", "muscle_group": "armen", "level": "intermediate", "category": "bodyweight", "requires_gym": False},
    {"name": "Bird Dog", "muscle_group": "rug", "level": "beginner", "category": "bodyweight", "requires_gym": False},
    {"name": "Fire Hydrants", "muscle_group": "billen", "level": "beginner", "category": "bodyweight", "requires_gym": False},
    {"name": "Incline Push-up", "muscle_group": "borst", "level": "beginner", "category": "bodyweight", "requires_gym": False},
    {"name": "Wall Angels", "muscle_group": "schouders", "level": "beginner", "category": "bodyweight", "requires_gym": False, "warmup_only": True},
    {"name": "Scapular Push-up", "muscle_group": "schouders", "level": "intermediate", "category": "bodyweight", "requires_gym": False, "warmup_only": True},
    {"name": "Decline Push-up", "muscle_group": "borst", "level": "intermediate", "category": "bodyweight", "requires_gym": False},
    {"name": "Single-Leg Glute Bridge", "muscle_group": "billen", "level": "intermediate", "category": "bodyweight", "requires_gym": False},
    {"name": "Reverse Snow Angels", "muscle_group": "rug", "level": "intermediate", "category": "bodyweight", "requires_gym": False, "warmup_only": True},
    {"name": "Hollow Hold", "muscle_group": "buik", "level": "intermediate", "category": "bodyweight", "requires_gym": False},
    {"name": "Russian Twist", "muscle_group": "buik", "level": "beginner", "category": "bodyweight", "requires_gym": False},
    {"name": "V-up", "muscle_group": "buik", "level": "beginner", "category": "bodyweight", "requires_gym": False},

    # --- Extra core-oefeningen (5) - op verzoek: meer variatie in "buik", rep-gescoord (dus
    # ook bruikbaar in gewone AMRAP/EMOM/For Time-WOD's, niet alleen Stretch & Core). Onderzocht
    # via gangbare core-workout-bronnen (Men's Health UK's artikel was zelf niet op te halen -
    # geblokkeerd voor scraping - dus via trainwell.net en vergelijkbare bronnen, zie sessie-
    # geschiedenis) - geen verzonnen namen.
    {"name": "Flutter Kicks", "muscle_group": "buik", "level": "beginner", "category": "bodyweight", "requires_gym": False},
    {"name": "Bicycle Crunch", "muscle_group": "buik", "level": "beginner", "category": "bodyweight", "requires_gym": False},
    {"name": "Lying Leg Raise", "muscle_group": "buik", "level": "beginner", "category": "bodyweight", "requires_gym": False},
    {"name": "Reverse Crunch", "muscle_group": "buik", "level": "beginner", "category": "bodyweight", "requires_gym": False},
    {"name": "Toe Touches", "muscle_group": "buik", "level": "beginner", "category": "bodyweight", "requires_gym": False},

    # --- Extra thuis-vriendelijke oefeningen (11) - main-pool bodyweight, requires_gym=False.
    # measure_pools.py (zie sessie-geschiedenis) liet zien dat rug/armen/benen/billen/borst thuis
    # zonder eigen apparatuur soms maar 2, of bij rug/armen zelfs op elk niveau maar 2, hoofd-
    # oefeningen overhielden. Deze vullen elke dunne combinatie aan tot minstens 3-4 opties.
    {"name": "Bodyweight Good Morning", "muscle_group": "rug", "level": "beginner", "category": "bodyweight", "requires_gym": False},
    {"name": "Prone Y-Raise", "muscle_group": "rug", "level": "intermediate", "category": "bodyweight", "requires_gym": False},
    {"name": "Superman Hold", "muscle_group": "rug", "level": "advanced", "category": "bodyweight", "requires_gym": False},
    {"name": "Isometric Push-up Hold", "muscle_group": "armen", "level": "beginner", "category": "bodyweight", "requires_gym": False},
    {"name": "Wall Push-up", "muscle_group": "armen", "level": "beginner", "category": "bodyweight", "requires_gym": False},
    {"name": "Pseudo Planche Push-up", "muscle_group": "armen", "level": "advanced", "category": "bodyweight", "requires_gym": False},
    {"name": "Wall Sit", "muscle_group": "benen", "level": "beginner", "category": "bodyweight", "requires_gym": False},
    {"name": "Reverse Lunge", "muscle_group": "benen", "level": "beginner", "category": "bodyweight", "requires_gym": False, "is_hyrox": True},
    {"name": "Donkey Kicks", "muscle_group": "billen", "level": "beginner", "category": "bodyweight", "requires_gym": False},
    {"name": "Curtsy Lunge", "muscle_group": "billen", "level": "intermediate", "category": "bodyweight", "requires_gym": False},
    {"name": "Wide Push-up", "muscle_group": "borst", "level": "beginner", "category": "bodyweight", "requires_gym": False},
    {"name": "Archer Push-up", "muscle_group": "borst", "level": "advanced", "category": "bodyweight", "requires_gym": False},
    # Compensates the thuis+schouders pool after reclassifying Arm Circles/Wall Angels/
    # Scapular Push-up as warmup_only above - both are legitimate scored isometric holds
    # (not pure mobility drills), so they're a fair main-pool replacement, not a workaround.
    {"name": "Pike Hold", "muscle_group": "schouders", "level": "beginner", "category": "bodyweight", "requires_gym": False},
    {"name": "Plank Walkout", "muscle_group": "schouders", "level": "beginner", "category": "bodyweight", "requires_gym": False},
    {"name": "Wall Handstand Hold", "muscle_group": "schouders", "level": "intermediate", "category": "bodyweight", "requires_gym": False},
    {"name": "Plank Up-Down", "muscle_group": "buik", "level": "intermediate", "category": "bodyweight", "requires_gym": False},

    # --- Extra warming-up-oefeningen (11) - dynamische mobility-moves, incl. elastiek-oefeningen.
    # Meerdere zijn getagd als "volledig_lichaam" (i.p.v. een specifieke spiergroep) omdat dat de
    # standaard spiergroepkeuze is en de warming-up-pool daarvoor eerder te dun was (zie hierboven).
    # warmup_only=True: dit zijn mobility/activatie-oefeningen, geen hoofdblok-bewegingen.
    {"name": "Inchworm", "muscle_group": "volledig_lichaam", "level": "beginner", "category": "bodyweight", "requires_gym": False, "warmup_only": True},
    {"name": "High Knees", "muscle_group": "volledig_lichaam", "level": "beginner", "category": "bodyweight", "requires_gym": False, "warmup_only": True},
    {"name": "World's Greatest Stretch", "muscle_group": "volledig_lichaam", "level": "beginner", "category": "bodyweight", "requires_gym": False, "warmup_only": True},
    {"name": "Butt Kickers", "muscle_group": "benen", "level": "beginner", "category": "bodyweight", "requires_gym": False, "warmup_only": True},
    {"name": "Leg Swings", "muscle_group": "benen", "level": "beginner", "category": "bodyweight", "requires_gym": False, "warmup_only": True},
    {"name": "Cat-Cow Stretch", "muscle_group": "rug", "level": "beginner", "category": "bodyweight", "requires_gym": False, "warmup_only": True},
    {"name": "Band Pull-Apart", "muscle_group": "schouders", "level": "beginner", "category": "bodyweight", "requires_gym": False, "warmup_only": True},
    {"name": "Banded Row", "muscle_group": "rug", "level": "beginner", "category": "bodyweight", "requires_gym": False, "warmup_only": True},
    {"name": "Hip Circles", "muscle_group": "billen", "level": "beginner", "category": "bodyweight", "requires_gym": False, "warmup_only": True},
    {"name": "Torso Twists", "muscle_group": "buik", "level": "beginner", "category": "bodyweight", "requires_gym": False, "warmup_only": True},
    {"name": "Arm Swings", "muscle_group": "armen", "level": "beginner", "category": "bodyweight", "requires_gym": False, "warmup_only": True},

    # --- Gymnastics (8, skill movements - equipment need varies per movement) ---
    {"name": "Rope Climb", "muscle_group": "armen", "level": "advanced", "category": "gymnastics", "requires_gym": True},
    {"name": "Handstand Push-up", "muscle_group": "schouders", "level": "advanced", "category": "gymnastics", "requires_gym": False},
    {"name": "Handstand Walk", "muscle_group": "schouders", "level": "advanced", "category": "gymnastics", "requires_gym": False},
    {"name": "Pistol Squat", "muscle_group": "benen", "level": "advanced", "category": "gymnastics", "requires_gym": False},
    {"name": "Box Jump", "muscle_group": "benen", "level": "intermediate", "category": "gymnastics", "requires_gym": True},
    {"name": "Box Step-Up", "muscle_group": "benen", "level": "beginner", "category": "gymnastics", "requires_gym": True, "is_hyrox": True},
    # Was requires_gym=False - wrong: double-unders need a jump rope, not something everyone owns.
    {"name": "Double Unders", "muscle_group": "volledig_lichaam", "level": "intermediate", "category": "gymnastics", "requires_gym": True, "equipment_tag": "jump_rope"},
    {"name": "Wall Ball Shot", "muscle_group": "volledig_lichaam", "level": "intermediate", "category": "gymnastics", "requires_gym": True, "is_hyrox": True},
    {"name": "L-Sit", "muscle_group": "buik", "level": "advanced", "category": "gymnastics", "requires_gym": True},
    {"name": "Sled Push", "muscle_group": "volledig_lichaam", "level": "beginner", "category": "gymnastics", "requires_gym": True, "rx_weight_male_kg": 50, "rx_weight_female_kg": 30, "is_hyrox": True},
    {"name": "Sled Pull", "muscle_group": "volledig_lichaam", "level": "beginner", "category": "gymnastics", "requires_gym": True, "rx_weight_male_kg": 50, "rx_weight_female_kg": 30, "is_hyrox": True},
    {"name": "Wall Walk", "muscle_group": "schouders", "level": "advanced", "category": "gymnastics", "requires_gym": False},
    {"name": "Box Jump Over", "muscle_group": "benen", "level": "intermediate", "category": "gymnastics", "requires_gym": True},
    {"name": "Burpee Box Jump Over", "muscle_group": "volledig_lichaam", "level": "intermediate", "category": "gymnastics", "requires_gym": True, "base_movement": "burpee"},
    {"name": "Medicine Ball Slam", "muscle_group": "volledig_lichaam", "level": "beginner", "category": "gymnastics", "requires_gym": True},
    {"name": "GHD Sit-up", "muscle_group": "buik", "level": "advanced", "category": "gymnastics", "requires_gym": True},

    # --- Cardio (4, is_cardio=True, no weight - unlocked at home via cardio_type, not equipment_tag) ---
    {"name": "Assault Bike", "muscle_group": "cardio", "level": "beginner", "category": "cardio", "requires_gym": True, "is_cardio": True, "cardio_type": "assault_bike", "is_hyrox": True},
    {"name": "Ski Erg", "muscle_group": "cardio", "level": "beginner", "category": "cardio", "requires_gym": True, "is_cardio": True, "cardio_type": "ski_erg", "is_hyrox": True},
    {"name": "Row", "muscle_group": "cardio", "level": "beginner", "category": "cardio", "requires_gym": True, "is_cardio": True, "cardio_type": "row", "is_hyrox": True},
    # Was requires_gym=False (always available at home) - wrong: not everyone can/wants to run
    # outside from home, so this is now an explicit opt-in like the other cardio machines.
    {"name": "Running", "muscle_group": "cardio", "level": "beginner", "category": "cardio", "requires_gym": True, "is_cardio": True, "cardio_type": "run", "is_hyrox": True},

    # --- Stretching (static holds, used by the Stretch & Core-WOD option, not warmup) ---
    # level=beginner for all - a static stretch isn't gated by strength level like the rest
    # of the pool, so this keeps them selectable regardless of the profile's niveau.
    {"name": "Shoulder Cross-body Stretch", "muscle_group": "schouders", "level": "beginner", "category": "stretching", "requires_gym": False},
    {"name": "Child's Pose", "muscle_group": "rug", "level": "beginner", "category": "stretching", "requires_gym": False},
    {"name": "Doorway Chest Stretch", "muscle_group": "borst", "level": "beginner", "category": "stretching", "requires_gym": False},
    {"name": "Triceps Overhead Stretch", "muscle_group": "armen", "level": "beginner", "category": "stretching", "requires_gym": False},
    {"name": "Seated Hamstring Stretch", "muscle_group": "benen", "level": "beginner", "category": "stretching", "requires_gym": False},
    {"name": "Quad Stretch (Staand)", "muscle_group": "benen", "level": "beginner", "category": "stretching", "requires_gym": False},
    {"name": "Figure-4 Glute Stretch", "muscle_group": "billen", "level": "beginner", "category": "stretching", "requires_gym": False},
    {"name": "Cobra Stretch", "muscle_group": "buik", "level": "beginner", "category": "stretching", "requires_gym": False},
    {"name": "Standing Forward Fold", "muscle_group": "volledig_lichaam", "level": "beginner", "category": "stretching", "requires_gym": False},
    {"name": "Reclined Spinal Twist", "muscle_group": "volledig_lichaam", "level": "beginner", "category": "stretching", "requires_gym": False},

    # --- Extra stretches (20) - aangevuld nadat bleek dat "rug" bij Stretch & Core maar 2
    # oefeningen had (en schouders/borst/armen ook flink dun waren). Onderzocht via de gangbare
    # fysio-/mobility-bronnen (Cleveland Clinic, Healthline, Mayo Clinic e.a., zie sessie-
    # geschiedenis) - geen verzonnen namen. "Neck Tilt"/"Levator Scapulae"/"Behind-the-Back
    # Shoulder Stretch" vallen onder schouders (er is geen aparte "nek"-spiergroep in dit model;
    # nekklachten worden elders al via CONDITION_RULES["nekblessure"] afgehandeld, los van
    # muscle_group). Namen zijn bewust anders dan de bestaande bodyweight-oefeningen "Cat-Cow
    # Stretch"/"Superman Hold"/"World's Greatest Stretch" (die zijn dynamische warmup-drills,
    # geen statische stretch-holds - dezelfde naam zou de seeder's naam-matching laten botsen).
    {"name": "Knee-to-Chest Stretch", "muscle_group": "rug", "level": "beginner", "category": "stretching", "requires_gym": False},
    {"name": "Seated Spinal Twist", "muscle_group": "rug", "level": "beginner", "category": "stretching", "requires_gym": False},
    {"name": "Thread the Needle", "muscle_group": "rug", "level": "beginner", "category": "stretching", "requires_gym": False},
    {"name": "Neck Tilt Stretch", "muscle_group": "schouders", "level": "beginner", "category": "stretching", "requires_gym": False},
    {"name": "Levator Scapulae Stretch", "muscle_group": "schouders", "level": "beginner", "category": "stretching", "requires_gym": False},
    {"name": "Shoulder Roll Stretch", "muscle_group": "schouders", "level": "beginner", "category": "stretching", "requires_gym": False},
    {"name": "Behind-the-Back Shoulder Stretch", "muscle_group": "schouders", "level": "beginner", "category": "stretching", "requires_gym": False},
    {"name": "Lying Pectoral Stretch", "muscle_group": "borst", "level": "beginner", "category": "stretching", "requires_gym": False},
    {"name": "Kneeling Chest Stretch", "muscle_group": "borst", "level": "beginner", "category": "stretching", "requires_gym": False},
    {"name": "Bicep Wall Stretch", "muscle_group": "armen", "level": "beginner", "category": "stretching", "requires_gym": False},
    {"name": "Wrist Flexor Stretch", "muscle_group": "armen", "level": "beginner", "category": "stretching", "requires_gym": False},
    {"name": "Wrist Extensor Stretch", "muscle_group": "armen", "level": "beginner", "category": "stretching", "requires_gym": False},
    {"name": "Kneeling Hip Flexor Stretch", "muscle_group": "benen", "level": "beginner", "category": "stretching", "requires_gym": False},
    {"name": "Couch Stretch", "muscle_group": "benen", "level": "beginner", "category": "stretching", "requires_gym": False},
    {"name": "Calf Stretch (Muur)", "muscle_group": "benen", "level": "beginner", "category": "stretching", "requires_gym": False},
    {"name": "90/90 Hip Stretch", "muscle_group": "benen", "level": "beginner", "category": "stretching", "requires_gym": False},
    {"name": "Pigeon Pose", "muscle_group": "billen", "level": "beginner", "category": "stretching", "requires_gym": False},
    {"name": "Standing Glute Stretch", "muscle_group": "billen", "level": "beginner", "category": "stretching", "requires_gym": False},
    {"name": "Downward Dog", "muscle_group": "volledig_lichaam", "level": "beginner", "category": "stretching", "requires_gym": False},

    # --- Core-stabiliteit (8, static holds - same category="stretching" pool as above, so
    # the Stretch & Core-WOD needs no new backend logic: it already builds a duration-based
    # hold sequence per muscle group from this category). Unlike pure flexibility stretches
    # these have a real difficulty progression, hence Hollow Body Hold is intermediate.
    {"name": "Plank Hold", "muscle_group": "buik", "level": "beginner", "category": "stretching", "requires_gym": False},
    {"name": "Side Plank Hold", "muscle_group": "buik", "level": "beginner", "category": "stretching", "requires_gym": False},
    {"name": "Dead Bug", "muscle_group": "buik", "level": "beginner", "category": "stretching", "requires_gym": False},
    {"name": "Reverse Plank Hold", "muscle_group": "buik", "level": "intermediate", "category": "stretching", "requires_gym": False},
    {"name": "Bird Dog Hold", "muscle_group": "rug", "level": "beginner", "category": "stretching", "requires_gym": False},
    {"name": "Locust Hold", "muscle_group": "rug", "level": "beginner", "category": "stretching", "requires_gym": False},
    {"name": "Glute Bridge Hold", "muscle_group": "billen", "level": "beginner", "category": "stretching", "requires_gym": False},
    {"name": "Hollow Body Hold", "muscle_group": "buik", "level": "intermediate", "category": "stretching", "requires_gym": False},
]
