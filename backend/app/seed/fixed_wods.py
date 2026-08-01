# "structure" is newline-separated: first line is the scheme label (e.g. "Voor tijd",
# "AMRAP 20 minuten"), the rest are individual movements - one per line. This keeps the
# frontend renderable as a clean label + list instead of one dense paragraph.
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
    },
    {
        "name": "Fran",
        "wod_category": "girls",
        "description": "Klassieke 'Girl WOD', berucht om zijn intensiteit ondanks de korte duur.",
        "structure": "21-15-9 voor tijd\nThrusters (43/30 kg)\nPull-ups",
        "time_cap_minutes": None,
    },
    {
        "name": "Grace",
        "wod_category": "girls",
        "description": "Korte, zware WOD die kracht-uithoudingsvermogen test.",
        "structure": "30 herhalingen voor tijd\nClean & Jerk (61/43 kg)",
        "time_cap_minutes": None,
    },
    {
        "name": "Diane",
        "wod_category": "girls",
        "description": "Zware deadlifts gecombineerd met een gymnastiek-skill.",
        "structure": "21-15-9 voor tijd\nDeadlifts (102/70 kg)\nHandstand Push-ups",
        "time_cap_minutes": None,
    },
    {
        "name": "Helen",
        "wod_category": "girls",
        "description": "Klassieke combinatie van cardio, kracht en trekkracht.",
        "structure": "3 ronden voor tijd\n400m hardlopen\n21 Kettlebell swings (24/16 kg)\n12 Pull-ups",
        "time_cap_minutes": None,
    },
    {
        "name": "Cindy",
        "wod_category": "girls",
        "description": "Zoveel mogelijk ronden in 20 minuten - test uithoudingsvermogen.",
        "structure": "AMRAP 20 minuten\n5 Pull-ups\n10 Push-ups\n15 Air Squats",
        "time_cap_minutes": 20,
    },
    {
        "name": "Annie",
        "wod_category": "girls",
        "description": "Snelle, hoog-volume WOD gericht op coordinatie en buikspieren.",
        "structure": "50-40-30-20-10 voor tijd\nDouble-unders\nSit-ups",
        "time_cap_minutes": None,
    },
    {
        "name": "DT",
        "wod_category": "soldier",
        "description": "Hero WOD ter nagedachtenis aan Special Forces Sergeant Timothy Davis.",
        "structure": "5 ronden voor tijd\n12 Deadlifts\n9 Hang Power Cleans\n6 Push Jerks (halterstang 70/47.5 kg)",
        "time_cap_minutes": None,
    },
    {
        "name": "Nate",
        "wod_category": "soldier",
        "description": "Hero WOD ter nagedachtenis aan Chief Petty Officer Nate Hardy.",
        "structure": "AMRAP 20 minuten\n2 Muscle-ups\n4 Handstand Push-ups\n8 Kettlebell swings (32/24 kg)",
        "time_cap_minutes": 20,
    },
]
