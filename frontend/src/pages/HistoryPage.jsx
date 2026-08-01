import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { deleteHistoryEntry, listHistory, updateHistory } from "../api/history";
import HistoryEntryCard from "../components/history/HistoryEntryCard";
import { useProfile } from "../context/ProfileContext";

export default function HistoryPage() {
  const { profile } = useProfile();
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState(null);

  const load = () => {
    listHistory(profile.user_id)
      .then(setEntries)
      .catch((err) => setError(err.message));
  };

  useEffect(load, [profile.user_id]);

  const handleUpdate = async (historyId, data) => {
    await updateHistory(profile.user_id, historyId, data);
    load();
  };

  const handleDelete = async (historyId) => {
    await deleteHistoryEntry(profile.user_id, historyId);
    load();
  };

  return (
    <div>
      <h1>Geschiedenis</h1>
      {entries.length > 0 && (
        <Link to="/rapport" className="btn-icon" style={{ display: "inline-flex", marginBottom: 12, textDecoration: "none" }}>
          📊 Bekijk prestatierapport
        </Link>
      )}
      {error && <p className="error-text">{error}</p>}
      {entries.length === 0 && !error && (
        <p className="status-text">Nog geen workouts gelogd. Maak of kies een WOD om te beginnen.</p>
      )}
      {entries.map((entry) => (
        <HistoryEntryCard key={entry.id} entry={entry} onUpdate={handleUpdate} onDelete={handleDelete} />
      ))}
    </div>
  );
}
