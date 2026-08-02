import { useEffect, useState } from "react";

import { listExercises } from "../../api/exercises";

export default function AddExercisePicker({ filterFn, onAdd }) {
  const [open, setOpen] = useState(false);
  const [allExercises, setAllExercises] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open || allExercises.length > 0) return;
    listExercises().then(setAllExercises).catch(() => {});
  }, [open, allExercises.length]);

  if (!open) {
    return (
      <button
        type="button"
        className="btn btn-secondary"
        style={{ width: "100%", marginTop: 8 }}
        onClick={() => setOpen(true)}
      >
        + Oefening toevoegen
      </button>
    );
  }

  const searchTerm = search.trim().toLowerCase();
  const options = allExercises
    .filter((e) => filterFn(e) && (searchTerm === "" || e.name.toLowerCase().includes(searchTerm)))
    .slice(0, 20);

  return (
    <div style={{ marginTop: 8 }}>
      <div className="field" style={{ marginBottom: 8 }}>
        <input
          type="text"
          placeholder="Zoek een oefening..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          autoFocus
        />
      </div>
      <div style={{ maxHeight: 220, overflowY: "auto" }}>
        {options.length === 0 && <p className="field-hint">Geen (passende) oefeningen gevonden.</p>}
        {options.map((exercise) => (
          <div key={exercise.id} className="exercise-row">
            <div className="exercise-main">
              <div className="exercise-name">{exercise.name}</div>
              <div className="exercise-meta">{exercise.muscle_group}</div>
            </div>
            <button
              type="button"
              className="btn-icon"
              onClick={() => {
                onAdd(exercise);
                setSearch("");
              }}
            >
              + Toevoegen
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="btn-icon" onClick={() => setOpen(false)} style={{ marginTop: 4 }}>
        Klaar
      </button>
    </div>
  );
}
