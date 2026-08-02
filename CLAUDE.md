# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Open Gym-app** — een applicatie waarmee sporters zelf een WOD (Workout of the Day) kunnen samenstellen.

Belangrijk voor elke bijdrage: de doelgroep bestaat uit sporters zonder IT-achtergrond. Houd de UI en flows extreem eenvoudig en jargonvrij — geen technische termen, geen overbodige configuratie-opties, duidelijke Nederlandstalige teksten.

* Simpelheid is belangrijk! Maak dus geen complexe schermen, moet eenvoudig en snel te doorlopen zijn.
* De lay-out is sportief.
* De app moet primair goed werken op een telefoon (mobile-first, responsive vanaf ~360px breed, duimvriendelijke bediening, geen hover-afhankelijke interacties).
* De app zoekt dagelijks online naar nieuwe oefeningen of WOD's en verwerkt die in een eigen database waaruit gekozen kan worden. (In deze versie nog niet geïmplementeerd — zie "Seed data & online sync" hieronder.)

## Project overview

Het is een app waarin sporters een eigen WOD kunnen samenstellen.

Gebruikers kunnen:

* Een lengte van de WOD invullen
* Aangeven welke oefeningen zij zouden willen doen of door de app oefeningen laten genereren op basis van alle online beschikbare Crossfit-oefeningen.
* Gebruiker kan het gewicht zelf aangeven of de app adviseert een RX-gewicht (op basis van wat hij online kan vinden).
* Aangeven welke spiergroepen getraind worden zodat de app een workout voor die groepen kan genereren.
* Kiezen of ze willen combineren met cardio (assault bike, ski erg, row of hardlopen).
* Het type training bepalen (de app weet welke type trainingen er zijn, bijvoorbeeld EMOM of AMRAP).
* Alternatieven kiezen voor de door de app gekozen oefeningen door simpel op een alternatief-icoontje naast de oefening te kiezen.
* Aangeven of zij blessures hebben en zo ja, welke blessures dit zijn. De app past zijn workouts daarop aan en ontziet die spiergroepen.
* Aangeven of ze in een Crossfit-gym of thuis (zonder equipment) trainen. De workout wordt hierop aangepast.
* In een profiel geef je aan welk niveau je hebt. Dit heeft te maken met de moeilijkheidsgraad van de oefeningen. Dit wordt opgeslagen bij de gebruiker.
* Er is een optie om van het niveau af te wijken, normaliter staat de optie uit het profiel aangevinkt (standaard).
* Kiezen voor een warming-up en hoe lang die warming-up dan duurt. De warming up moet altijd aangepast zijn op de spiergroepen die je gaat trainen.

In het profiel kiest de gebruiker de volgende instellingen die worden meegenomen in de keuze voor een WOD:

* Blessures of andere beperkingen waardoor je iets moet ontzien (dit kan bijv. ook zwangerschap zijn)
* Specifieke oefeningen die je **nooit** wilt uitvoeren (bijvoorbeeld barbells of rope climb)
* Geschiedenis en prestaties bijhouden
* Koppelen met vrienden zodat je workouts met elkaar kunt delen

Naast bovenstaande maatwerk WOD's kunnen gebruikers ook kiezen uit een vastgestelde WOD zoals:

* The Murph
* WOD's van Meet the Girls
* Soldier WOD's

## Project status

Backend en frontend zijn gebouwd en werken lokaal. Getest via de browser (volledige golden path: profiel → WOD genereren → wisselen → opslaan → vaste WOD loggen → geschiedenis) en via directe API-calls.

### Techstack

* Backend: Python 3.12, FastAPI, SQLAlchemy 2.0 (Mapped/mapped_column-stijl), SQLite, Pydantic v2.
* Frontend: React + Vite (plain JavaScript, geen TypeScript), react-router-dom, losse CSS (geen UI-framework).
* Geen auth: een lokaal profiel wordt geïdentificeerd via een client-gegenereerde `user_id` (UUID) die in localStorage van de browser staat en bij elk verzoek wordt meegestuurd. `UserProfile.user_id` is bewust een stabiele externe sleutel zodat hier later een echt multi-user/auth-systeem overheen gebouwd kan worden zonder het schema te wijzigen.

### Setup

