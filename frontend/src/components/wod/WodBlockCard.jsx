import ExerciseRow from "./ExerciseRow";

const BLOCK_LABELS = { warmup: "Warming-up", main: "Workout", cardio: "Cardio" };

function blockSummaryRest(block) {
  const parts = [];
  if (block.training_type && block.training_type !== "STRETCH") parts.push(block.training_type.replace("_", " "));
  // "1 ronden" naast een aflopende ladder (bijv. Annie's "50-40-30-20-10") oogt tegenstrijdig -
  // rounds is dan alleen intern een teller, geen zinvolle info voor de sporter. Vanaf 2 ronden
  // (bijv. Fran's 21-15-9 in 3 "ronden") is het wel relevant om te tonen.
  if (typeof block.rounds === "number" && block.rounds > 1) parts.push(`${block.rounds} ronden`);
  if (block.rep_scheme && block.rep_scheme !== "flat") parts.push(block.rep_scheme);
  return parts.join(" · ");
}

export default function WodBlockCard({
  block, sex, onSwapExercise, onExerciseFieldChange, onMoveExercise, onDurationChange, readOnly = false,
}) {
  const rest = blockSummaryRest(block);
  const heading = block.training_type === "STRETCH" ? "Stretch & Core" : BLOCK_LABELS[block.block_type] ?? block.block_type;

  return (
    <div className="card">
      <h3>{heading}</h3>
      <p className="field-hint" style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {readOnly || !onDurationChange ? (
          `${block.duration_minutes} min`
        ) : (
          <span className="inline-edit">
            <input
              type="number"
              min={1}
              max={120}
              value={block.duration_minutes}
              onChange={(event) => onDurationChange(Number(event.target.value))}
              aria-label={`Duur van ${heading}`}
              style={{ width: 52 }}
            />
            min
          </span>
        )}
        {rest && ` · ${rest}`}
      </p>
      {block.exercises.map((exercise, index) => (
        <ExerciseRow
          key={`${exercise.exercise_id}-${index}`}
          exercise={exercise}
          sex={sex}
          readOnly={readOnly}
          onSwap={readOnly ? undefined : (alternative) => onSwapExercise(index, alternative)}
          onFieldChange={readOnly ? undefined : (field, value) => onExerciseFieldChange(index, field, value)}
          onMoveUp={readOnly || !onMoveExercise || index === 0 ? undefined : () => onMoveExercise(index, -1)}
          onMoveDown={
            readOnly || !onMoveExercise || index === block.exercises.length - 1
              ? undefined
              : () => onMoveExercise(index, 1)
          }
        />
      ))}
    </div>
  );
}
