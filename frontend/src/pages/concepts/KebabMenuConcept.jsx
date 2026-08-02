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

export default function KebabMenuConcept() {
  const [wod, setWod] = useState(makeSampleWod);
  const [openMenu, setOpenMenu] = useState(null);

  const removeExercise = (blockIndex, exerciseIndex) => {
    setWod((prev) => {
      const blocks = prev.blocks.map((b, i) =>
        i === blockIndex ? { ...b, exercises: b.exercises.filter((_, idx) => idx !== exerciseIndex) } : b
      );
      return { ...prev, blocks };
    });
    setOpenMenu(null);
  };

  const moveExercise = (blockIndex, exerciseIndex, direction) => {
    setWod((prev) => {
      const blocks = prev.blocks.map((b, i) => {
        if (i !== blockIndex) return b;
        const target = exerciseIndex + direction;
        if (target < 0 || target >= b.exercises.length) return b;
        const exercises = [...b.exercises];
        [exercises[exerciseIndex], exercises[target]] = [exercises[target], exercises[exerciseIndex]];
        return { ...b, exercises };
      });
      return { ...prev, blocks };
    });
    setOpenMenu(null);
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
      <ConceptBanner title="Concept 2 · Menu — acties achter een ⋮-knop" />

      <div className="card" style={{ marginBottom: 12 }}>
        <p className="field-hint" style={{ margin: 0 }}>
          <strong>In het kort</strong> · Niveau: {wod.level_used} · Totaal: {wod.total_duration_minutes} min
        </p>
      </div>

      {wod.blocks.map((block, blockIndex) => {
        const heading = BLOCK_LABELS[block.block_type] ?? block.block_type;
        return (
          <div key={blockIndex} className="card" style={{ marginBottom: 12 }}>
            <h3 style={{ margin: "0 0 8px" }}>
              {heading}{" "}
              <span className="field-hint" style={{ fontWeight: 400 }}>
                {block.duration_minutes} min{block.training_type ? ` · ${block.training_type}` : ""}
              </span>
            </h3>
            {block.exercises.map((exercise, exerciseIndex) => {
              const key = `${blockIndex}-${exerciseIndex}`;
              return (
                <div key={key} style={{ position: "relative", borderBottom: "1px solid var(--color-border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>{exercise.name}</div>
                      <div className="field-hint" style={{ margin: 0 }}>{statText(exercise)}</div>
                    </div>
                    <button
                      type="button"
                      className="btn-icon"
                      style={{ minWidth: 44, minHeight: 44, fontSize: 18 }}
                      aria-label={`Meer acties voor ${exercise.name}`}
                      onClick={() => setOpenMenu(openMenu === key ? null : key)}
                    >
                      ⋮
                    </button>
                  </div>
                  {openMenu === key && (
                    <>
                      <button
                        type="button"
                        aria-label="Sluit menu"
                        onClick={() => setOpenMenu(null)}
                        style={{
                          position: "fixed", inset: 0, background: "transparent", border: "none", zIndex: 19, cursor: "default",
                        }}
                      />
                      <div
                        className="card"
                        style={{
                          position: "absolute", right: 0, top: "100%", zIndex: 20, minWidth: 200,
                          padding: 6, boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                        }}
                      >
                        <a
                          className="btn-icon"
                          style={{ width: "100%", justifyContent: "flex-start" }}
                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          ▶ Uitleg
                        </a>
                        {exercise.alternatives.length > 0 && (
                          <button type="button" className="btn-icon" style={{ width: "100%", justifyContent: "flex-start" }}>
                            ⇄ Wissel
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn-icon"
                          style={{ width: "100%", justifyContent: "flex-start" }}
                          disabled={exerciseIndex === 0}
                          onClick={() => moveExercise(blockIndex, exerciseIndex, -1)}
                        >
                          ▲ Naar boven
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          style={{ width: "100%", justifyContent: "flex-start" }}
                          disabled={exerciseIndex === block.exercises.length - 1}
                          onClick={() => moveExercise(blockIndex, exerciseIndex, 1)}
                        >
                          ▼ Naar beneden
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          style={{ width: "100%", justifyContent: "flex-start", color: "var(--color-danger, #c0392b)" }}
                          onClick={() => removeExercise(blockIndex, exerciseIndex)}
                        >
                          − Verwijder
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: "100%", marginTop: 8 }}
              onClick={() => addExercise(blockIndex)}
            >
              + Oefening toevoegen
            </button>
          </div>
        );
      })}

      <p className="field-hint">
        Verschil met nu: elke oefening is standaard maar één regel (naam + belangrijkste getal).
        Uitleg/Wissel/Verplaats/Verwijder zitten achter ⋮ i.p.v. altijd zichtbaar. Reps/gewicht
        bewerken zou in het echt via "Bewerken" in dat menu gaan (niet in deze preview gebouwd).
        Beste voor lange workouts met veel oefeningen; kost wel een extra tik voor iets dat je nu
        in één oogopslag ziet.
      </p>
    </div>
  );
}
