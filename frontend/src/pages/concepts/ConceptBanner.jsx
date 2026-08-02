import { Link } from "react-router-dom";

export default function ConceptBanner({ title }) {
  return (
    <div className="card" style={{ background: "var(--color-accent)", marginBottom: 12 }}>
      <p className="field-hint" style={{ margin: 0 }}>
        🧪 Ontwerp-preview — <strong>{title}</strong>. Werkt met voorbeelddata, niet gekoppeld aan
        je echte profiel of workouts.{" "}
        <Link to="/concept">← Terug naar overzicht</Link>
      </p>
    </div>
  );
}
