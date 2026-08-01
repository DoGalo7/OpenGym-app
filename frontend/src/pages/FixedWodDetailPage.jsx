import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

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

  useEffect(() => {
    getFixedWod(id)
      .then(setWod)
      .catch((err) => setError(err.message));
  }, [id]);

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

  if (error) return <p className="error-text">{error}</p>;
  if (!wod) return <p className="status-text">Laden...</p>;

  return (
    <div>
      <Link to="/vaste-wods" className="btn-icon" style={{ display: "inline-flex", marginBottom: 12, textDecoration: "none" }}>
        ← Terug naar vaste WOD's
      </Link>
      <h1>{wod.name}</h1>
      <div className="card">
        <span className="badge">{wod.wod_category}</span>
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
