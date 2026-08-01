import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { addFavorite, listFavorites, removeFavorite } from "../api/favorites";
import { createHistory } from "../api/history";
import { getFixedWod } from "../api/wods";
import FixedWodStructure from "../components/wod/FixedWodStructure";
import { useProfile } from "../context/ProfileContext";

export default function FixedWodDetailPage() {
  const { id } = useParams();
  const { profile } = useProfile();
  const [wod, setWod] = useState(null);
  const [error, setError] = useState(null);
  const [logged, setLogged] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    getFixedWod(id)
      .then(setWod)
      .catch((err) => setError(err.message));
    listFavorites(profile.user_id)
      .then((favs) => setIsFavorite(favs.some((f) => f.item_type === "fixed_wod" && f.item_id === Number(id))))
      .catch(() => {});
  }, [id, profile.user_id]);

  const handleLog = async () => {
    try {
      await createHistory({
        user_id: profile.user_id,
        source: "fixed",
        fixed_wod_id: wod.id,
        wod_json: { name: wod.name, structure: wod.structure, time_cap_minutes: wod.time_cap_minutes },
      });
      setLogged(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleFavorite = async () => {
    const next = !isFavorite;
    setIsFavorite(next);
    try {
      if (next) await addFavorite(profile.user_id, "fixed_wod", Number(id));
      else await removeFavorite(profile.user_id, "fixed_wod", Number(id));
    } catch {
      setIsFavorite(!next);
    }
  };

  if (error) return <p className="error-text">{error}</p>;
  if (!wod) return <p className="status-text">Laden...</p>;

  return (
    <div>
      <Link to="/" className="btn-icon" style={{ display: "inline-flex", marginBottom: 12, textDecoration: "none" }}>
        ← Terug naar home
      </Link>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <h1 style={{ margin: 0 }}>{wod.name}</h1>
        <button
          type="button"
          className="favorite-heart"
          aria-label={isFavorite ? "Verwijder uit favorieten" : "Voeg toe aan favorieten"}
          aria-pressed={isFavorite}
          onClick={toggleFavorite}
        >
          {isFavorite ? "♥" : "♡"}
        </button>
      </div>
      <div className="card">
        <span className="badge">Benchmark</span>
        <p style={{ marginTop: 12 }}>{wod.description}</p>
        <FixedWodStructure structure={wod.structure} />
        {wod.time_cap_minutes && (
          <p className="field-hint" style={{ marginTop: 10 }}>Tijdslimiet: {wod.time_cap_minutes} minuten</p>
        )}
      </div>

      {logged ? (
        <p className="status-text">Toegevoegd aan je geschiedenis.</p>
      ) : (
        <button type="button" className="btn btn-primary" onClick={handleLog}>
          Dit ga ik doen
        </button>
      )}
    </div>
  );
}
