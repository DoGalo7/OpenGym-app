import { useEffect, useState } from "react";

import { listExercises } from "../../api/exercises";
import TrainingTypeSelect from "./TrainingTypeSelect";

const FILTER_GROUPS = [
  { value: "schouders", label: "Schouders" },
  { value: "rug", label: "Rug" },
  { value: "borst", label: "Borst" },
  { value: "armen", label: "Armen" },
  { value: "benen", label: "Benen" },
  { value: "billen", label: "Billen" },
  { value: "buik", label: "Buik" },
];

// Mirrors backend/app/wod_generator.py::_shape_training_type so a manually built WOD reads
// the same way (rounds/interval/rep_scheme) as an auto-generated one of the same type.
function shapeForTrainingType(trainingType, durationMinutes, exerciseCount) {
  if (trainingType === "EMOM") {
    return { rounds: durationMinutes, interval_seconds: 60, rep_scheme: "roterend, 1 oefening per minuut" };
  }
  if (trainingType === "TABATA") {
    return { rounds: 8, interval_seconds: 20, rep_scheme: "20s werk / 10s rust, 8 ronden" };
  }
  if (trainingType === "FOR_TIME") {
    return { rounds: 3, interval_seconds: null, rep_scheme: exerciseCount === 2 ? "21-15-9" : "flat" };
  }
  return { rounds: "AMRAP", interval_seconds: null, rep_scheme: "flat" };
}

function defaultFieldsFor(exercise) {
  if (exercise.is_cardio) {
    return exercise.cardio_type === "assault_bike"
      ? { reps: null, distance_meters: null, calories: 15 }
      : { reps: null, distance_meters: 500, calories: null };
  }
  return { reps: 10, distance_meters: null, calories: null };
}

