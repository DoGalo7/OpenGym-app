import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { getExercise } from "../api/exercises";
import { createHistory } from "../api/history";
import { generateWod } from "../api/wods";
import CategoryPicker from "../components/wod/CategoryPicker";
import ManualExercisePicker from "../components/wod/ManualExercisePicker";
import MuscleGroupPicker from "../components/wod/MuscleGroupPicker";
import SaveResultForm from "../components/wod/SaveResultForm";
import TrainingTypeSelect from "../components/wod/TrainingTypeSelect";
import WodBlockCard from "../components/wod/WodBlockCard";
import CollapsibleSection from "../components/shared/CollapsibleSection";
import Toggle from "../components/shared/Toggle";
import { useProfile } from "../context/ProfileContext";

const CARDIO_TYPES = [
  { value: "assault_bike", label: "Airbike" },
  { value: "ski_erg", label: "Ski erg" },
  { value: "row", label: "Roeien" },
  { value: "run", label: "Hardlopen" },
];

// Mirrors backend/app/wod_generator.py so a swap-to-cardio or swap-to-strength exercise
// in the result gets a sensible reps/distance/calories value instead of a stale one.
const LEVEL_MULTIPLIER = { beginner: 0.7, intermediate: 1.0, advanced: 1.3 };
const CARRY_DISTANCE_METERS = { beginner: 60, intermediate: 100, advanced: 150 };
const DEFAULT_CARRY_DISTANCE_METERS = 100;
const CARDIO_PACE_METERS_PER_MIN = { run: 160, row: 125, ski_erg: 110 };
const CARDIO_PACE_CALORIES_PER_MIN = 10;
const CARDIO_TYPICAL_DISTANCES = {
  run: [100, 200, 400, 800, 1200, 1600, 2000],
  row: [250, 500, 750, 1000, 1500, 2000],
  ski_erg: [250, 500, 750, 1000, 1500],
};
const CARDIO_TYPICAL_CALORIES = [10, 15, 20, 25, 30, 40, 50];

function snapToTypical(value, typicalValues) {
  return typicalValues.reduce((best, v) => (Math.abs(v - value) < Math.abs(best - value) ? v : best));
}

function repsFor(category, effectiveLevel) {
  const multiplier = LEVEL_MULTIPLIER[effectiveLevel] ?? 1.0;
  const base = category === "barbell" ? 5 : category === "rack" || category === "gymnastics" ? 6 : 8;
  return Math.max(1, Math.ceil(base * multiplier));
}

