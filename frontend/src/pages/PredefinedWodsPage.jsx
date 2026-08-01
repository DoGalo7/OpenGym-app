import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { addFavorite, listFavorites, removeFavorite } from "../api/favorites";
import { listSharedWods, loadSharedWod } from "../api/sharedWods";
import { listFixedWods, listPredefinedWods, loadPredefinedWod } from "../api/wods";
import { useProfile } from "../context/ProfileContext";

const CATEGORIES = [
  { value: "", label: "Alle" },
  { value: "AMRAP", label: "AMRAP" },
  { value: "EMOM", label: "EMOM" },
  { value: "TABATA", label: "Tabata" },
  { value: "FOR_TIME", label: "Anders" },
  { value: "BENCHMARK", label: "Benchmark" },
  { value: "SHARED", label: "Gedeeld door sporters" },
];

const LEVEL_LABELS = { beginner: "Beginner", intermediate: "Gemiddeld", advanced: "Gevorderd" };

function formatMovement(m) {
  const qty = m.reps ? `${m.reps}x ` : m.distance_meters ? `${m.distance_meters}m ` : m.calories ? `${m.calories}cal ` : "";
  return `${qty}${m.exercise_name}`;
}

function toPredefinedItem(w) {
  return {
    kind: "predefined",
    id: w.id,
    name: w.name,
    badgeLabel: w.training_type === "FOR_TIME" ? "Anders" : w.training_type,
    meta: `${w.duration_minutes} min · ${LEVEL_LABELS[w.level] ?? w.level}`,
    description: w.description,
    lines: w.movements.map(formatMovement),
  };
}

function toFixedItem(w) {
  const [scheme, ...movements] = w.structure.split("\n");
  return {
    kind: "fixed",
    id: w.id,
    name: w.name,
    badgeLabel: "Benchmark",
    meta: scheme,
    description: w.description,
    lines: movements,
  };
}

function itemTypeFor(item) {
  return item.kind === "fixed" ? "fixed_wod" : item.kind === "shared" ? "shared_wod" : "predefined_wod";
}

function toSharedItem(w) {
  return {
    kind: "shared",
    id: w.id,
    name: w.name,
    badgeLabel: w.training_type === "FOR_TIME" ? "Anders" : w.training_type,
    meta: `${w.duration_minutes} min · Gedeeld door ${w.shared_by_name}`,
    description: "",
    lines: w.movements.map(formatMovement),
  };
}

export default function PredefinedWodsPage() {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [category, setCategory] = useState("");
  const [items, setItems] = useState([]);
  const [favoriteKeys, setFavoriteKeys] = useState(new Set());
  const [error, setError] = useState(null);
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    listFavorites(profile.user_id)
      .then((favs) => setFavoriteKeys(new Set(favs.map((f) => `${f.item_type}:${f.item_id}`))))
      .catch(() => {});
  }, [profile.user_id]);

  useEffect(() => {
    setError(null);
    if (category === "BENCHMARK") {
      listFixedWods().then((data) => setItems(data.map(toFixedItem))).catch((err) => setError(err.message));
    } else if (category === "SHARED") {
      listSharedWods().then((data) => setItems(data.map(toSharedItem))).catch((err) => setError(err.message));
    } else if (category === "") {
      Promise.all([listPredefinedWods(), listFixedWods(), listSharedWods()])
        .then(([predefined, fixed, shared]) =>
          setItems([...predefined.map(toPredefinedItem), ...fixed.map(toFixedItem), ...shared.map(toSharedItem)])
        )
        .catch((err) => setError(err.message));
    } else {
      listPredefinedWods(category).then((data) => setItems(data.map(toPredefinedItem))).catch((err) => setError(err.message));
    }
  }, [category]);

  const handleSelect = async (item) => {
    if (loadingId !== null) return;
    if (item.kind === "fixed") {
      navigate(`/vaste-wods/${item.id}`);
      return;
    }
    setLoadingId(item.id);
    setError(null);
    try {
      const wod = item.kind === "shared"
        ? await loadSharedWod(item.id, profile.user_id)
        : await loadPredefinedWod(item.id, profile.user_id);
      navigate("/wod-maken", { state: { loadedWod: wod } });
    } catch (err) {
      setError(err.message);
      setLoadingId(null);
    }
  };

  const toggleFavorite = async (event, item) => {
    event.stopPropagation();
    const itemType = itemTypeFor(item);
    const key = `${itemType}:${item.id}`;
    const isFavorite = favoriteKeys.has(key);
    setFavoriteKeys((prev) => {
      const next = new Set(prev);
      if (isFavorite) next.delete(key);
      else next.add(key);
      return next;
    });
    try {
      if (isFavorite) await removeFavorite(profile.user_id, itemType, item.id);
      else await addFavorite(profile.user_id, itemType, item.id);
    } catch {
      setFavoriteKeys((prev) => {
        const next = new Set(prev);
        if (isFavorite) next.add(key);
        else next.delete(key);
        return next;
      });
    }
  };

  return (
    <div>
      <h1>Ideeën</h1>
      <p className="field-hint">
        Kies een type training en selecteer een workout. Bij AMRAP/EMOM/Tabata/Anders kom je terug
        in je WOD-menu om nog aan te passen; bij Benchmark zie je de vaste workout.
      </p>

      <div className="chip-group" style={{ marginBottom: 16 }}>
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            className={`chip${category === c.value ? " active" : ""}`}
            onClick={() => setCategory(c.value)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {error && <p className="error-text">{error}</p>}
      {items.length === 0 && !error && (
        <p className="status-text">Geen workouts gevonden voor deze categorie.</p>
      )}

      {items.map((item) => {
        const itemType = itemTypeFor(item);
        const isFavorite = favoriteKeys.has(`${itemType}:${item.id}`);
        return (
          <div
            key={`${item.kind}-${item.id}`}
            className="card idea-card"
            role="button"
            tabIndex={0}
            onClick={() => handleSelect(item)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleSelect(item);
              }
            }}
            style={loadingId !== null ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <h3 style={{ marginBottom: 4 }}>{item.name}</h3>
              <button
                type="button"
                className="favorite-heart"
                aria-label={isFavorite ? "Verwijder uit favorieten" : "Voeg toe aan favorieten"}
                aria-pressed={isFavorite}
                onClick={(event) => toggleFavorite(event, item)}
              >
                {isFavorite ? "♥" : "♡"}
              </button>
            </div>
            <p className="field-hint" style={{ margin: 0 }}>
              <span className="badge">{item.badgeLabel}</span>
              {" · "}
              {item.meta}
            </p>
            <p style={{ marginTop: 8, marginBottom: 4 }}>{item.description}</p>
            <ul className="idea-movement-list">
              {item.lines.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
            {loadingId === item.id && <p className="field-hint" style={{ marginTop: 4 }}>Laden...</p>}
          </div>
        );
      })}
    </div>
  );
}
