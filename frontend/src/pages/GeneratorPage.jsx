import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { getExercise } from "../api/exercises";
import { createHistory } from "../api/history";
import { shareWod } from "../api/sharedWods";
import { generateWarmup, generateWod } from "../api/wods";
import CategoryPicker from "../components/wod/CategoryPicker";
import ManualExercisePicker from "../components/wod/ManualExercisePicker";
import ManualWodBuilder from "../components/wod/ManualWodBuilder";
import MuscleGroupPicker from "../components/wod/MuscleGroupPicker";
import SaveResultForm from "../components/wod/SaveResultForm";
import ShareWodForm from "../components/wod/ShareWodForm";
import TrainingTypeSelect from "../components/wod/TrainingTypeSelect";
import WodBlockCard from "../components/wod/WodBlockCard";
import CollapsibleSection from "../components/shared/CollapsibleSection";
import ConfirmModal from "../components/shared/ConfirmModal";
import Toggle from "../components/shared/Toggle";
import { useProfile } from "../context/ProfileContext";
import { useInjuryDisclaimer } from "../hooks/useInjuryDisclaimer";

const CARDIO_TYPES = [
  { value: "assault_bike", label: "Airbike" },
  { value: "ski_erg", label: "Ski erg" },
  { value: "row", label: "Roeien" },
  { value: "run", label: "Hardlopen" },
];

