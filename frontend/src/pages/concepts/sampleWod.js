// Static sample data shared by every /concept/* mockup, so the layouts are directly comparable.
// Deliberately not fetched from the API - these pages are pure design previews.
export function makeSampleWod() {
  return {
    total_duration_minutes: 28,
    level_used: "gemiddeld",
    blocks: [
      {
        block_type: "warmup",
        training_type: null,
        duration_minutes: 8,
        rounds: 2,
        rep_scheme: null,
        exercises: [
          { exercise_id: 1, name: "Jumping Jack", muscle_group: "volledig_lichaam", category: "bodyweight", reps: 15, alternatives: [{ id: 9, name: "High Knees" }] },
          { exercise_id: 2, name: "Air Squat", muscle_group: "benen", category: "bodyweight", reps: 12, alternatives: [{ id: 20, name: "Walking Lunge" }] },
          { exercise_id: 3, name: "Arm Circles", muscle_group: "schouders", category: "bodyweight", reps: 15, alternatives: [] },
        ],
      },
      {
        block_type: "main",
        training_type: "AMRAP",
        duration_minutes: 20,
        rounds: "AMRAP",
        rep_scheme: "flat",
        exercises: [
          {
            exercise_id: 10, name: "Kettlebell Swing", muscle_group: "billen", category: "kettlebell", reps: 15,
            own_weight_kg: null, suggested_weight_male_kg: 24, suggested_weight_female_kg: 16,
            alternatives: [{ id: 11, name: "DB Swing" }],
          },
          {
            exercise_id: 12, name: "Box Jump", muscle_group: "benen", category: "gymnastics", reps: 10,
            alternatives: [{ id: 13, name: "Box Step-Up" }],
          },
          {
            exercise_id: 14, name: "Row", muscle_group: "cardio", category: "cardio", distance_meters: 250,
            cardio_type: "row", alternatives: [],
          },
          {
            exercise_id: 15, name: "Wall Ball", muscle_group: "benen", category: "barbell", reps: 12,
            own_weight_kg: 9, alternatives: [{ id: 16, name: "Thruster" }],
          },
        ],
      },
    ],
  };
}
