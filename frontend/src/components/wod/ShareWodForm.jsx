import { useState } from "react";

export default function ShareWodForm({ onShare }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [shared, setShared] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState(null);

  if (shared) {
    return <p className="status-text">Gedeeld! Andere sporters zien deze workout nu bij Ideeën.</p>;
  }

  if (!open) {
    return (
      <button type="button" className="btn btn-secondary" onClick={() => setOpen(true)} style={{ marginTop: 8 }}>
        Delen met andere sporters
      </button>
    );
  }

  const handleShare = async () => {
    if (!name.trim()) return;
    setSharing(true);
    setError(null);
    try {
      await onShare(name.trim());
      setShared(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="card">
      <div className="field">
        <label htmlFor="share-name">Naam voor deze workout</label>
        <input
          id="share-name"
          type="text"
          placeholder="bijv. Zware beenday"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <button type="button" className="btn btn-primary" onClick={handleShare} disabled={sharing || !name.trim()}>
        {sharing ? "Bezig..." : "Delen"}
      </button>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
