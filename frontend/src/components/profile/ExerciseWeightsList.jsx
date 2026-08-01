import { useEffect, useState } from "react";

import { listExercises } from "../../api/exercises";

const WEIGHT_CATEGORIES = new Set(["barbell", "dumbbell", "kettlebell", "rack"]);

// Local input state so typing doesn't fire a save request on every keystroke - only
// on blur, once the user is done editing.
function WeightRow({ weight, onSet, onRemove }) {
  const [value, setValue] = useState(String(weight.weight_kg));

  return (
    <div className="exercise-row">
      <div className="exercise-main">
        <div className="exercise-name">{weight.exercise_name}</div>
        <span className="inline-edit">
          <input
            type="number"
            min={0}
            step={0.5}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onBlur={() => {
              const num = Number(value);
              if (value !== "" && !Number.isNaN(num) && num > 0) onSet(weight.exercise_id, num);
              else setValue(String(weight.weight_kg));
            }}
            aria-label={`Gewicht voor ${weight.exercise_name}`}
            style={{ width: 70 }}
          />{" "}
          kg
        </span>
      </div>
      <button type="button" className="btn-icon" onClick={() => onRemove(weight.exercise_id)}>
        Verwijder
      </button>
    </div>
  );
}

export default function ExerciseWeightsList({ exerciseWeights, onSet, onRemove }) {
  const [allExercises, setAllExercises] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    listExercises().then(setAllExercises).catch(() => {});
  }, []);

  const savedIds = new Set(exerciseWeights.map((w) => w.exercise_id));
  const options =
    search.trim().length === 0
      ? []
      : allExercises
          .filter(
            (e) =>
              WEIGHT_CATEGORIES.has(e.category) &&
              !savedIds.has(e.id) &&
              e.name.toLowerCase().includes(search.trim().toLowerCase())
          )
          .slice(0, 8);

  const handleAdd = (exercise) => {
    const defaultWeight = exercise.rx_weight_male_kg ?? exercise.rx_weight_female_kg ?? 20;
    onSet(exercise.id, defaultWeight);
    setSearch("");
  };

  return (
    <div className="card">
      <h3>Jouw gewichten per oefening</h3>
      <p className="field-hint" style={{ marginTop: 0 }}>
        Sla je eigen werkgewicht op per oefening - een nieuwe workout gebruikt dit automatisch
        (je kunt het per keer nog aanpassen).
      </p>
      {exerciseWeights.length === 0 && <p className="field-hint">Nog niets opgeslagen.</p>}
      {exerciseWeights.map((w) => (
        <WeightRow key={w.exercise_id} weight={w} onSet={onSet} onRemove={onRemove} />
      ))}
      <div className="field" style={{ marginTop: 12, marginBottom: options.length > 0 ? 0 : undefined }}>
        <label htmlFor="weight-exercise-search">Zoek oefening om een gewicht op te slaan</label>
        <input
          id="weight-exercise-search"
          type="text"
          placeholder="Typ om te zoeken..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        {search.trim().length > 0 && options.length === 0 && (
          <p className="field-hint">Geen oefeningen gevonden.</p>
        )}
      </div>
      {options.length > 0 && (
        <div className="search-results">
          {options.map((exercise) => (
            <button key={exercise.id} type="button" onClick={() => handleAdd(exercise)}>
              {exercise.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
