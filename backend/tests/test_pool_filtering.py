import pytest

from app.schemas import WodGenerateRequest
from app.wod_generator import WodGenerationError, generate_wod


def _request(**overrides):
    defaults = dict(
        user_id="test-user-1",
        length_minutes=20,
        muscle_groups=["benen"],
        training_type="AMRAP",
        location="gym",
    )
    defaults.update(overrides)
    return WodGenerateRequest(**defaults)


def _main_exercise_names(wod):
    main_block = next(b for b in wod.blocks if b.block_type == "main")
    return {e.name for e in main_block.exercises}


class TestMuscleGroupFiltering:
    def test_single_muscle_group_only_uses_that_group(self, db, seed_exercises, make_profile):
        profile = make_profile()
        wod = generate_wod(db, profile, _request(muscle_groups=["borst"]))
        names = _main_exercise_names(wod)
        assert names <= {"Push-up", "Bench Press"}
        assert names

    def test_volledig_lichaam_expands_to_all_groups(self, db, seed_exercises, make_profile):
        """"Volledig lichaam" means "any muscle group is fair game", not "only exercises
        literally tagged volledig_lichaam" - see wod_generator.py's own comment on this."""
        profile = make_profile()
        wod = generate_wod(db, profile, _request(muscle_groups=["volledig_lichaam"], exercise_count=8))
        names = _main_exercise_names(wod)
        # Should be able to draw from specific-muscle-group exercises, not just the two
        # exercises literally tagged volledig_lichaam (Burpee, Thruster).
        assert names - {"Burpee", "Thruster"}

    def test_stretching_category_never_leaks_into_main_block(self, db, seed_exercises, make_profile):
        profile = make_profile()
        wod = generate_wod(db, profile, _request(muscle_groups=["buik"], exercise_count=5))
        assert "Cobra Stretch" not in _main_exercise_names(wod)

    def test_no_exercises_for_group_raises(self, db, make_profile):
        """No seed_exercises fixture used here - an empty database should fail loudly, not
        silently return an empty/broken WOD."""
        profile = make_profile()
        with pytest.raises(WodGenerationError):
            generate_wod(db, profile, _request(muscle_groups=["benen"]))


class TestLevelFiltering:
    def test_beginner_profile_excludes_advanced_exercises(self, db, seed_exercises, make_profile):
        profile = make_profile(level="beginner")
        wod = generate_wod(db, profile, _request(muscle_groups=["benen"], exercise_count=3))
        assert "Pistol Squat" not in _main_exercise_names(wod)  # advanced-only

    def test_advanced_profile_can_include_advanced_exercises(self, db, seed_exercises, make_profile):
        profile = make_profile(level="advanced")
        # Force a small, deterministic-ish pool by asking for every slot with only "benen".
        wod = generate_wod(db, profile, _request(muscle_groups=["benen"], exercise_count=3))
        names = _main_exercise_names(wod)
        # All three benen exercises (beginner/intermediate/advanced) should be eligible.
        assert names <= {"Air Squat", "Back Squat", "Pistol Squat"}

    def test_deviate_level_only_applies_when_profile_allows_it(self, db, seed_exercises, make_profile):
        profile = make_profile(level="beginner", use_profile_level_default=True)
        wod = generate_wod(
            db, profile,
            _request(muscle_groups=["benen"], exercise_count=3, deviate_level="advanced"),
        )
        # use_profile_level_default=True means deviate_level is ignored - still beginner-gated.
        assert "Pistol Squat" not in _main_exercise_names(wod)

        profile.use_profile_level_default = False
        db.commit()
        wod = generate_wod(
            db, profile,
            _request(muscle_groups=["benen"], exercise_count=3, deviate_level="advanced"),
        )
        assert "Pistol Squat" in _main_exercise_names(wod) or "Back Squat" in _main_exercise_names(wod)


class TestHomeEquipmentGating:
    def test_home_location_excludes_gym_only_exercises_without_equipment(self, db, seed_exercises, make_profile):
        profile = make_profile(home_equipment=[])
        wod = generate_wod(db, profile, _request(muscle_groups=["borst"], location="home"))
        assert _main_exercise_names(wod) == {"Push-up"}  # Bench Press needs a barbell

    def test_owned_equipment_unlocks_matching_exercises(self, db, seed_exercises, make_profile):
        # Bench Press is level="intermediate" - a beginner profile would filter it out for an
        # unrelated reason (niveau, not equipment), so use intermediate to isolate what this
        # test actually checks.
        profile = make_profile(level="intermediate", home_equipment=["barbell"])
        wod = generate_wod(db, profile, _request(muscle_groups=["borst"], location="home", exercise_count=2))
        assert "Bench Press" in _main_exercise_names(wod)

    def test_owned_equipment_does_not_unlock_unrelated_gear(self, db, seed_exercises, make_profile):
        """Owning dumbbells shouldn't unlock a barbell-only exercise - equipment_tag is
        specific gear, not a blanket "has gym stuff" flag."""
        profile = make_profile(home_equipment=["dumbbell"])
        wod = generate_wod(db, profile, _request(muscle_groups=["borst"], location="home"))
        assert _main_exercise_names(wod) == {"Push-up"}