Backend (vanuit `backend/`):
```
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Frontend (vanuit `frontend/`):
```
npm install
```

### Draaien (lokale dev, twee terminals)

Backend: `venv\Scripts\Activate.ps1` dan `python -m uvicorn app.main:app --reload --port 8000`
Frontend: `npm run dev` (http://localhost:5173)

Bij het opstarten van de backend maakt `Base.metadata.create_all()` automatisch `backend/open_gym.db` aan (als die nog niet bestaat) en vult `app/seed/seeder.py::run_seed()` idempotent de database met de startset oefeningen en vaste WOD's.

### Build

Frontend productie-build: `npm run build` (vanuit `frontend/`). Geen build-stap voor de backend (draait direct via uvicorn). Backend-tests: `pytest` (vanuit `backend/`, venv geactiveerd) — dekt `wod_generator.py`'s spiergroep/niveau/locatie-filtering, blessure- en conditie-uitsluiting, en de override/tijdelijke-blessure/gekozen-oefening-precedenten (zie `backend/tests/`). Geen lint-commando voor de backend; frontend heeft `npm run lint` (oxlint).

### Architectuur

**Backend** (`backend/app/`):

* `models.py` — SQLAlchemy-modellen: `Exercise`, `FixedWod`, `UserProfile`, `Injury`, `WodHistory`, `Friendship`, plus de `profile_excluded_exercise`-koppeltabel.
* `constants.py` — gedeelde enums (`Level`, `MuscleGroup`, `Category`, `CardioType`, `TrainingType`, `Location`, `WodCategory`) gebruikt door zowel de API-laag als de generator/seed-data.
* `schemas.py` — Pydantic request/response-modellen voor de API.
* `crud.py` — dunne databasehelpers (profiel, blessures, uitgesloten oefeningen, vriendschappen, geschiedenis) gedeeld door de routers.
* `wod_generator.py` — het kernalgoritme (`generate_wod`): filtert de oefeningenpool op profiel (niveau/blessures/uitsluitingen/locatie), past de verzoekparameters toe (lengte, spiergroepen, trainingstype, cardio, eigen vs. RX-gewicht), bouwt een warming-up-blok, en koppelt per oefening een vooraf berekende alternatievenlijst (gebruikt door de wissel-knop in de frontend — geen extra API-call nodig).
* `routers/` — `exercises.py`, `profiles.py`, `wods.py`, `history.py`, allemaal gekoppeld onder `/api/...` in `main.py`.
* `seed/` — startdata en de plek voor toekomstige online-sync:
  * `exercises.py` — 55 oefeningen (barbell/dumbbell/kettlebell/rack/bodyweight/gymnastics/cardio, alle niveaus en spiergroepen).
  * `fixed_wods.py` — 9 vaste WOD's (Murph, 6 Girls-WOD's, 2 Soldier-WOD's).
  * `seeder.py` — `run_seed(db)`, idempotent, draait bij elke opstart.
  * `sync.py` — `sync_exercises_from_source()`, een expliciet **niet-geïmplementeerde** placeholder voor de "dagelijkse online sync" uit de productspec. Er wordt in deze versie niet live het internet doorzocht; zie de docstring in dit bestand voor het bedoelde ontwerp wanneer dit wél gebouwd wordt.

**Seed-data dekking (2026-08-02)**: elke combinatie van spiergroep × niveau × locatie heeft nu
minstens 3 hoofd-oefeningen en 4 warming-up-oefeningen beschikbaar, ook bij locatie=thuis zonder
eigen apparatuur (voorheen konden sommige combinaties, vooral thuis, terugvallen op maar 1-2
oefeningen). Geverifieerd met een meetscript dat `wod_generator._to_main_pool` nabootst per
combinatie — zie sessie-geschiedenis. Mocht dit in de toekomst weer te dun worden (bijv. na het
toevoegen van een nieuwe blessure-conditie die veel oefeningen uitsluit), herhaal die meting voor
je nieuwe oefeningen toevoegt.

**Frontend** (`frontend/src/`):

* `api/` — fetch-wrappers per resource (`client.js`, `profiles.js`, `exercises.js`, `wods.js`, `history.js`).
* `hooks/useProfile.js` + `context/ProfileContext.jsx` — bootstrap van het lokale profiel via de `user_id` in localStorage.
* `pages/` — `GeneratorPage.jsx`, `ProfilePage.jsx`, `FixedWodsPage.jsx`, `FixedWodDetailPage.jsx`, `HistoryPage.jsx`.
* `components/` — `wod/` (blok- en oefeningweergave, wissel-menu, opslaan-formulier), `profile/` (niveau, blessures, uitsluitingen, vrienden), `layout/` (navigatiebalk + paginacontainer), `history/` (geschiedenis-item met uitklap/resultaat-bewerken), `shared/` (herbruikbare Toggle).
* `styles/` — `variables.css` (kleuren/spacing-tokens, licht + donker thema), `base.css`, `components.css` — gedeeld ontwerpsysteem, mobile-first (vaste onderste tab-balk onder 768px, bovenbalk erboven).
* `utils/explanationLink.js` — bouwt per oefening een YouTube-zoeklink (geen losse, hardgecodeerde video-URL's, om dode of onjuiste links te voorkomen).

De "Uitleg"-knop naast elke oefening linkt naar een YouTube-zoekopdracht op de oefeningnaam, niet naar één specifieke video.
