import { useState } from "react";

import { explanationUrl } from "../../utils/explanationLink";
import SwapMenu from "./SwapMenu";

function weightText(exercise, sex) {
  if (exercise.own_weight_kg) return `${exercise.own_weight_kg} kg (eigen gewicht)`;
  const { suggested_weight_male_kg: m, suggested_weight_female_kg: f } = exercise;
  if (m == null && f == null) return null;
  if (sex === "male" && m != null) return `${m} kg (RX)`;
  if (sex === "female" && f != null) return `${f} kg (RX)`;
  if (m != null && f != null) return `${m} / ${f} kg (RX M/V)`;
  return `${m ?? f} kg (RX)`;
}

export default function ExerciseRow({ exercise, sex, onSwap, onFieldChange, onMoveUp, onMoveDown, readOnly = false }) {
  const [showSwap, setShowSwap] = useState(false);

  const showsWeight =
    exercise.own_weight_kg != null || exercise.suggested_weight_male_kg != null || exercise.suggested_weight_female_kg != null;
  const editableWeightValue =
    exercise.own_weight_kg ??
    (sex === "female" ? exercise.suggested_weight_female_kg : exercise.suggested_weight_male_kg) ??
    exercise.suggested_weight_male_kg ??
    exercise.suggested_weight_female_kg ??
    "";

  const metaParts = [];
  if (readOnly) {
    if (exercise.distance_meters) metaParts.push(`${exercise.distance_meters} m`);
    if (exercise.calories) metaParts.push(`${exercise.calories} cal`);
    if (exercise.reps) metaParts.push(`${exercise.reps} herhalingen`);
    if (exercise.duration_seconds) {
      metaParts.push(
        exercise.duration_seconds < 60
          ? `${exercise.duration_seconds} sec`
          : `${Math.round(exercise.duration_seconds / 60)} min`
      );
    }
    const weight = weightText(exercise, sex);
    if (weight) metaParts.push(weight);
  }

  return (
    <div className="exercise-row">
      <div className="exercise-main">
        <div className="exercise-name">{exercise.name}</div>
        <div className="exercise-meta">
          {!readOnly && exercise.reps != null && (
            <span className="inline-edit">
              <input
                type="number"
                min={1}
                value={exercise.reps}
                onChange={(event) => onFieldChange("reps", Number(event.target.value))}
                aria-label={`Herhalingen voor ${exercise.name}`}
                style={{ width: 52 }}
              />{" "}
              herhalingen
            </span>
          )}
          {!readOnly && exercise.duration_seconds != null && exercise.reps == null && (
            <span className="inline-edit">
              <input
                type="number"
                min={5}
                value={exercise.duration_seconds}
                onChange={(event) => onFieldChange("duration_seconds", Number(event.target.value))}
                aria-label={`Duur voor ${exercise.name}`}
                style={{ width: 52 }}
              />{" "}
              sec
            </span>
          )}
          {!readOnly && exercise.distance_meters != null && (
            <span className="inline-edit">
              <input
                type="number"
                min={1}
                value={exercise.distance_meters}
                onChange={(event) => onFieldChange("distance_meters", Number(event.target.value))}
                aria-label={`Afstand voor ${exercise.name}`}
                style={{ width: 60 }}
              />{" "}
              m
            </span>
          )}
          {!readOnly && exercise.calories != null && (
            <span className="inline-edit">
              <input
                type="number"
                min={1}
                value={exercise.calories}
                onChange={(event) => onFieldChange("calories", Number(event.target.value))}
                aria-label={`Calorieën voor ${exercise.name}`}
                style={{ width: 52 }}
              />{" "}
              cal
            </span>
          )}
          {!readOnly && showsWeight && (
            <span className="inline-edit">
              <input
                type="number"
                min={0}
                step={0.5}
                value={editableWeightValue}
                onChange={(event) =>
                  onFieldChange("own_weight_kg", event.target.value === "" ? null : Number(event.target.value))
                }
                aria-label={`Gewicht voor ${exercise.name}`}
                style={{ width: 60 }}
              />{" "}
              kg
            </span>
          )}
          {metaParts.length > 0 && <span>{metaParts.join(" · ")}</span>}
        </div>
      </div>
      <div className="exercise-actions">
        <a
          className="btn-icon"
          href={explanationUrl(exercise.name)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Uitleg voor ${exercise.name}`}
        >
          ▶ Uitleg
        </a>
        {!readOnly && exercise.alternatives.length > 0 && (
          <button
            type="button"
            className="btn-icon"
            onClick={() => setShowSwap((v) => !v)}
            aria-label={`Wissel ${exercise.name}`}
          >
            ⇄ Wissel
          </button>
        )}
        {!readOnly && showSwap && (
          <>
            <button
              type="button"
              className="swap-backdrop"
              aria-label="Sluit wisselmenu"
              onClick={() => setShowSwap(false)}
            />
            <SwapMenu
              alternatives={exercise.alternatives}
              onPick={onSwap}
              onClose={() => setShowSwap(false)}
            />
          </>
        )}
        {(onMoveUp || onMoveDown) && (
          <span className="reorder-stack">
            <button
              type="button"
              className="btn-icon"
              onClick={onMoveUp}
              disabled={!onMoveUp}
              aria-label={`Verplaats ${exercise.name} naar boven`}
            >
              ▲
            </button>
            <button
              type="button"
              className="btn-icon"
              onClick={onMoveDown}
              disabled={!onMoveDown}
              aria-label={`Verplaats ${exercise.name} naar beneden`}
            >
              ▼
            </button>
          </span>
        )}
      </div>
    </div>
  );
}
