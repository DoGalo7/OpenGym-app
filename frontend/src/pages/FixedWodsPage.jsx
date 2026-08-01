import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { listFixedWods } from "../api/wods";

const CATEGORIES = [
  { value: "", label: "Alle" },
  { value: "murph", label: "Murph" },
  { value: "girls", label: "Girls" },
  { value: "soldier", label: "Soldier" },
];

export default function FixedWodsPage() {
  const [category, setCategory] = useState("");
  const [wods, setWods] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    listFixedWods(category || undefined)
      .then(setWods)
      .catch((err) => setError(err.message));
  }, [category]);

  return (
    <div>
      <h1>Vaste WOD's</h1>
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

      {wods.map((wod) => (
        <Link key={wod.id} to={`/vaste-wods/${wod.id}`} className="card-link">
          <div className="card">
            <h3>{wod.name}</h3>
            <span className="badge">{wod.wod_category}</span>
            <p style={{ marginTop: 8 }}>{wod.description}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
