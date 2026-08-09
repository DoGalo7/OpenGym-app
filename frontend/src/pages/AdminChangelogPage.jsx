import { Link } from "react-router-dom";

const SECTIONS = [
  {
    title: "WOD maken - Workout of Stretch & Core",
    items: [
      "Twee hoofdkeuzes bovenaan: \"Workout\" (kracht/conditie) of \"Stretch & Core\" (herstel) - los van elkaar, want het zijn twee verschillende soorten sessies, geen varianten van dezelfde.",
      "Binnen Workout een tweede keuze: Genereer automatisch (kiest oefeningen op basis van spiergroepen, type training AMRAP/EMOM/Tabata/For Time, lengte, locatie, niveau en optioneel Hyrox-stijl of cardio) of Stel zelf samen (zoek oefeningen op, voeg ze toe - ook meerdere keren dezelfde - en vul zelf reps/afstand/calorieën/gewicht in).",
      "Stretch & Core: bouwt een reeks rustige stretches én core-stabiliteitsoefeningen (plank, dead bug, bird dog, glute bridge hold - elk 40 sec, aanpasbaar) voor de gekozen spiergroepen - geen kracht- of conditietraining.",
      "Elke oefening heeft een wisselknop (alternatief van dezelfde spiergroep/categorie), volgorde-knoppen (▲▼) om te herschikken, en een uitleg-link (YouTube-zoekopdracht).",
      "Duur per blok en reps/gewicht/seconden per oefening zijn achteraf nog aan te passen, ook nadat de WOD is gemaakt.",
      "Losse \"+ Warming-up toevoegen\"-knop als een workout er nog geen heeft, en daarna nog een losse \"+ Oefening toevoegen\"-knop om er stuk voor stuk nog eentje bij te doen (standaard begint een warming-up met 3 oefeningen).",
      "\"In het kort\"-kaart bovenaan een gemaakte WOD toont in één oogopslag alle blokken en oefeningen, zonder te hoeven scrollen door de volledige (bewerkbare) lijst.",
      "\"Start workout\"-knop (onder de oefeningenlijst) opent een timer die meetelt/aftelt passend bij het type training, met piepjes bij rondewissels (AMRAP/EMOM/Tabata/Stretch & Core/For Time) en een schermvergrendeling-blocker zolang hij loopt.",
      "\"Deel via WhatsApp\"-knop stuurt een tekstsamenvatting van de workout naar WhatsApp om te versturen.",
      "\"Delen met andere sporters\"-knop zet een gemaakte WOD onder Ideeën; kies \"Iedereen\" (zichtbaar voor alle sporters) of stuur hem rechtstreeks naar één geaccepteerde vriend(in) (alleen die persoon ziet hem dan bij Ideeën, gemarkeerd met 🎁 Voor jou).",
    ],
  },
  {
    title: "Veiligheid & blessures",
    items: [
      "In het profiel een blessure/beperking toevoegen met optioneel een spiergroep om te ontzien én/of een bekende conditie (zwangerschap, schouder-, rug-, knie-, pols-, enkel- of nekblessure) die automatisch een set risicovolle oefeningen uitsluit.",
      "Zodra het profiel een blessure/beperking heeft, verschijnt er bij WOD maken en bij een vaste WOD altijd een pop-up: dit is geen medisch advies, raadpleeg een specialist.",
      "Bij WOD maken kan eenmalig een tijdelijke blessure worden opgegeven die alleen voor die ene workout geldt (niet opgeslagen in het profiel).",
      "Kies je een spiergroep die volgens je profiel ontzien moet worden, dan vraagt de app expliciet om te bevestigen voordat hij die spiergroep alsnog gebruikt.",
      "Kies je thuis een cardio-type dat niet is aangevinkt bij Apparatuur thuis, dan waarschuwt de app dat hij automatisch een ander type kiest.",
    ],
  },
  {
    title: "Profiel",
    items: [
      "Naam + wachtwoord: een nieuwe naam kiest een eigen wachtwoord, een bestaande naam vereist het juiste wachtwoord (voorkomt dat je zomaar bij iemand anders' gegevens komt). Log uit-knop beschikbaar.",
      "Niveau (beginner/gemiddeld/gevorderd of geen voorkeur) en optie om per WOD daarvan af te wijken.",
      "Standaardlocatie (gym/thuis) en Apparatuur thuis (pull-up bar, halterstang, dumbbells, kettlebell, springtouw, airbike, roeimachine, ski erg, buiten hardlopen).",
      "Blessures & beperkingen (zie Veiligheid hierboven).",
      "Oefeningen die je nooit wilt doen (permanent uitgesloten van elke gegenereerde WOD).",
      "Jouw gewichten per oefening: sla je eigen werkgewicht op per kracht-oefening (start bij het RX-gewicht) - een nieuwe workout gebruikt dit automatisch, blijft per keer nog aan te passen.",
      "Vrienden (gebruikers-id delen en koppelen) - basisfunctionaliteit.",
    ],
  },
  {
    title: "Ideeën",
    items: [
      "Categorieën: AMRAP, EMOM, Tabata, For Time (incl. een reeks chippers), Benchmark (vaste WOD's zoals Murph en de Girls-WOD's), Gedeeld door sporters, Mijn favorieten. Categorie- en filterknoppen blijven vastgezet bovenaan zichtbaar tijdens het scrollen.",
      "Elke kaart toont in één oogopslag type, duur/niveau en de oefeningen. Hartje om te bewaren als favoriet.",
      "Gedeeld door sporters bevat zowel workouts die voor iedereen gedeeld zijn als workouts die een vriend(in) rechtstreeks naar jou heeft gestuurd (herkenbaar aan 🎁 Voor jou) - die laatste zie alleen jij.",
      "Een idee laden vult WOD maken automatisch in, met tijd/spiergroepen aanpasbaar; bij Benchmark zie je de vaste workout-structuur.",
    ],
  },
  {
    title: "Geschiedenis & rapportage",
    items: [
      "Elke voltooide WOD kan worden gelogd met resultaat en een losse notitie; items zijn te bewerken of te verwijderen, en te markeren als favoriet.",
      "Prestatierapport (via de knop op Geschiedenis): totaal aantal workouts, gemiddelde per week, een 12-weken trendgrafiek, verdeling per type training en per spiergroep.",
      "Homepagina toont een korte samenvatting (workouts totaal/deze week/favorieten) plus een 8-weken trendgrafiek en een disclaimer-banner.",
    ],
  },
  {
    title: "Beheer (deze pagina's, niet gekoppeld aan het hoofdmenu)",
    items: [
      "Oefeningen beheren (/admin/oefeningen): zoeken, bewerken, toevoegen en verwijderen van elke oefening in de database.",
      "Gebruikers-overzicht (/admin/gebruikers): alle aangemelde profielen, met aanmelddatum, niveau, aantal gelogde workouts en laatste workout - alleen leesbaar, geen wachtwoorden of andere gevoelige data zichtbaar.",
      "Wijzigingen hier zijn direct zichtbaar voor alle sporters - er is geen aparte test-/productieomgeving voor data.",
    ],
  },
  {
    title: "Techniek (voor als je met Claude verder werkt)",
    items: [
      "Backend: FastAPI + SQLAlchemy + SQLite lokaal / Postgres (Neon) in productie. Frontend: React + Vite, geen framework, losse CSS.",
      "Live op https://open-gym-app.vercel.app (frontend) en https://open-gym-app-api.onrender.com (backend) - elke push naar main deployt automatisch.",
      "Geen volwaardig auth-systeem (naam+wachtwoord is bewust lichtgewicht) en geen automatische online-sync van nieuwe oefeningen - dat staat nog als toekomstig idee in de projectnotities.",
    ],
  },
];

export default function AdminChangelogPage() {
  return (
    <div>
      <h1>Admin: overzicht van de app</h1>
      <p className="field-hint">
        Samenvatting van alles wat is ingesteld en gebouwd, voor als je een volgende keer weer
        verder gaat. Niet gekoppeld aan het hoofdmenu.
      </p>
      <Link to="/admin/oefeningen" className="btn-icon" style={{ display: "inline-flex", marginBottom: 12, textDecoration: "none" }}>
        ← Naar oefeningenbeheer
      </Link>

      {SECTIONS.map((section) => (
        <div key={section.title} className="card">
          <h3 style={{ marginTop: 0 }}>{section.title}</h3>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {section.items.map((item, i) => (
              <li key={i} style={{ marginBottom: 8 }}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
