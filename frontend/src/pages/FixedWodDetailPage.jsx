import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { addFavorite, listFavorites, removeFavorite } from "../api/favorites";
import { createHistory } from "../api/history";
import { getFixedWod } from "../api/wods";
import ConfirmModal from "../components/shared/ConfirmModal";
import FixedWodStructure from "../components/wod/FixedWodStructure";
import SaveResultForm from "../components/wod/SaveResultForm";
import { useProfile } from "../context/ProfileContext";
import { useInjuryDisclaimer } from "../hooks/useInjuryDisclaimer";

export default function FixedWodDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [wod, setWod] = useState(null);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const injuryDisclaimer = useInjuryDisclaimer(profile);

  useEffect(() => {
    getFixedWod(id)
      .then(setWod)
      .catch((err) => setError(err.message));
    listFavorites(profile.user_id)
      .then((favs) => setIsFavorite(favs.some((f) => f.item_type === "fixed_wod" && f.item_id === Number(id))))
      .catch(() => {});
  }, [id, profile.user_id]);

  const handleSaveResult = (result) =>
    createHistory({
      user_id: profile.user_id,
      source: "fixed",
      fixed_wod_id: wod.id,
      wod_json: { name: wod.name, structure: wod.structure, time_cap_minutes: wod.time_cap_minutes },
      result,
    });

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
      {injuryDisclaimer.show && (
        <ConfirmModal
          title="Blessure of beperking actief"
          message="Je hebt in je profiel een blessure of beperking aangegeven. Deze vaste WOD wordt hier niet automatisch op aangepast. Raadpleeg altijd een arts, fysiotherapeut of andere specialist om te bepalen of deze oefeningen voor jou geschikt zijn. De app doet een voorstel, maar kan niet verantwoordelijk worden gehouden voor blessures."
          confirmLabel="Ik begrijp het, ga verder"
          cancelLabel="Terug naar home"
          onConfirm={injuryDisclaimer.dismiss}
          onCancel={() => navigate("/")}
        />
      )}

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

      <SaveResultForm onSave={handleSaveResult} />
    </div>
  );
}
