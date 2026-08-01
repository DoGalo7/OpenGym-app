import { useEffect, useState } from "react";

import { listHistory, updateHistoryResult } from "../api/history";
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

  const handleUpdateResult = async (historyId, result) => {
    await updateHistoryResult(profile.user_id, historyId, result);
    load();
  };

  return (
    <div>
      <h1>Geschiedenis</h1>
      {error && <p className="error-text">{error}</p>}
      {entries.length === 0 && !error && (
        <p className="status-text">Nog geen workouts gelogd. Maak of kies een WOD om te beginnen.</p>
      )}
      {entries.map((entry) => (
        <HistoryEntryCard key={entry.id} entry={entry} onUpdateResult={handleUpdateResult} />
      ))}
    </div>
  );
}
