import { useState } from "react";

import ConceptBanner from "./ConceptBanner";
import { nextExtraExercise } from "./extraExercises";
import { makeSampleWod } from "./sampleWod";

const BLOCK_LABELS = { warmup: "Warming-up", main: "Workout", cardio: "Cardio" };

function statText(e) {
  const parts = [];
  if (e.reps != null) parts.push(`${e.reps}x`);
  if (e.duration_seconds != null) parts.push(`${e.duration_seconds}s`);
  if (e.distance_meters != null) parts.push(`${e.distance_meters}m`);
  if (e.calories != null) parts.push(`${e.calories}cal`);
  if (e.own_weight_kg) parts.push(`${e.own_weight_kg}kg`);
  else if (e.suggested_weight_male_kg != null) parts.push(`${e.suggested_weight_male_kg}kg RX`);
  return parts.join(" · ");
}

export default function AccordionConcept() {
  const [wod, setWod] = useState(makeSampleWod);

  const removeExercise = (blockIndex, exerciseIndex) => {
    setWod((prev) => {
      const blocks = prev.blocks.map((b, i) =>
        i === blockIndex ? { ...b, exercises: b.exercises.filter((_, idx) => idx !== exerciseIndex) } : b
      );
      return { ...prev, blocks };
    });
  };

  const addExercise = (blockIndex) => {
    setWod((prev) => {
      const blocks = prev.blocks.map((b, i) =>
        i === blockIndex ? { ...b, exercises: [...b.exercises, nextExtraExercise()] } : b
      );
      return { ...prev, blocks };
    });
  };

  return (
    <div>
      <h1>WOD maken</h1>
      <ConceptBanner title="Concept 3 · Uitklapbaar — blokken staan standaard dicht" />

      <div className="card" style={{ marginBottom: 12 }}>
        <p className="field-hint" style={{ margin: 0 }}>
          <strong>In het kort</strong> · Niveau: {wod.level_used} · Totaal: {wod.total_duration_minutes} min
        </p>
      </div>

      {wod.blocks.map((block, blockIndex) => {
        const heading = BLOCK_LABELS[block.block_type] ?? block.block_type;
        const namesLine = block.exercises.map((e) => e.name).join(", ");
        return (
          <details key={blockIndex} className="collapsible" open={block.block_type === "main"} style={{ marginBottom: 8 }}>
            <summary>
              <span>
                {heading} <span className="field-hint">({block.duration_minutes} min{block.training_type ? ` · ${block.training_type}` : ""})</span>
                <div className="field-hint" style={{ marginTop: 2 }}>{namesLine}</div>
              </span>
            </summary>
            <div className="collapsible-body">
              {block.exercises.map((exercise, exerciseIndex) => (
                <div
                  key={`${exercise.exercise_id}-${exerciseIndex}`}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "8px 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600 }}>{exercise.name}</div>
                    <div className="field-hint" style={{ margin: 0 }}>{statText(exercise)}</div>
                  </div>
                  <button type="button" className="btn-icon" aria-label="Uitleg">▶</button>
                  {exercise.alternatives.length > 0 && (
                    <button type="button" className="btn-icon" aria-label="Wissel">⇄</button>
                  )}
                  <button
                    type="button"
                    className="btn-icon"
                    aria-label="Verwijder"
                    onClick={() => removeExercise(blockIndex, exerciseIndex)}
                  >
                    −
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn-icon"
                style={{ width: "100%", marginTop: 6, justifyContent: "center" }}
                onClick={() => addExercise(blockIndex)}
              >
                + Oefening toevoegen
              </button>
            </div>
          </details>
        );
      })}

      <p className="field-hint">
        Verschil met nu: elk blok (Warming-up/Workout/Cardio) staat standaard dicht met alleen een
        titel + oefeningnamen op één regel - net als "In het kort", maar dan per blok en
        uitklapbaar om te bewerken. Handig zodra er 3+ blokken zijn (warming-up + workout + cardio);
        minder zinvol bij één enkel blok.
      </p>
    </div>
  );
}
