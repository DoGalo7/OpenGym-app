import { useState } from "react";

import ConceptBanner from "./ConceptBanner";
import { nextExtraExercise } from "./extraExercises";
import { makeSampleWod } from "./sampleWod";

const BLOCK_LABELS = { warmup: "Warming-up", main: "Workout", cardio: "Cardio" };

function statText(e) {
  if (e.reps != null) return `${e.reps}x`;
  if (e.duration_seconds != null) return `${e.duration_seconds}s`;
  if (e.distance_meters != null) return `${e.distance_meters}m`;
  if (e.calories != null) return `${e.calories}cal`;
  return null;
}

function weightText(e) {
  if (e.own_weight_kg) return `${e.own_weight_kg}kg`;
  if (e.suggested_weight_male_kg != null && e.suggested_weight_female_kg != null) {
    return `${e.suggested_weight_male_kg}/${e.suggested_weight_female_kg}kg`;
  }
  if (e.suggested_weight_male_kg != null) return `${e.suggested_weight_male_kg}kg`;
  return null;
}

export default function CompactConcept() {
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
      <ConceptBanner title="Concept 1 · Compact — dezelfde opzet als nu, maar strakker" />

      <div className="card" style={{ padding: 10, marginBottom: 8 }}>
        <p className="field-hint" style={{ margin: 0 }}>
          <strong>In het kort</strong> · Niveau: {wod.level_used} · Totaal: {wod.total_duration_minutes} min
        </p>
      </div>

      {wod.blocks.map((block, blockIndex) => {
        const heading = BLOCK_LABELS[block.block_type] ?? block.block_type;
        return (
          <div key={blockIndex} className="card" style={{ padding: 10, marginBottom: 8 }}>
            <p className="field-hint" style={{ margin: "0 0 6px", display: "flex", justifyContent: "space-between" }}>
              <strong style={{ color: "var(--color-text)" }}>{heading}</strong>
              <span>
                {block.duration_minutes} min
                {block.training_type ? ` · ${block.training_type}` : ""}
              </span>
            </p>
            {block.exercises.map((exercise, exerciseIndex) => (
              <div
                key={`${exercise.exercise_id}-${exerciseIndex}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 0",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{exercise.name}</div>
                  <div className="field-hint" style={{ margin: 0, fontSize: 12 }}>
                    {[statText(exercise), weightText(exercise)].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <button type="button" className="btn-icon" style={{ padding: "4px 6px", minHeight: 36 }} aria-label="Uitleg">
                  ▶
                </button>
                {exercise.alternatives.length > 0 && (
                  <button type="button" className="btn-icon" style={{ padding: "4px 6px", minHeight: 36 }} aria-label="Wissel">
                    ⇄
                  </button>
                )}
                <button
                  type="button"
                  className="btn-icon"
                  style={{ padding: "4px 6px", minHeight: 36 }}
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
        );
      })}

      <p className="field-hint">
        Verschil met nu: reps/gewicht staan op één regel onder de naam i.p.v. als losse
        invoervelden ernaast, acties (Uitleg/Wissel/Verwijder) zijn icoon-only, en de ▲▼
        volgorde-knoppen zijn hier weggelaten (in het echt: vervangen door slepen). In deze
        preview zijn reps/gewicht nog platte tekst - bewerken zou verder hetzelfde werken als nu,
        alleen compacter. Dat scheelt per oefening zo'n 40% hoogte.
      </p>
    </div>
  );
}
