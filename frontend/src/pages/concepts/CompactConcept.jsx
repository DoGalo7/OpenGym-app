import { useState } from "react";

import ConceptBanner from "./ConceptBanner";
import { nextExtraExercise } from "./extraExercises";
import { makeSampleWod } from "./sampleWod";

const BLOCK_LABELS = { warmup: "Warming-up", main: "Workout", cardio: "Cardio" };

function editableWeightValue(e) {
  return e.own_weight_kg ?? e.suggested_weight_male_kg ?? e.suggested_weight_female_kg ?? "";
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

  const updateField = (blockIndex, exerciseIndex, field, value) => {
    setWod((prev) => {
      const blocks = prev.blocks.map((b, i) => {
        if (i !== blockIndex) return b;
        const exercises = b.exercises.map((e, idx) => (idx === exerciseIndex ? { ...e, [field]: value } : e));
        return { ...b, exercises };
      });
      return { ...prev, blocks };
    });
  };

  const inputStyle = { width: 44, padding: "3px 4px", fontSize: 13 };

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
            {block.exercises.map((exercise, exerciseIndex) => {
              const showsWeight =
                exercise.own_weight_kg != null ||
                exercise.suggested_weight_male_kg != null ||
                exercise.suggested_weight_female_kg != null;
              return (
                <div
                  key={`${exercise.exercise_id}-${exerciseIndex}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 0",
                    borderBottom: "1px solid var(--color-border)",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: "1 1 140px", minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{exercise.name}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    {exercise.reps != null && (
                      <span className="inline-edit">
                        <input
                          type="number"
                          min={1}
                          value={exercise.reps}
                          onChange={(event) => updateField(blockIndex, exerciseIndex, "reps", Number(event.target.value))}
                          aria-label={`Herhalingen voor ${exercise.name}`}
                          style={inputStyle}
                        />
                        <span className="field-hint" style={{ fontSize: 11 }}>x</span>
                      </span>
                    )}
                    {exercise.duration_seconds != null && (
                      <span className="inline-edit">
                        <input
                          type="number"
                          min={5}
                          value={exercise.duration_seconds}
                          onChange={(event) =>
                            updateField(blockIndex, exerciseIndex, "duration_seconds", Number(event.target.value))
                          }
                          aria-label={`Duur voor ${exercise.name}`}
                          style={inputStyle}
                        />
                        <span className="field-hint" style={{ fontSize: 11 }}>s</span>
                      </span>
                    )}
                    {exercise.distance_meters != null && (
                      <span className="inline-edit">
                        <input
                          type="number"
                          min={1}
                          value={exercise.distance_meters}
                          onChange={(event) =>
                            updateField(blockIndex, exerciseIndex, "distance_meters", Number(event.target.value))
                          }
                          aria-label={`Afstand voor ${exercise.name}`}
                          style={inputStyle}
                        />
                        <span className="field-hint" style={{ fontSize: 11 }}>m</span>
                      </span>
                    )}
                    {exercise.calories != null && (
                      <span className="inline-edit">
                        <input
                          type="number"
                          min={1}
                          value={exercise.calories}
                          onChange={(event) => updateField(blockIndex, exerciseIndex, "calories", Number(event.target.value))}
                          aria-label={`Calorieën voor ${exercise.name}`}
                          style={inputStyle}
                        />
                        <span className="field-hint" style={{ fontSize: 11 }}>cal</span>
                      </span>
                    )}
                    {showsWeight && (
                      <span className="inline-edit">
                        <input
                          type="number"
                          min={0}
                          step={0.5}
                          value={editableWeightValue(exercise)}
                          onChange={(event) =>
                            updateField(
                              blockIndex, exerciseIndex, "own_weight_kg",
                              event.target.value === "" ? null : Number(event.target.value)
                            )
                          }
                          aria-label={`Gewicht voor ${exercise.name}`}
                          style={inputStyle}
                        />
                        <span className="field-hint" style={{ fontSize: 11 }}>kg</span>
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
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
                </div>
              );
            })}
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
        Bijgewerkt: reps/tijd/afstand/calorieën/gewicht zijn nu wél gewoon aan te passen, net als
        vandaag - alleen staan ze compact naast elkaar op de oefeningregel zelf in plaats van
        eronder in aparte velden. Acties (Uitleg/Wissel/Verwijder) zijn icoon-only en de ▲▼
        volgorde-knoppen zijn hier weggelaten (in het echt: vervangen door slepen). Dat scheelt
        nog steeds ruim 30% hoogte per oefening.
      </p>
    </div>
  );
}
