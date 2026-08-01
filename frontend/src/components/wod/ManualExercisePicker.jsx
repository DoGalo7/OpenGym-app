import { useEffect, useState } from "react";

import { listExercises } from "../../api/exercises";

export default function ManualExercisePicker({ muscleGroups, preferredCategories, injuries, selectedIds, onChange }) {
  const [allExercises, setAllExercises] = useState([]);

  useEffect(() => {
    listExercises().then(setAllExercises).catch(() => {});
  }, []);

  const injuredGroups = new Set(injuries.filter((i) => i.affected_muscle_group).map((i) => i.affected_muscle_group));

  const options = allExercises.filter(
    (e) =>
      muscleGroups.includes(e.muscle_group) &&
      (preferredCategories.length === 0 || preferredCategories.includes(e.category))
  );

  const toggle = (id) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((i) => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  if (muscleGroups.length === 0) {
    return <p className="field-hint">Kies eerst een of meer spiergroepen hierboven.</p>;
  }

  if (options.length === 0) {
    return <p className="field-hint">Geen oefeningen gevonden voor deze combinatie van spiergroep en categorie.</p>;
  }

  return (
    <div>
      {options.map((exercise) => {
        const injuryWarning = injuredGroups.has(exercise.muscle_group)
          ? injuries.find((i) => i.affected_muscle_group === exercise.muscle_group)
          : null;
        return (
          <label key={exercise.id} className="exercise-row" style={{ cursor: "pointer" }}>
            <div className="exercise-main">
              <div className="exercise-name">{exercise.name}</div>
              {injuryWarning && (
                <div className="exercise-meta error-text">⚠️ blessure: {injuryWarning.description}</div>
              )}
            </div>
            <input
              type="checkbox"
              checked={selectedIds.includes(exercise.id)}
              onChange={() => toggle(exercise.id)}
              style={{ width: 22, height: 22, flexShrink: 0 }}
            />
          </label>
        );
      })}
    </div>
  );
}
