import { useEffect, useState } from "react";

import { acceptFriend, getFriendsActivity, listFriends, requestFriend } from "../../api/profiles";

function formatActivityDate(isoString) {
  return new Date(isoString).toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" });
}

export default function FriendsSection({ userId }) {
  const [friends, setFriends] = useState([]);
  const [activity, setActivity] = useState([]);
  const [friendUserId, setFriendUserId] = useState("");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const hasAcceptedFriend = friends.some((f) => f.status === "accepted");

  useEffect(() => {
    if (!hasAcceptedFriend) {
      setActivity([]);
      return;
    }
    getFriendsActivity(userId).then(setActivity).catch(() => {});
    // hasAcceptedFriend only flips true/false when the friends list itself changes, so this
    // effectively re-runs whenever `friends` does - no need to list it separately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, hasAcceptedFriend]);

  const handleCopyOwnId = async () => {
    try {
      await navigator.clipboard.writeText(userId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Klembord niet beschikbaar — het ID staat er nog steeds om handmatig te selecteren.
    }
  };

  const load = () => {
    listFriends(userId).then(setFriends).catch((err) => setError(err.message));
  };

  useEffect(load, [userId]);

  const handleAdd = async (event) => {
    event.preventDefault();
    if (!friendUserId.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await requestFriend(userId, friendUserId.trim());
      setFriendUserId("");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAccept = async (friendshipId) => {
    await acceptFriend(userId, friendshipId);
    load();
  };

  return (
    <div className="card">
      <h3>Vrienden</h3>
      <p className="field-hint">
        Zie hieronder wat je bevriende sporters deze week deden. Rechtstreeks een WOD delen met
        specifieke vrienden volgt later.
      </p>

      <div className="field">
        <label>Jouw gebruikers-id (deel dit met een vriend)</label>
        <div className="copy-row">
          <code>{userId}</code>
          <button type="button" className="btn-icon" onClick={handleCopyOwnId}>
            {copied ? "Gekopieerd!" : "Kopieer"}
          </button>
        </div>
        <p className="field-hint">
          Stuur dit id naar een vriend. Die vult het hieronder in om jou te koppelen.
        </p>
      </div>

      {friends.length === 0 && <p className="field-hint">Nog geen vrienden gekoppeld.</p>}
      {friends.map((friend) => (
        <div key={friend.id} className="exercise-row">
          <div className="exercise-main">
            <div className="exercise-name">{friend.friend_name}</div>
            <div className="exercise-meta">
              {friend.status === "pending"
                ? friend.direction === "outgoing"
                  ? "Verzoek verstuurd, nog niet geaccepteerd"
                  : "Wacht op jouw antwoord"
                : "Bevriend"}
            </div>
          </div>
          {friend.status === "pending" && friend.direction === "incoming" && (
            <button type="button" className="btn-icon" onClick={() => handleAccept(friend.id)}>
              Accepteren
            </button>
          )}
        </div>
      ))}

      {hasAcceptedFriend && (
        <div style={{ marginTop: 16 }}>
          <h3 style={{ marginBottom: 4 }}>Wat deden je vrienden deze week</h3>
          {activity.length === 0 && (
            <p className="field-hint">Nog geen workouts van je vrienden deze week.</p>
          )}
          {activity.map((entry, index) => (
            <div key={index} className="exercise-row">
              <div className="exercise-main">
                <div className="exercise-name">{entry.friend_name} — {entry.wod_name}</div>
                <div className="exercise-meta">
                  {formatActivityDate(entry.created_at)}
                  {entry.result && ` · ${entry.result}`}
                  {entry.rating && ` · ${"★".repeat(entry.rating)}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleAdd} style={{ marginTop: 12 }}>
        <div className="field">
          <label htmlFor="friend-user-id">Vriend toevoegen (gebruikers-id)</label>
          <input
            id="friend-user-id"
            type="text"
            placeholder="gebruikers-id van je vriend"
            value={friendUserId}
            onChange={(event) => setFriendUserId(event.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-secondary" disabled={saving}>
          Verzoek versturen
        </button>
      </form>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
