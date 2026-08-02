import { Link } from "react-router-dom";

const CONCEPTS = [
  {
    to: "/concept/compact",
    title: "1. Compact",
    description:
      "Dezelfde opzet als de huidige WOD maken-pagina, maar met minder ruimte per oefening: " +
      "reps/gewicht op één regel onder de naam, acties icoon-only. Kleinste stap - blijft het " +
      "meest herkenbaar.",
  },
  {
    to: "/concept/menu",
    title: "2. Menu (⋮)",
    description:
      "Elke oefening is standaard maar één regel (naam + belangrijkste getal). Uitleg, Wissel, " +
      "verplaatsen en verwijderen zitten achter een ⋮-knop. Grootste ruimtewinst bij veel " +
      "oefeningen, kost een extra tik per actie.",
  },
  {
    to: "/concept/accordion",
    title: "3. Uitklapbaar per blok",
    description:
      "Warming-up/Workout/Cardio staan standaard dicht met alleen de oefeningnamen op één regel " +
      "(zoals 'In het kort', maar per blok). Tik een blok open om te bewerken. Handig zodra er " +
      "meerdere blokken zijn.",
  },
];

export default function ConceptIndexPage() {
  return (
    <div>
      <h1>Ontwerp-previews: WOD maken</h1>
      <p className="field-hint">
        Niet gekoppeld aan het hoofdmenu, niet live voor sporters. Drie richtingen om de "WOD
        maken"-pagina compacter te maken (nu moet je vaak flink scrollen). Elke preview gebruikt
        dezelfde voorbeeld-workout en werkt lokaal (verwijderen/toevoegen kun je uitproberen, er
        wordt niets opgeslagen). De huidige pagina blijft ongewijzigd op{" "}
        <Link to="/wod-maken">/wod-maken</Link>.
      </p>

      {CONCEPTS.map((c) => (
        <Link key={c.to} to={c.to} className="card card-link" style={{ display: "block", marginBottom: 12 }}>
          <h3 style={{ marginTop: 0 }}>{c.title}</h3>
          <p className="field-hint" style={{ margin: 0 }}>{c.description}</p>
        </Link>
      ))}
    </div>
  );
}
