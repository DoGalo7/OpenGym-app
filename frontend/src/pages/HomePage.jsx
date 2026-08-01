import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { listHistory } from "../api/history";
import { useProfile } from "../context/ProfileContext";

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + diff);
  return d;
}

function buildWeeklyBuckets(entries, weeksCount) {
  const thisWeekStart = startOfWeek(new Date());
  const buckets = [];
  for (let i = weeksCount - 1; i >= 0; i--) {
    const start = new Date(thisWeekStart);
    start.setDate(start.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    buckets.push({ start, end, count: 0 });
  }
  for (const entry of entries) {
    const created = new Date(entry.created_at);
    const bucket = buckets.find((b) => created >= b.start && created < b.end);
    if (bucket) bucket.count += 1;
  }
  return buckets.map((b) => ({
    label: b.start.toLocaleDateString("nl-NL", { day: "numeric", month: "short" }),
    count: b.count,
  }));
}

export default function HomePage() {
  const { profile } = useProfile();
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    listHistory(profile.user_id, { limit: 500 })
      .then(setEntries)
      .catch((err) => setError(err.message));
  }, [profile.user_id]);

  const weeks = buildWeeklyBuckets(entries, 8);
  const maxCount = Math.max(1, ...weeks.map((w) => w.count));
  const thisWeekCount = weeks[weeks.length - 1]?.count ?? 0;
  const favoriteCount = entries.filter((e) => e.favorite).length;

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

      <div className="card" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link to="/wod-maken" className="btn btn-primary">Maak een WOD</Link>
        <Link to="/workout-ideeen" className="btn btn-secondary">Bekijk ideeën</Link>
      </div>
    </div>
  );
}
