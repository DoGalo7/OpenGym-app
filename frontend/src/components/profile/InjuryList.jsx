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

// Keys must match backend/app/wod_generator.py::CONDITION_RULES - selecting one excludes a
// curated set of movements that a single muscle group can't express (e.g. pregnancy isn't
// "one body part"). See that dict's comment for the sourcing of these exclusions.
const CONDITIONS = [
  { value: "", label: "Geen" },
  { value: "zwangerschap", label: "Zwangerschap" },
  { value: "schouder_impingement", label: "Schouderblessure / impingement" },
  { value: "rug_hernia", label: "Rugblessure / hernia" },
  { value: "knieblessure", label: "Knieblessure" },
  { value: "polsblessure", label: "Polsblessure" },
  { value: "enkelblessure", label: "Enkelblessure" },
  { value: "nekblessure", label: "Nekblessure" },
];

export default function InjuryList({ injuries, onAdd, onRemove }) {
  const [description, setDescription] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [conditionKey, setConditionKey] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!description.trim()) return;
    setSaving(true);
    try {
      await onAdd({
        description: description.trim(),
        affected_muscle_group: muscleGroup || null,
        condition_key: conditionKey || null,
      });
      setDescription("");
      setMuscleGroup("");
      setConditionKey("");
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
            {(injury.affected_muscle_group || injury.condition_key) && (
              <div className="exercise-meta">
                {injury.affected_muscle_group && <span>Spiergroep: {injury.affected_muscle_group}</span>}
                {injury.condition_key && (
                  <span>{CONDITIONS.find((c) => c.value === injury.condition_key)?.label ?? injury.condition_key}</span>
                )}
              </div>
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
        <div className="field">
          <label htmlFor="injury-condition">Bekende beperking (optioneel)</label>
          <select
            id="injury-condition"
            value={conditionKey}
            onChange={(event) => setConditionKey(event.target.value)}
          >
            {CONDITIONS.map((condition) => (
              <option key={condition.value} value={condition.value}>
                {condition.label}
              </option>
            ))}
          </select>
          <p className="field-hint" style={{ marginBottom: 0 }}>
            Past de workout aan met oefeningen die hierbij vaak afgeraden worden.
          </p>
        </div>
        <button type="submit" className="btn btn-secondary" disabled={saving}>
          Toevoegen
        </button>
      </form>
    </div>
  );
}
