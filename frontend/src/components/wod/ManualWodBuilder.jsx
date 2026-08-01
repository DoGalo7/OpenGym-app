import { useEffect, useState } from "react";

import { listExercises } from "../../api/exercises";

const FILTER_GROUPS = [
  { value: "schouders", label: "Schouders" },
  { value: "rug", label: "Rug" },
  { value: "borst", label: "Borst" },
  { value: "armen", label: "Armen" },
  { value: "benen", label: "Benen" },
  { value: "billen", label: "Billen" },
  { value: "buik", label: "Buik" },
];

function defaultFieldsFor(exercise) {
  if (exercise.is_cardio) {
    return exercise.cardio_type === "assault_bike"
      ? { reps: null, distance_meters: null, calories: 15 }
      : { reps: null, distance_meters: 500, calories: null };
  }
  return { reps: 10, distance_meters: null, calories: null };
}

export default function ManualWodBuilder({ profile, location, trainingType, onBuild }) {
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

  const pickedIds = new Set(picked.map((p) => p.exercise.id));
  const searchTerm = search.trim().toLowerCase();

  const options = allExercises.filter(
    (e) =>
      !e.warmup_only &&
      !pickedIds.has(e.id) &&
      homeAllowed(e) &&
      (filterGroups.length === 0 || filterGroups.includes(e.muscle_group)) &&
      (searchTerm === "" || e.name.toLowerCase().includes(searchTerm))
  );

  const addExercise = (exercise) => {
    setPicked((prev) => [...prev, { exercise, own_weight_kg: null, ...defaultFieldsFor(exercise) }]);
  };

  const removeExercise = (id) => {
    setPicked((prev) => prev.filter((p) => p.exercise.id !== id));
  };

  const updateField = (id, field, value) => {
    setPicked((prev) => prev.map((p) => (p.exercise.id === id ? { ...p, [field]: value } : p)));
  };

  const canBuild = picked.length > 0;

  const handleBuild = () => {
    const block = {
      block_type: "main",
      training_type: trainingType,
      duration_minutes: Number(length) || 20,
      rounds: null,
      interval_seconds: null,
      rep_scheme: "flat",
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
        {options.map((exercise) => (
          <div key={exercise.id} className="exercise-row">
            <div className="exercise-main">
              <div className="exercise-name">{exercise.name}</div>
              <div className="exercise-meta">{exercise.muscle_group} · {exercise.category}</div>
            </div>
            <button type="button" className="btn-icon" onClick={() => addExercise(exercise)}>
              + Toevoegen
            </button>
          </div>
        ))}
      </div>

      <h3>Jouw workout ({picked.length})</h3>
      {picked.length === 0 && <p className="field-hint">Voeg hierboven oefeningen toe.</p>}
      {picked.map((p) => (
        <div key={p.exercise.id} className="exercise-row">
          <div className="exercise-main">
            <div className="exercise-name">{p.exercise.name}</div>
            <div className="exercise-meta">
              {!p.exercise.is_cardio && (
                <span className="inline-edit">
                  <input
                    type="number"
                    min={1}
                    value={p.reps ?? ""}
                    onChange={(event) => updateField(p.exercise.id, "reps", Number(event.target.value))}
                    aria-label={`Herhalingen voor ${p.exercise.name}`}
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
                    onChange={(event) => updateField(p.exercise.id, "calories", Number(event.target.value))}
                    aria-label={`Calorieën voor ${p.exercise.name}`}
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
                    onChange={(event) => updateField(p.exercise.id, "distance_meters", Number(event.target.value))}
                    aria-label={`Afstand voor ${p.exercise.name}`}
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
                      updateField(p.exercise.id, "own_weight_kg", event.target.value === "" ? null : Number(event.target.value))
                    }
                    aria-label={`Gewicht voor ${p.exercise.name}`}
                    style={{ width: 70 }}
                  />{" "}
                  kg
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={() => removeExercise(p.exercise.id)}
            aria-label={`Verwijder ${p.exercise.name}`}
          >
            ✕
          </button>
        </div>
      ))}

      <button type="button" className="btn btn-primary" disabled={!canBuild} onClick={handleBuild} style={{ marginTop: 16 }}>
        Maak workout
      </button>
      {!canBuild && <p className="field-hint" style={{ marginTop: 8 }}>Voeg minstens één oefening toe.</p>}
    </div>
  );
}
