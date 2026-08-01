import ExerciseRow from "./ExerciseRow";

const BLOCK_LABELS = { warmup: "Warming-up", main: "Hoofdblok", cardio: "Cardio" };

function blockSummary(block) {
  const parts = [`${block.duration_minutes} min`];
  if (block.training_type) parts.push(block.training_type.replace("_", " "));
  if (typeof block.rounds === "number") parts.push(`${block.rounds} ronden`);
  if (block.rep_scheme && block.rep_scheme !== "flat") parts.push(block.rep_scheme);
  return parts.join(" · ");
}

export default function WodBlockCard({ block, sex, onSwapExercise, onExerciseFieldChange, readOnly = false }) {
  return (
    <div className="card">
      <h3>{BLOCK_LABELS[block.block_type] ?? block.block_type}</h3>
      <p className="field-hint">{blockSummary(block)}</p>
      {block.exercises.map((exercise, index) => (
        <ExerciseRow
          key={`${exercise.exercise_id}-${index}`}
          exercise={exercise}
          sex={sex}
          readOnly={readOnly}
          onSwap={readOnly ? undefined : (alternative) => onSwapExercise(index, alternative)}
          onFieldChange={readOnly ? undefined : (field, value) => onExerciseFieldChange(index, field, value)}
        />
      ))}
    </div>
  );
}
