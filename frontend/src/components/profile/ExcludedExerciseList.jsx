import { useEffect, useState } from "react";

import { listExercises } from "../../api/exercises";

export default function ExcludedExerciseList({ excludedExercises, onAdd, onRemove }) {
  const [allExercises, setAllExercises] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    listExercises().then(setAllExercises).catch(() => {});
  }, []);

  const excludedIds = new Set(excludedExercises.map((e) => e.id));
  const options =
    search.trim().length === 0
      ? []
      : allExercises
          .filter((e) => !excludedIds.has(e.id) && e.name.toLowerCase().includes(search.trim().toLowerCase()))
          .slice(0, 8);

  const handleAdd = (id) => {
    onAdd(id);
    setSearch("");
  };

  return (
    <div className="card">
      <h3>Oefeningen die je nooit wilt doen</h3>
      {excludedExercises.length === 0 && <p className="field-hint">Nog niets uitgesloten.</p>}
      {excludedExercises.map((exercise) => (
        <div key={exercise.id} className="exercise-row">
          <div className="exercise-main">
            <div className="exercise-name">{exercise.name}</div>
          </div>
          <button type="button" className="btn-icon" onClick={() => onRemove(exercise.id)}>
            Verwijder
          </button>
        </div>
      ))}
      <div className="field" style={{ marginTop: 12, marginBottom: options.length > 0 ? 0 : undefined }}>
        <label htmlFor="exercise-search">Zoek oefening om uit te sluiten</label>
        <input
          id="exercise-search"
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
            <button key={exercise.id} type="button" onClick={() => handleAdd(exercise.id)}>
              {exercise.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