const TEMP_INJURY_GROUPS = [
  { value: "", label: "Geen" },
  { value: "schouders", label: "Schouders" },
  { value: "rug", label: "Rug" },
  { value: "borst", label: "Borst" },
  { value: "armen", label: "Armen" },
  { value: "benen", label: "Benen" },
  { value: "billen", label: "Billen" },
  { value: "buik", label: "Buik" },
  { value: "volledig_lichaam", label: "Volledig lichaam" },
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
  const [tempInjuryMuscleGroup, setTempInjuryMuscleGroup] = useState("");
  const [confirmedOverrideGroups, setConfirmedOverrideGroups] = useState([]);
  const [pendingInjuryConflicts, setPendingInjuryConflicts] = useState([]);
  const [showInjuryModal, setShowInjuryModal] = useState(false);

  const [mode, setMode] = useState("generate");
  const [wod, setWod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const injuryDisclaimer = useInjuryDisclaimer(profile);

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

  const runGenerate = async (overrideGroups) => {
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
        temporary_injury_muscle_group: tempInjuryMuscleGroup || undefined,
        override_injury_muscle_groups: overrideGroups,
      });
      setWod(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    const conflicts = profile.injuries.filter(
      (injury) => injury.affected_muscle_group && muscleGroups.includes(injury.affected_muscle_group)
    );
    if (conflicts.length > 0) {
      setPendingInjuryConflicts(conflicts);
      setShowInjuryModal(true);
      return;
    }
    setConfirmedOverrideGroups([]);
    await runGenerate([]);
  };

  const handleConfirmInjuryConflict = async () => {
    const overrideGroups = pendingInjuryConflicts.map((injury) => injury.affected_muscle_group);
    setShowInjuryModal(false);
    setConfirmedOverrideGroups(overrideGroups);
    await runGenerate(overrideGroups);
  };

  const handleCancelInjuryConflict = () => {
    setShowInjuryModal(false);
    setPendingInjuryConflicts([]);
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

  const handleBlockDurationChange = (blockIndex, minutes) => {
    setWod((prev) => {
      const blocks = prev.blocks.map((block, bi) =>
        bi !== blockIndex ? block : { ...block, duration_minutes: minutes }
      );
      const total = blocks.reduce((sum, b) => sum + (Number(b.duration_minutes) || 0), 0);
      return { ...prev, blocks, total_duration_minutes: total };
    });
  };

  const [addingWarmup, setAddingWarmup] = useState(false);
  const [warmupError, setWarmupError] = useState(null);
  const hasWarmup = wod?.blocks.some((b) => b.block_type === "warmup");

  const handleAddWarmup = async () => {
    const mainBlock = wod.blocks.find((b) => b.block_type === "main");
    if (!mainBlock) return;
    const muscleGroupsForWarmup = [...new Set(mainBlock.exercises.map((e) => e.muscle_group))];
    const excludeIds = mainBlock.exercises.map((e) => e.exercise_id);
    setAddingWarmup(true);
    setWarmupError(null);
    try {
      const warmupBlock = await generateWarmup({
        user_id: profile.user_id,
        muscle_groups: muscleGroupsForWarmup,
        location,
        warmup_minutes: Number(warmupMinutes) || 8,
        warmup_exercise_count: warmupExerciseCount ? Number(warmupExerciseCount) : undefined,
        exclude_exercise_ids: excludeIds,
        temporary_injury_muscle_group: tempInjuryMuscleGroup || undefined,
        override_injury_muscle_groups: confirmedOverrideGroups,
      });
      setWod((prev) => {
        const blocks = [warmupBlock, ...prev.blocks];
        const total = blocks.reduce((sum, b) => sum + (Number(b.duration_minutes) || 0), 0);
        return { ...prev, blocks, total_duration_minutes: total };
      });
    } catch (err) {
      setWarmupError(err.message);
    } finally {
      setAddingWarmup(false);
    }
  };

  const handleSaveResult = (result) =>
    createHistory({ user_id: profile.user_id, source: "generated", wod_json: wod, result });

  const handleShareWod = (name) => shareWod(profile.user_id, name, wod);

  return (
    <div>
      <h1>WOD maken</h1>

      {injuryDisclaimer.show && (
        <ConfirmModal
          title="Blessure of beperking actief"
          message="Je hebt in je profiel een blessure of beperking aangegeven. De app past de workout hier zo goed mogelijk op aan, maar dit is geen medisch advies. Raadpleeg altijd een arts, fysiotherapeut of andere specialist om te bepalen of deze oefeningen voor jou geschikt zijn. De app doet een voorstel, maar kan niet verantwoordelijk worden gehouden voor blessures."
          confirmLabel="Ik begrijp het, ga verder"
          cancelLabel="Terug naar home"
          onConfirm={injuryDisclaimer.dismiss}
          onCancel={() => navigate("/")}
        />
      )}

      <div className="card">
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

        {mode === "generate" && (
          <div className="field">
            <label>Spiergroepen</label>
            <MuscleGroupPicker selected={muscleGroups} onChange={setMuscleGroups} />
          </div>
        )}

        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="location">Locatie</label>
          <select id="location" value={location} onChange={(event) => setLocation(event.target.value)}>
            <option value="gym">Crossfit-gym</option>
            <option value="home">Thuis</option>
          </select>
        </div>
      </div>

      <div className="mode-toggle">
        <button type="button" className={mode === "generate" ? "active" : ""} onClick={() => setMode("generate")}>
          Genereer automatisch
        </button>
        <button type="button" className={mode === "manual" ? "active" : ""} onClick={() => setMode("manual")}>
          Stel zelf samen
        </button>
      </div>

      {mode === "manual" ? (
        <ManualWodBuilder
          profile={profile}
          location={location}
          trainingType={trainingType}
          setTrainingType={setTrainingType}
          onBuild={(built) => setWod(built)}
        />
      ) : (
      <form className="card" onSubmit={handleSubmit}>
        <h3>Workout-opbouw</h3>

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

        <div className="field">
          <label htmlFor="temp-injury">Tijdelijke blessure (alleen voor deze workout)</label>
          <select
            id="temp-injury"
            value={tempInjuryMuscleGroup}
            onChange={(event) => setTempInjuryMuscleGroup(event.target.value)}
          >
            {TEMP_INJURY_GROUPS.map((group) => (
              <option key={group.value} value={group.value}>
                {group.label}
              </option>
            ))}
          </select>
          <p className="field-hint" style={{ marginBottom: 0 }}>
            Wordt niet opgeslagen in je profiel, geldt alleen voor deze ene workout.
          </p>
        </div>

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
      )}

      {showInjuryModal && (
        <ConfirmModal
          title="Blessure-check"
          message={`Je hebt in je profiel aangegeven dat je ${pendingInjuryConflicts
            .map((injury) => injury.affected_muscle_group)
            .join(", ")} moet ontzien (${pendingInjuryConflicts.map((injury) => injury.description).join("; ")}). Weet je zeker dat je toch een workout hiervoor wilt maken?`}
          confirmLabel="Ja, toch doorgaan"
          cancelLabel="Annuleren"
          onConfirm={handleConfirmInjuryConflict}
          onCancel={handleCancelInjuryConflict}
        />
      )}

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
          {!hasWarmup && (
            <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <p className="field-hint" style={{ margin: 0 }}>Nog geen warming-up bij deze workout.</p>
              <button type="button" className="btn btn-secondary" onClick={handleAddWarmup} disabled={addingWarmup}>
                {addingWarmup ? "Bezig..." : "+ Warming-up toevoegen"}
              </button>
            </div>
          )}
          {warmupError && <p className="error-text">{warmupError}</p>}
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
              onDurationChange={(minutes) => handleBlockDurationChange(blockIndex, minutes)}
            />
          ))}
          <SaveResultForm onSave={handleSaveResult} />
          <ShareWodForm onShare={handleShareWod} />
        </div>
      )}
    </div>
  );
}