export default function ManualWodBuilder({ profile, location, trainingType, setTrainingType, onBuild }) {
  const [allExercises, setAllExercises] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterGroups, setFilterGroups] = useState([]);
  const [picked, setPicked] = useState([]);
  const [length, setLength] = useState(20);

  useEffect(() => {
    listExercises()
      .then(setAllExercises)
      .catch((err) => setLoadError(err.message));
  }, []);

  const homeEquipment = new Set(profile.home_equipment ?? []);
  const homeAllowed = (e) => {
    if (location !== "home" || !e.requires_gym) return true;
    if (e.equipment_tag && homeEquipment.has(e.equipment_tag)) return true;
    if (e.is_cardio && e.cardio_type && homeEquipment.has(e.cardio_type)) return true;
    return false;
  };

  const toggleFilterGroup = (value) => {
    setFilterGroups((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  };

  // Count instead of exclude: an exercise can be added multiple times (e.g. several running
  // intervals at different afstanden), so already-picked exercises stay in the browse list
  // with a "Nx toegevoegd" hint instead of disappearing after the first add.
  const pickedCounts = new Map();
  for (const p of picked) pickedCounts.set(p.exercise.id, (pickedCounts.get(p.exercise.id) ?? 0) + 1);
  const searchTerm = search.trim().toLowerCase();

  const options = allExercises.filter(
    (e) =>
      !e.warmup_only &&
      e.category !== "stretching" &&
      homeAllowed(e) &&
      (filterGroups.length === 0 || filterGroups.includes(e.muscle_group)) &&
      (searchTerm === "" || e.name.toLowerCase().includes(searchTerm))
  );

  const addExercise = (exercise) => {
    const saved = (profile.exercise_weights ?? []).find((w) => w.exercise_id === exercise.id);
    const entryId = crypto.randomUUID();
    setPicked((prev) => [...prev, { entryId, exercise, own_weight_kg: saved?.weight_kg ?? null, ...defaultFieldsFor(exercise) }]);
  };

  const removeExercise = (entryId) => {
    setPicked((prev) => prev.filter((p) => p.entryId !== entryId));
  };

  const updateField = (entryId, field, value) => {
    setPicked((prev) => prev.map((p) => (p.entryId === entryId ? { ...p, [field]: value } : p)));
  };

  const moveExercise = (index, direction) => {
    setPicked((prev) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const canBuild = picked.length > 0;

  const handleBuild = () => {
    const durationMinutes = Number(length) || 20;
    const block = {
      block_type: "main",
      training_type: trainingType,
      duration_minutes: durationMinutes,
      ...shapeForTrainingType(trainingType, durationMinutes, picked.length),
      exercises: picked.map((p) => ({
        exercise_id: p.exercise.id,
        name: p.exercise.name,
        muscle_group: p.exercise.muscle_group,
        category: p.exercise.category,
        reps: p.reps,
        distance_meters: p.distance_meters,
        calories: p.calories,
        cardio_type: p.exercise.is_cardio ? p.exercise.cardio_type : null,
        own_weight_kg: p.own_weight_kg,
        suggested_weight_male_kg: p.exercise.rx_weight_male_kg,
        suggested_weight_female_kg: p.exercise.rx_weight_female_kg,
        alternatives: [],
      })),
    };
    onBuild({
      profile_id: profile.id,
      location,
      level_used: profile.level,
      total_duration_minutes: block.duration_minutes,
      blocks: [block],
      generated_at: new Date().toISOString(),
    });
  };

  return (
    <div className="card">
      <h3>Stel je eigen workout samen</h3>

      <div className="field">
        <label htmlFor="manual-length">Lengte (minuten)</label>
        <input
          id="manual-length"
          type="number"
          min={5}
          max={90}
          step={5}
          value={length}
          onChange={(event) => setLength(event.target.value)}
        />
      </div>

      <TrainingTypeSelect value={trainingType} onChange={setTrainingType} />

      <div className="field">
        <label>Filter op spiergroep (optioneel)</label>
        <div className="chip-group">
          {FILTER_GROUPS.map((group) => (
            <button
              key={group.value}
              type="button"
              className={`chip${filterGroups.includes(group.value) ? " active" : ""}`}
              onClick={() => toggleFilterGroup(group.value)}
            >
              {group.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label htmlFor="manual-search">Zoek een oefening</label>
        <input
          id="manual-search"
          type="text"
          placeholder="bijv. Deadlift, Push-up..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {loadError && <p className="error-text">{loadError}</p>}

      <div style={{ maxHeight: 260, overflowY: "auto", marginBottom: "var(--space-4)" }}>
        {options.length === 0 && <p className="field-hint">Geen oefeningen gevonden.</p>}
        {options.map((exercise) => {
          const count = pickedCounts.get(exercise.id) ?? 0;
          return (
            <div key={exercise.id} className="exercise-row">
              <div className="exercise-main">
                <div className="exercise-name">{exercise.name}</div>
                <div className="exercise-meta">
                  {exercise.muscle_group} · {exercise.category}
                  {count > 0 && ` · ✓ ${count}x toegevoegd`}
                </div>
              </div>
              <button type="button" className="btn-icon" onClick={() => addExercise(exercise)}>
                + Toevoegen
              </button>
            </div>
          );
        })}
      </div>

      <h3>Jouw workout ({picked.length})</h3>
      {picked.length === 0 && <p className="field-hint">Voeg hierboven oefeningen toe.</p>}
      {picked.map((p, index) => {
        const occurrence = picked.slice(0, index).filter((other) => other.exercise.id === p.exercise.id).length + 1;
        const totalForExercise = pickedCounts.get(p.exercise.id) ?? 1;
        const label = totalForExercise > 1 ? `${p.exercise.name} (${occurrence})` : p.exercise.name;
        return (
          <div key={p.entryId} className="exercise-row">
            <div className="exercise-main">
              <div className="exercise-name">{label}</div>
              <div className="exercise-meta">
                {!p.exercise.is_cardio && (
                  <span className="inline-edit">
                    <input
                      type="number"
                      min={1}
                      value={p.reps ?? ""}
                      onChange={(event) => updateField(p.entryId, "reps", Number(event.target.value))}
                      aria-label={`Herhalingen voor ${label}`}
                      style={{ width: 52 }}
                    />{" "}
                    herhalingen
                  </span>
                )}
                {p.exercise.is_cardio && p.exercise.cardio_type === "assault_bike" && (
                  <span className="inline-edit">
                    <input
                      type="number"
                      min={1}
                      value={p.calories ?? ""}
                      onChange={(event) => updateField(p.entryId, "calories", Number(event.target.value))}
                      aria-label={`Calorieën voor ${label}`}
                      style={{ width: 60 }}
                    />{" "}
                    cal
                  </span>
                )}
                {p.exercise.is_cardio && p.exercise.cardio_type !== "assault_bike" && (
                  <span className="inline-edit">
                    <input
                      type="number"
                      min={1}
                      value={p.distance_meters ?? ""}
                      onChange={(event) => updateField(p.entryId, "distance_meters", Number(event.target.value))}
                      aria-label={`Afstand voor ${label}`}
                      style={{ width: 70 }}
                    />{" "}
                    m
                  </span>
                )}
                {!p.exercise.is_cardio && (p.exercise.rx_weight_male_kg != null || p.exercise.rx_weight_female_kg != null) && (
                  <span className="inline-edit">
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      placeholder="gewicht"
                      value={p.own_weight_kg ?? ""}
                      onChange={(event) =>
                        updateField(p.entryId, "own_weight_kg", event.target.value === "" ? null : Number(event.target.value))
                      }
                      aria-label={`Gewicht voor ${label}`}
                      style={{ width: 70 }}
                    />{" "}
                    kg
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
              <button
                type="button"
                className="btn-icon"
                onClick={() => moveExercise(index, -1)}
                disabled={index === 0}
                aria-label={`Verplaats ${label} naar boven`}
                style={{ padding: "4px 8px" }}
              >
                ▲
              </button>
              <button
                type="button"
                className="btn-icon"
                onClick={() => moveExercise(index, 1)}
                disabled={index === picked.length - 1}
                aria-label={`Verplaats ${label} naar beneden`}
                style={{ padding: "4px 8px" }}
              >
                ▼
              </button>
              <button
                type="button"
                className="btn-icon"
                onClick={() => removeExercise(p.entryId)}
                aria-label={`Verwijder ${label}`}
              >
                ✕
              </button>
            </div>
          </div>
        );
      })}

      <button type="button" className="btn btn-primary" disabled={!canBuild} onClick={handleBuild} style={{ marginTop: 16 }}>
        Maak workout
      </button>
      {!canBuild && <p className="field-hint" style={{ marginTop: 8 }}>Voeg minstens één oefening toe.</p>}
    </div>
  );
}
