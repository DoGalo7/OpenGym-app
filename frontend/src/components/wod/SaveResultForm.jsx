import { useState } from "react";

export default function SaveResultForm({ onSave }) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (saved) {
    return <p className="status-text">Opgeslagen in je geschiedenis.</p>;
  }

  if (!open) {
    return (
      <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
        Sla resultaat op
      </button>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(result.trim() || null);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card">
      <div className="field">
        <label htmlFor="result">Resultaat (optioneel)</label>
        <input
          id="result"
          type="text"
          placeholder="bijv. 12:34 of 5 ronden + 3 reps"
          value={result}
          onChange={(event) => setResult(event.target.value)}
        />
      </div>
      <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
        {saving ? "Bezig..." : "Opslaan"}
      </button>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
