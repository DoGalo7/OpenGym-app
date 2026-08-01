import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { listPredefinedWods, loadPredefinedWod } from "../api/wods";
import { useProfile } from "../context/ProfileContext";

const CATEGORIES = [
  { value: "", label: "Alle" },
  { value: "AMRAP", label: "AMRAP" },
  { value: "EMOM", label: "EMOM" },
  { value: "TABATA", label: "Tabata" },
  { value: "FOR_TIME", label: "Anders" },
];

const LEVEL_LABELS = { beginner: "Beginner", intermediate: "Gemiddeld", advanced: "Gevorderd" };

export default function PredefinedWodsPage() {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [trainingType, setTrainingType] = useState("");
  const [wods, setWods] = useState([]);
  const [error, setError] = useState(null);
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    listPredefinedWods(trainingType || undefined)
      .then(setWods)
      .catch((err) => setError(err.message));
  }, [trainingType]);

  const handleSelect = async (id) => {
    setLoadingId(id);
    setError(null);
    try {
      const wod = await loadPredefinedWod(id, profile.user_id);
      navigate("/", { state: { loadedWod: wod } });
    } catch (err) {
      setError(err.message);
      setLoadingId(null);
    }
  };

  return (
    <div>
      <h1>Voorgedefinieerde workouts</h1>
      <p className="field-hint">
        Kies een type training en selecteer een workout. Je komt terug in je WOD-menu, waar je
        alles nog kunt aanpassen.
      </p>

      <div className="chip-group" style={{ marginBottom: 16 }}>
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            className={`chip${trainingType === c.value ? " active" : ""}`}
            onClick={() => setTrainingType(c.value)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {error && <p className="error-text">{error}</p>}
      {wods.length === 0 && !error && (
        <p className="status-text">Geen workouts gevonden voor deze categorie.</p>
      )}

      {wods.map((wod) => (
        <button
          key={wod.id}
          type="button"
          className="card-button"
          onClick={() => handleSelect(wod.id)}
          disabled={loadingId !== null}
        >
          <div className="card">
            <h3 style={{ marginBottom: 4 }}>{wod.name}</h3>
            <p className="field-hint" style={{ margin: 0 }}>
              <span className="badge">{wod.training_type === "FOR_TIME" ? "Anders" : wod.training_type}</span>
              {" · "}
              {wod.duration_minutes} min · {LEVEL_LABELS[wod.level] ?? wod.level}
            </p>
            <p style={{ marginTop: 8, marginBottom: 4 }}>{wod.description}</p>
            <p className="field-hint" style={{ margin: 0 }}>{wod.movement_names.join(", ")}</p>
            {loadingId === wod.id && <p className="field-hint" style={{ marginTop: 4 }}>Laden...</p>}
          </div>
        </button>
      ))}
    </div>
  );
}
