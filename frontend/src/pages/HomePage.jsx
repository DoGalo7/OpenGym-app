import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { listHistory } from "../api/history";
import { listPredefinedWods, loadPredefinedWod } from "../api/wods";
import { useProfile } from "../context/ProfileContext";
import { buildWeeklyBuckets, currentStreakWeeks } from "../utils/historyStats";

function formatMovement(m) {
  const qty = m.reps ? `${m.reps}x ` : m.distance_meters ? `${m.distance_meters}m ` : m.calories ? `${m.calories}cal ` : "";
  return `${qty}${m.exercise_name}`;
}

export default function HomePage() {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState(null);
  const [featured, setFeatured] = useState(null);
  const [featuredError, setFeaturedError] = useState(null);
  const [startingFeatured, setStartingFeatured] = useState(false);

  useEffect(() => {
    listHistory(profile.user_id, { limit: 500 })
      .then(setEntries)
      .catch((err) => setError(err.message));
  }, [profile.user_id]);

  useEffect(() => {
    listPredefinedWods()
      .then((wods) => {
        if (wods.length === 0) return;
        // Wisselt 1x per dag - geen aparte "WOD van de dag"-opslag nodig, gewoon een
        // deterministische keuze op basis van de kalenderdag zodat hij niet bij elke
        // paginabezoek verandert maar ook niet random/inconsistent aanvoelt.
        const dayIndex = Math.floor(Date.now() / 86400000) % wods.length;
        setFeatured(wods[dayIndex]);
      })
      .catch(() => {});
  }, []);

  const weeks = buildWeeklyBuckets(entries, 8);
  const maxCount = Math.max(1, ...weeks.map((w) => w.count));
  const thisWeekCount = weeks[weeks.length - 1]?.count ?? 0;
  const favoriteCount = entries.filter((e) => e.favorite).length;
  const streak = currentStreakWeeks(weeks);

  const handleStartFeatured = async () => {
    if (!featured) return;
    setStartingFeatured(true);
    setFeaturedError(null);
    try {
      const wod = await loadPredefinedWod(featured.id, profile.user_id);
      navigate("/wod-maken", { state: { loadedWod: wod } });
    } catch (err) {
      setFeaturedError(err.message);
      setStartingFeatured(false);
    }
  };

  return (
    <div>
      <h1>Welkom{profile.name ? `, ${profile.name}` : ""}</h1>

      <div className="card disclaimer-banner">
        <span className="disclaimer-icon" aria-hidden="true">⚠</span>
        <p style={{ margin: 0 }}>
          Deze app geeft geen medisch advies. Twijfel je of een oefening past bij een blessure of
          andere beperking, raadpleeg dan altijd iemand met een medische achtergrond.
        </p>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="stat-row">
        <div className="stat-tile">
          <span className="stat-value">{entries.length}</span>
          <span className="stat-label">workouts gelogd</span>
        </div>
        <div className="stat-tile">
          <span className="stat-value">{thisWeekCount}</span>
          <span className="stat-label">deze week</span>
        </div>
        <div className="stat-tile">
          <span className="stat-value">{streak > 0 ? `🔥${streak}` : "0"}</span>
          <span className="stat-label">{streak === 1 ? "week op rij" : "weken op rij"}</span>
        </div>
        <div className="stat-tile">
          <span className="stat-value">{favoriteCount}</span>
          <span className="stat-label">favorieten</span>
        </div>
      </div>

      {entries.length > 0 ? (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Workouts per week</h3>
          <p className="field-hint" style={{ marginTop: 0 }}>Laatste 8 weken</p>
          <div className="chart-bars" role="img" aria-label="Aantal gelogde workouts per week, laatste 8 weken">
            {weeks.map((w, i) => (
              <div key={i} className="chart-bar-col">
                <div className="chart-bar-track">
                  <div
                    className="chart-bar"
                    tabIndex={0}
                    style={{ height: `${(w.count / maxCount) * 100}%` }}
                  >
                    <span className="chart-tooltip">
                      <strong>{w.count}</strong> workout{w.count === 1 ? "" : "s"}
                      <br />
                      week van {w.label}
                    </span>
                  </div>
                </div>
                <span className="chart-bar-label">{w.label}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="status-text">
          Nog geen workouts gelogd. Maak een WOD of kies een idee om te beginnen.
        </p>
      )}

      {featured && (
        <div className="card">
          <p className="badge" style={{ margin: 0 }}>💡 WOD van de dag</p>
          <h3 style={{ marginBottom: 4 }}>{featured.name}</h3>
          <p className="field-hint" style={{ marginTop: 0 }}>
            {featured.training_type === "FOR_TIME" ? "For Time" : featured.training_type} · {featured.duration_minutes} min ·{" "}
            {{ beginner: "Beginner", intermediate: "Gemiddeld", advanced: "Gevorderd" }[featured.level] ?? featured.level}
          </p>
          <p style={{ marginTop: 8, marginBottom: 4 }}>{featured.description}</p>
          <ul className="idea-movement-list">
            {featured.movements.map((m, i) => (
              <li key={i}>{formatMovement(m)}</li>
            ))}
          </ul>
          <button type="button" className="btn btn-primary" onClick={handleStartFeatured} disabled={startingFeatured} style={{ width: "100%", marginTop: 8 }}>
            {startingFeatured ? "Bezig..." : "Start deze WOD"}
          </button>
          {featuredError && <p className="error-text">{featuredError}</p>}
        </div>
      )}

      <div className="card" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link to="/wod-maken" className="btn btn-secondary">Stel zelf een WOD samen</Link>
        <Link to="/workout-ideeen" className="btn btn-secondary">Bekijk alle ideeën</Link>
      </div>
    </div>
  );
}
