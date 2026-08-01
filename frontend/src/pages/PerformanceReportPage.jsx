import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { listHistory } from "../api/history";
import { useProfile } from "../context/ProfileContext";
import { buildWeeklyBuckets, muscleGroupCounts, trainingTypeCounts } from "../utils/historyStats";

const MUSCLE_GROUP_LABELS = {
  schouders: "Schouders", rug: "Rug", borst: "Borst", armen: "Armen", benen: "Benen",
  billen: "Billen", buik: "Buik", volledig_lichaam: "Volledig lichaam",
};

function BarList({ items, labelFor, total }) {
  return (
    <div>
      {items.map(([key, count]) => (
        <div key={key} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15 }}>
            <span>{labelFor(key)}</span>
            <span className="field-hint">{count}x</span>
          </div>
          <div style={{ background: "var(--color-border)", borderRadius: 999, height: 8, overflow: "hidden" }}>
            <div
              style={{
                width: `${(count / total) * 100}%`,
                background: "var(--color-primary)",
                height: "100%",
                borderRadius: 999,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PerformanceReportPage() {
  const { profile } = useProfile();
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    listHistory(profile.user_id, { limit: 500 })
      .then(setEntries)
      .catch((err) => setError(err.message));
  }, [profile.user_id]);

  if (error) return <p className="error-text">{error}</p>;
  if (entries.length === 0) {
    return (
      <div>
        <h1>Prestatierapport</h1>
        <p className="status-text">Nog geen workouts gelogd - er is nog niets te rapporteren.</p>
      </div>
    );
  }

  const weeks = buildWeeklyBuckets(entries, 12);
  const maxWeekCount = Math.max(1, ...weeks.map((w) => w.count));
  const oldestDate = entries.reduce(
    (min, e) => (new Date(e.created_at) < min ? new Date(e.created_at) : min),
    new Date(entries[0].created_at)
  );
  const weeksSinceStart = Math.max(1, Math.ceil((Date.now() - oldestDate.getTime()) / (7 * 24 * 60 * 60 * 1000)));
  const avgPerWeek = (entries.length / weeksSinceStart).toFixed(1);

  const trainingTypes = trainingTypeCounts(entries);
  const muscleGroups = muscleGroupCounts(entries);
  const trainingTypeTotal = trainingTypes.reduce((sum, [, c]) => sum + c, 0);
  const muscleGroupTotal = muscleGroups.reduce((sum, [, c]) => sum + c, 0);

  return (
    <div>
      <h1>Prestatierapport</h1>
      <Link to="/geschiedenis" className="btn-icon" style={{ display: "inline-flex", marginBottom: 12, textDecoration: "none" }}>
        ← Terug naar geschiedenis
      </Link>

      <div className="stat-row">
        <div className="stat-tile">
          <span className="stat-value">{entries.length}</span>
          <span className="stat-label">workouts totaal</span>
        </div>
        <div className="stat-tile">
          <span className="stat-value">{avgPerWeek}</span>
          <span className="stat-label">gem. per week</span>
        </div>
        <div className="stat-tile">
          <span className="stat-value">{oldestDate.toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}</span>
          <span className="stat-label">sinds</span>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Workouts per week</h3>
        <p className="field-hint" style={{ marginTop: 0 }}>Laatste 12 weken</p>
        <div className="chart-bars" role="img" aria-label="Aantal gelogde workouts per week, laatste 12 weken">
          {weeks.map((w, i) => (
            <div key={i} className="chart-bar-col">
              <div className="chart-bar-track">
                <div className="chart-bar" tabIndex={0} style={{ height: `${(w.count / maxWeekCount) * 100}%` }}>
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

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Type training</h3>
        <BarList items={trainingTypes} labelFor={(t) => t.replace("_", " ")} total={trainingTypeTotal} />
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Spiergroepen</h3>
        <p className="field-hint" style={{ marginTop: 0 }}>
          Hoe vaak een spiergroep in een workout voorkwam (alleen bij zelf gegenereerde of
          samengestelde WOD's - vaste WOD's tellen hier niet mee).
        </p>
        {muscleGroups.length > 0 ? (
          <BarList items={muscleGroups} labelFor={(m) => MUSCLE_GROUP_LABELS[m] ?? m} total={muscleGroupTotal} />
        ) : (
          <p className="field-hint">Nog geen data.</p>
        )}
      </div>
    </div>
  );
}
