// Small canned pool the concept pages cycle through when "+ Oefening toevoegen" is clicked -
// good enough to preview how the add-flow fits the layout without wiring a real search.
export const EXTRA_EXERCISES = [
  { exercise_id: 30, name: "Push-up", muscle_group: "borst", category: "bodyweight", reps: 12, alternatives: [] },
  { exercise_id: 31, name: "Sit-up", muscle_group: "buik", category: "bodyweight", reps: 15, alternatives: [] },
  { exercise_id: 32, name: "Burpee", muscle_group: "volledig_lichaam", category: "bodyweight", reps: 10, alternatives: [] },
  { exercise_id: 33, name: "Deadlift", muscle_group: "rug", category: "barbell", reps: 8, own_weight_kg: 40, alternatives: [] },
];

let cursor = 0;
export function nextExtraExercise() {
  const exercise = EXTRA_EXERCISES[cursor % EXTRA_EXERCISES.length];
  cursor += 1;
  return { ...exercise, exercise_id: exercise.exercise_id * 1000 + cursor };
}
