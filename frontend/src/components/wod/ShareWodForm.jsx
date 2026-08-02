import { useEffect, useState } from "react";

import { listFriends } from "../../api/profiles";

export default function ShareWodForm({ onShare, userId }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [friends, setFriends] = useState([]);
  const [recipient, setRecipient] = useState("");
  const [shared, setShared] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    listFriends(userId)
      .then((list) => setFriends(list.filter((f) => f.status === "accepted")))
      .catch(() => {});
  }, [open, userId]);

  if (shared) {
    return (
      <p className="status-text">
        {recipient
          ? "Verstuurd! Je vriend(in) ziet deze workout nu bij Ideeën."
          : "Gedeeld! Andere sporters zien deze workout nu bij Ideeën."}
      </p>
    );
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
      await onShare(name.trim(), recipient || undefined);
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
      {friends.length > 0 && (
        <div className="field">
          <label htmlFor="share-recipient">Met wie delen?</label>
          <select id="share-recipient" value={recipient} onChange={(event) => setRecipient(event.target.value)}>
            <option value="">Iedereen (zichtbaar bij Ideeën)</option>
            {friends.map((f) => (
              <option key={f.id} value={f.friend_user_id}>
                Alleen naar {f.friend_name}
              </option>
            ))}
          </select>
        </div>
      )}
      <button type="button" className="btn btn-primary" onClick={handleShare} disabled={sharing || !name.trim()}>
        {sharing ? "Bezig..." : recipient ? "Versturen" : "Delen"}
      </button>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