export default function GeneratorPage() {
  const { profile } = useProfile();
  const routerLocation = useLocation();
  const navigate = useNavigate();
  const resultRef = useRef(null);

  const [length, setLength] = useState(20);
  const [muscleGroups, setMuscleGroups] = useState(["volledig_lichaam"]);
  const [trainingType, setTrainingType] = useState("AMRAP");
  const [location, setLocation] = useState(profile.default_location);
  const [includeCardio, setIncludeCardio] = useState(false);
  const [cardioType, setCardioType] = useState("");
  const [cardioCount, setCardioCount] = useState("");
  const [includeWarmup, setIncludeWarmup] = useState(false);
  const [warmupMinutes, setWarmupMinutes] = useState(8);
  const [warmupExerciseCount, setWarmupExerciseCount] = useState("");
  const [deviateLevel, setDeviateLevel] = useState("");
  const [sex, setSex] = useState(null);
  const [exerciseCount, setExerciseCount] = useState("");
  const [preferredCategories, setPreferredCategories] = useState([]);
  const [hyroxStyle, setHyroxStyle] = useState(false);
  const [pickExercisesMyself, setPickExercisesMyself] = useState(false);
  const [chosenExerciseIds, setChosenExerciseIds] = useState([]);

  const [wod, setWod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loaded = routerLocation.state?.loadedWod;
    if (!loaded) return;
    setWod(loaded);
    setLength(loaded.total_duration_minutes);
    const mainBlock = loaded.blocks.find((b) => b.block_type === "main");
    if (mainBlock?.training_type) setTrainingType(mainBlock.training_type);
    navigate(routerLocation.pathname, { replace: true, state: null });
    // Only run once on mount, when arriving from "Voorgedefinieerde workouts".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (wod) resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [wod]);

  const canSubmit = muscleGroups.length > 0 && !loading;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const result = await generateWod({
        user_id: profile.user_id,
        length_minutes: Number(length),
        muscle_groups: muscleGroups,
        training_type: trainingType,
        location,
        include_cardio: includeCardio,
        cardio_type: includeCardio && cardioType ? cardioType : undefined,
        cardio_count: (includeCardio || hyroxStyle) && cardioCount ? Number(cardioCount) : undefined,
        include_warmup: includeWarmup,
        warmup_minutes: includeWarmup ? Number(warmupMinutes) : undefined,
        warmup_exercise_count: includeWarmup && warmupExerciseCount ? Number(warmupExerciseCount) : undefined,
        deviate_level: !profile.use_profile_level_default && deviateLevel ? deviateLevel : undefined,
        sex: sex || undefined,
        exercise_count: exerciseCount ? Number(exerciseCount) : undefined,
        preferred_categories: preferredCategories,
        chosen_exercise_ids: pickExercisesMyself ? chosenExerciseIds : [],
        hyrox_style: hyroxStyle,
      });
      setWod(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSwapExercise = async (blockIndex, exerciseIndex, alternative) => {
    const detail = await getExercise(alternative.id);
    const isCarry = detail.name.toLowerCase().includes("carry");
    setWod((prev) => {
      const effectiveLevel = prev.level_used;
      let movementFields;
      if (detail.is_cardio) {
        const cardioMinutes = Math.min(5, Math.max(2, Math.round(Number(length) * 0.2)));
        if (detail.cardio_type === "assault_bike") {
          movementFields = {
            reps: null,
            distance_meters: null,
            calories: snapToTypical(cardioMinutes * CARDIO_PACE_CALORIES_PER_MIN, CARDIO_TYPICAL_CALORIES),
          };
        } else {
          const pace = CARDIO_PACE_METERS_PER_MIN[detail.cardio_type] ?? 125;
          const typical = CARDIO_TYPICAL_DISTANCES[detail.cardio_type] ?? CARDIO_TYPICAL_DISTANCES.row;
          movementFields = {
            reps: null,
            calories: null,
            distance_meters: snapToTypical(cardioMinutes * pace, typical),
          };
        }
      } else if (isCarry) {
        movementFields = {
          reps: null,
          calories: null,
          distance_meters: CARRY_DISTANCE_METERS[effectiveLevel] ?? DEFAULT_CARRY_DISTANCE_METERS,
        };
      } else {
        movementFields = {
          reps: repsFor(detail.category, effectiveLevel),
          calories: null,
          distance_meters: null,
        };
      }

      return {
        ...prev,
        blocks: prev.blocks.map((block, bi) => {
          if (bi !== blockIndex) return block;
          return {
            ...block,
            exercises: block.exercises.map((exercise, ei) => {
              if (ei !== exerciseIndex) return exercise;
              const oldSummary = {
                id: exercise.exercise_id,
                name: exercise.name,
                muscle_group: exercise.muscle_group,
                category: exercise.category,
              };
              return {
                ...exercise,
                exercise_id: detail.id,
                name: detail.name,
                muscle_group: detail.muscle_group,
                category: detail.category,
                cardio_type: detail.is_cardio ? detail.cardio_type : null,
                ...movementFields,
                own_weight_kg: null,
                suggested_weight_male_kg: detail.rx_weight_male_kg,
                suggested_weight_female_kg: detail.rx_weight_female_kg,
                alternatives: exercise.alternatives.filter((a) => a.id !== alternative.id).concat(oldSummary),
              };
            }),
          };
        }),
      };
    });
  };

  const handleExerciseFieldChange = (blockIndex, exerciseIndex, field, value) => {
    setWod((prev) => ({
      ...prev,
      blocks: prev.blocks.map((block, bi) => {
        if (bi !== blockIndex) return block;
        return {
          ...block,
          exercises: block.exercises.map((exercise, ei) =>
            ei !== exerciseIndex ? exercise : { ...exercise, [field]: value }
          ),
        };
      }),
    }));
  };

  const handleSaveResult = (result) =>
    createHistory({ user_id: profile.user_id, source: "generated", wod_json: wod, result });

  return (
    <div>
      <h1>WOD maken</h1>
      <form className="card" onSubmit={handleSubmit}>
        <h3>Basis</h3>

        <div className="field">
          <label htmlFor="length">Lengte (minuten)</label>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <input
              id="length"
              type="range"
              min={5}
              max={90}
              step={5}
              value={length}
              onChange={(event) => setLength(event.target.value)}
              style={{ flex: 1 }}
            />
            <input
              type="number"
              min={5}
              max={90}
              step={5}
              value={length}
              onChange={(event) => setLength(event.target.value)}
              aria-label="Lengte in minuten"
              style={{ width: 76, padding: 10, textAlign: "center", borderRadius: 8, border: "1px solid var(--color-border)" }}
            />
          </div>
        </div>

        <div className="field">
          <label>Spiergroepen</label>
          <MuscleGroupPicker selected={muscleGroups} onChange={setMuscleGroups} />
        </div>

        <div className="field">
          <label htmlFor="location">Locatie</label>
          <select id="location" value={location} onChange={(event) => setLocation(event.target.value)}>
            <option value="gym">Crossfit-gym</option>
            <option value="home">Thuis</option>
          </select>
        </div>

        <h3 style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--color-border)" }}>
          Workout-opbouw
        </h3>

        <Toggle
          checked={hyroxStyle}
          onChange={(checked) => {
            setHyroxStyle(checked);
            if (checked) setIncludeCardio(true);
          }}
          label="Hyrox-stijl"
        />
        {hyroxStyle && (
          <p className="field-hint" style={{ marginTop: -8, marginBottom: 16 }}>
            Combinatie van hardlopen/roeien/skien met functionele oefeningen zoals sleeën duwen,
            farmers carry en wall balls — net als een echte Hyrox-training.
          </p>
        )}

        <TrainingTypeSelect value={trainingType} onChange={setTrainingType} />

        <Toggle checked={includeCardio} onChange={setIncludeCardio} label="Combineren met cardio" />
        {includeCardio && (
          <>
            <div className="field">
              <label htmlFor="cardio-type">Type cardio</label>
              <select id="cardio-type" value={cardioType} onChange={(event) => setCardioType(event.target.value)}>
                <option value="">Maakt niet uit</option>
                {CARDIO_TYPES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="cardio-count">Aantal cardio-oefeningen (optioneel)</label>
              <input
                id="cardio-count"
                type="number"
                min={1}
                max={4}
                placeholder="Automatisch bepaald"
                value={cardioCount}
                onChange={(event) => setCardioCount(event.target.value)}
              />
            </div>
          </>
        )}

        <Toggle checked={includeWarmup} onChange={setIncludeWarmup} label="Warming-up toevoegen" />
        {includeWarmup && (
          <>
            <div className="field">
              <label htmlFor="warmup-minutes">Duur warming-up (minuten)</label>
              <input
                id="warmup-minutes"
                type="number"
                min={3}
                max={20}
                value={warmupMinutes}
                onChange={(event) => setWarmupMinutes(event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="warmup-exercise-count">Aantal warming-up-oefeningen (optioneel)</label>
              <input
                id="warmup-exercise-count"
                type="number"
                min={1}
                max={8}
                placeholder="Standaard 3"
                value={warmupExerciseCount}
                onChange={(event) => setWarmupExerciseCount(event.target.value)}
              />
            </div>
          </>
        )}

        <CollapsibleSection title="Meer opties" hint="Aantal oefeningen, categorie, niveau en RX-gewicht.">
          <div className="field">
            <label htmlFor="exercise-count">Aantal oefeningen (optioneel)</label>
            <input
              id="exercise-count"
              type="number"
              min={1}
              max={10}
              placeholder="Automatisch bepaald"
              value={exerciseCount}
              onChange={(event) => setExerciseCount(event.target.value)}
            />
          </div>

          <div className="field">
            <label>Voorkeur categorie (optioneel)</label>
            <p className="field-hint" style={{ marginTop: 0, marginBottom: 8 }}>
              De app kiest dan liever oefeningen uit deze categorieën.
            </p>
            <CategoryPicker selected={preferredCategories} onChange={setPreferredCategories} />
          </div>

          <Toggle
            checked={pickExercisesMyself}
            onChange={(checked) => {
              setPickExercisesMyself(checked);
              if (!checked) setChosenExerciseIds([]);
            }}
            label="Zelf oefeningen kiezen"
          />
          {pickExercisesMyself && (
            <div className="field">
              <ManualExercisePicker
                muscleGroups={muscleGroups}
                preferredCategories={preferredCategories}
                injuries={profile.injuries}
                selectedIds={chosenExerciseIds}
                onChange={setChosenExerciseIds}
              />
            </div>
          )}

          {!profile.use_profile_level_default && (
            <div className="field">
              <label htmlFor="deviate-level">Niveau voor deze WOD</label>
              <select
                id="deviate-level"
                value={deviateLevel}
                onChange={(event) => setDeviateLevel(event.target.value)}
              >
                <option value="">Gebruik profielniveau ({profile.level ?? "geen voorkeur"})</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Gemiddeld</option>
                <option value="advanced">Gevorderd</option>
              </select>
            </div>
          )}

          <div className="field" style={{ marginBottom: 0 }}>
            <label>RX-gewicht tonen voor</label>
            <select value={sex ?? ""} onChange={(event) => setSex(event.target.value || null)}>
              <option value="">Beide</option>
              <option value="male">Man</option>
              <option value="female">Vrouw</option>
            </select>
          </div>
        </CollapsibleSection>

        <button type="submit" className="btn btn-primary" disabled={!canSubmit} style={{ marginTop: 24 }}>
          {loading ? "Bezig met samenstellen..." : "Maak mijn WOD"}
        </button>
        {muscleGroups.length === 0 && (
          <p className="field-hint" style={{ marginTop: 8 }}>Kies minstens één spiergroep om te starten.</p>
        )}
        {error && <p className="error-text">{error}</p>}
      </form>

      {wod && (
        <div ref={resultRef}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
            <p className="badge" style={{ margin: 0 }}>
              Niveau: {wod.level_used ?? "geen voorkeur"} · Totaal: {wod.total_duration_minutes} min
            </p>
            <button
              type="button"
              className="btn-icon"
              onClick={() => {
                setWod(null);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              ↺ Opnieuw samenstellen
            </button>
          </div>
          {wod.blocks.map((block, blockIndex) => (
            <WodBlockCard
              key={blockIndex}
              block={block}
              sex={sex}
              onSwapExercise={(exerciseIndex, alternative) =>
                handleSwapExercise(blockIndex, exerciseIndex, alternative)
              }
              onExerciseFieldChange={(exerciseIndex, field, value) =>
                handleExerciseFieldChange(blockIndex, exerciseIndex, field, value)
              }
            />
          ))}
          <SaveResultForm onSave={handleSaveResult} />
        </div>
      )}
    </div>
  );
}
