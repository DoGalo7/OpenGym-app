import { useState } from "react";

const MUSCLE_GROUPS = [
  { value: "", label: "Geen specifieke spiergroep" },
  { value: "schouders", label: "Schouders" },
  { value: "rug", label: "Rug" },
  { value: "borst", label: "Borst" },
  { value: "armen", label: "Armen" },
  { value: "benen", label: "Benen" },
  { value: "billen", label: "Billen" },
  { value: "buik", label: "Buik" },
  { value: "volledig_lichaam", label: "Volledig lichaam" },
];

export default function InjuryList({ injuries, onAdd, onRemove }) {
  const [description, setDescription] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!description.trim()) return;
    setSaving(true);
    try {
      await onAdd({ description: description.trim(), affected_muscle_group: muscleGroup || null });
      setDescription("");
      setMuscleGroup("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card">
      <h3>Blessures &amp; beperkingen</h3>
      {injuries.length === 0 && <p className="field-hint">Nog niets toegevoegd.</p>}
      {injuries.map((injury) => (
        <div key={injury.id} className="exercise-row">
          <div className="exercise-main">
            <div className="exercise-name">{injury.description}</div>
            {injury.affected_muscle_group && (
              <div className="exercise-meta">Spiergroep: {injury.affected_muscle_group}</div>
            )}
          </div>
          <button type="button" className="btn-icon" onClick={() => onRemove(injury.id)}>
            Verwijder
          </button>
        </div>
      ))}
      <form onSubmit={handleSubmit} style={{ marginTop: 12 }}>
        <div className="field">
          <label htmlFor="injury-description">Nieuwe blessure of beperking</label>
          <input
            id="injury-description"
            type="text"
            placeholder="bijv. knieklachten, zwangerschap"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="injury-muscle-group">Spiergroep ontzien (optioneel)</label>
          <select
            id="injury-muscle-group"
            value={muscleGroup}
            onChange={(event) => setMuscleGroup(event.target.value)}
          >
            {MUSCLE_GROUPS.map((group) => (
              <option key={group.value} value={group.value}>
                {group.label}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-secondary" disabled={saving}>
          Toevoegen
        </button>
      </form>
    </div>
  );
}
