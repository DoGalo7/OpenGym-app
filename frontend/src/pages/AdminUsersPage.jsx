import { useEffect, useState } from "react";

import { listUsers } from "../api/adminUsers";

const LEVEL_LABELS = { beginner: "Beginner", intermediate: "Gemiddeld", advanced: "Gevorderd" };

function formatDate(isoString) {
  if (!isoString) return null;
  return new Date(isoString).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    listUsers().then(setUsers).catch((err) => setError(err.message));
  }, []);

  const filtered = users.filter((u) => u.name.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <div>
      <h1>Admin: gebruikers</h1>
      <p className="field-hint">
        Niet gekoppeld aan het hoofdmenu - alleen voor beheer. {users.length} profiel{users.length === 1 ? "" : "en"} in totaal.
      </p>

      <div className="field">
        <label htmlFor="user-search">Zoek op naam</label>
        <input
          id="user-search"
          type="text"
          placeholder="Naam..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {error && <p className="error-text">{error}</p>}
      {filtered.length === 0 && !error && <p className="status-text">Geen gebruikers gevonden.</p>}

      {filtered.map((user) => (
        <div key={user.id} className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <div>
              <div className="exercise-name">{user.name}</div>
              <div className="exercise-meta">
                Aangemeld op {formatDate(user.created_at)}
                {!user.has_password && " · nog geen wachtwoord (legacy profiel)"}
              </div>
            </div>
            <span className="badge">{user.workout_count} workout{user.workout_count === 1 ? "" : "s"}</span>
          </div>
          <p className="field-hint" style={{ marginTop: 8, marginBottom: 0 }}>
            Niveau: {user.level ? LEVEL_LABELS[user.level] ?? user.level : "geen voorkeur"} · Locatie: {user.default_location === "home" ? "Thuis" : "Crossfit-gym"}
            {user.last_workout_at && ` · Laatste workout: ${formatDate(user.last_workout_at)}`}
          </p>
          <p className="field-hint" style={{ marginTop: 4, marginBottom: 0 }}>
            <code>{user.user_id}</code>
          </p>
        </div>
      ))}
    </div>
  );
}
