import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { getExercise } from "../api/exercises";
import { createHistory } from "../api/history";
import { shareWod } from "../api/sharedWods";
import { generateStretchWod, generateWarmup, generateWod } from "../api/wods";
import CategoryPicker from "../components/wod/CategoryPicker";
import { weightText } from "../components/wod/ExerciseRow";
import ManualExercisePicker from "../components/wod/ManualExercisePicker";
import ManualWodBuilder from "../components/wod/ManualWodBuilder";
import MuscleGroupPicker from "../components/wod/MuscleGroupPicker";
import SaveResultForm from "../components/wod/SaveResultForm";
import ShareWodForm from "../components/wod/ShareWodForm";
import TrainingTypeSelect from "../components/wod/TrainingTypeSelect";
import WodBlockCard from "../components/wod/WodBlockCard";
import WorkoutTimer from "../components/wod/WorkoutTimer";
import CollapsibleSection from "../components/shared/CollapsibleSection";
import ConfirmModal from "../components/shared/ConfirmModal";
import Toggle from "../components/shared/Toggle";
import { useProfile } from "../context/ProfileContext";
import { useInjuryDisclaimer } from "../hooks/useInjuryDisclaimer";

// Mirrors backend/app/wod_generator.py::STRETCH_HOLD_SECONDS - purely informational text here.
const STRETCH_HOLD_SECONDS = 40;

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
  const [stretchExerciseCount, setStretchExerciseCount] = useState("");
  const [preferredCategories, setPreferredCategories] = useState([]);
  const [hyroxStyle, setHyroxStyle] = useState(false);
  const [pickExercisesMyself, setPickExercisesMyself] = useState(false);
  const [chosenExerciseIds, setChosenExerciseIds] = useState([]);
  const [tempInjuryMuscleGroup, setTempInjuryMuscleGroup] = useState("");
  const [confirmedOverrideGroups, setConfirmedOverrideGroups] = useState([]);
  const [pendingInjuryConflicts, setPendingInjuryConflicts] = useState([]);
  const [showInjuryModal, setShowInjuryModal] = useState(false);
  const [pendingAction, setPendingAction] = useState("generate");

  // Two-tier mode picker: `purpose` is the primary choice (a real workout vs. Stretch & Core),
  // `mode` only matters within purpose="workout" (automatisch genereren vs. zelf samenstellen).
  // Was one flat 3-way toggle - once Stretch/Cooldown joined it, 3 equally-weighted buttons felt
  // cluttered and buried the auto/handmatig choice at the same visual level as an unrelated
  // "different kind of session entirely" choice.
  const [purpose, setPurpose] = useState("workout");
  const [mode, setMode] = useState("generate");
  const [wod, setWod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showTimer, setShowTimer] = useState(false);
  const [cardioWarningDismissed, setCardioWarningDismissed] = useState(false);
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

  useEffect(() => {
    setCardioWarningDismissed(false);
  }, [cardioType, location]);

  const canSubmit = muscleGroups.length > 0 && !loading;
  const cardioTypeMismatch =
    includeCardio && location === "home" && cardioType && !(profile.home_equipment ?? []).includes(cardioType);

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

  const runStretch = async (overrideGroups) => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateStretchWod({
        user_id: profile.user_id,
        muscle_groups: muscleGroups,
        location,
        length_minutes: Number(length),
        temporary_injury_muscle_group: tempInjuryMuscleGroup || undefined,
        override_injury_muscle_groups: overrideGroups,
        exercise_count: stretchExerciseCount ? Number(stretchExerciseCount) : undefined,
      });
      setWod(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkInjuryConflictsThen = (action) => {
    const conflicts = profile.injuries.filter(
      (injury) => injury.affected_muscle_group && muscleGroups.includes(injury.affected_muscle_group)
    );
    if (conflicts.length > 0) {
      setPendingInjuryConflicts(conflicts);
      setPendingAction(action);
      setShowInjuryModal(true);
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    if (!checkInjuryConflictsThen("generate")) return;
    setConfirmedOverrideGroups([]);
    await runGenerate([]);
  };

  const handleGenerateStretch = async () => {
    if (muscleGroups.length === 0 || loading) return;
    if (!checkInjuryConflictsThen("stretch")) return;
    setConfirmedOverrideGroups([]);
    await runStretch([]);
  };

  const handleConfirmInjuryConflict = async () => {
    const overrideGroups = pendingInjuryConflicts.map((injury) => injury.affected_muscle_group);
    setShowInjuryModal(false);
    setConfirmedOverrideGroups(overrideGroups);
    if (pendingAction === "stretch") await runStretch(overrideGroups);
    else await runGenerate(overrideGroups);
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

  const handleMoveExercise = (blockIndex, exerciseIndex, direction) => {
    setWod((prev) => ({
      ...prev,
      blocks: prev.blocks.map((block, bi) => {
        if (bi !== blockIndex) return block;
        const targetIndex = exerciseIndex + direction;
        if (targetIndex < 0 || targetIndex >= block.exercises.length) return block;
        const exercises = [...block.exercises];
        [exercises[exerciseIndex], exercises[targetIndex]] = [exercises[targetIndex], exercises[exerciseIndex]];
        return { ...block, exercises };
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
  const hasWarmup = wod?.blocks.some((b) => b.block_type === "warmup" || b.training_type === "STRETCH");

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

  const [addingWarmupExercise, setAddingWarmupExercise] = useState(false);

  const handleAddWarmupExercise = async (warmupBlockIndex) => {
    const mainBlock = wod.blocks.find((b) => b.block_type === "main");
    const warmupBlock = wod.blocks[warmupBlockIndex];
    const muscleGroupsForWarmup = [...new Set(warmupBlock.exercises.map((e) => e.muscle_group))];
    const excludeIds = wod.blocks.flatMap((b) => b.exercises.map((e) => e.exercise_id));
    setAddingWarmupExercise(true);
    setWarmupError(null);
    try {
      const extra = await generateWarmup({
        user_id: profile.user_id,
        muscle_groups: muscleGroupsForWarmup.length ? muscleGroupsForWarmup : [...new Set(mainBlock.exercises.map((e) => e.muscle_group))],
        location,
        warmup_minutes: Number(warmupBlock.duration_minutes) || 8,
        warmup_exercise_count: 1,
        exclude_exercise_ids: excludeIds,
        temporary_injury_muscle_group: tempInjuryMuscleGroup || undefined,
        override_injury_muscle_groups: confirmedOverrideGroups,
      });
      if (extra.exercises.length === 0) {
        setWarmupError("Geen extra warming-up oefening meer beschikbaar voor deze spiergroepen.");
        return;
      }
      setWod((prev) => {
        const blocks = prev.blocks.map((b, i) =>
          i === warmupBlockIndex ? { ...b, exercises: [...b.exercises, ...extra.exercises] } : b
        );
        return { ...prev, blocks };
      });
    } catch (err) {
      setWarmupError(err.message);
    } finally {
      setAddingWarmupExercise(false);
    }
  };

  const handleRemoveExercise = (blockIndex, exerciseIndex) => {
    setWod((prev) => {
      const blocks = prev.blocks.map((b, i) =>
        i === blockIndex ? { ...b, exercises: b.exercises.filter((_, idx) => idx !== exerciseIndex) } : b
      );
      return { ...prev, blocks };
    });
  };

  const handleAddExerciseToBlock = (blockIndex, exercise) => {
    const block = wod.blocks[blockIndex];
    const saved = (profile.exercise_weights ?? []).find((w) => w.exercise_id === exercise.id);
    let fields;
    if (block.block_type === "warmup") {
      fields = { reps: 10, duration_seconds: null, distance_meters: null, calories: null };
    } else if (block.training_type === "STRETCH") {
      fields = { reps: null, duration_seconds: STRETCH_HOLD_SECONDS, distance_meters: null, calories: null };
    } else if (exercise.is_cardio) {
      fields =
        exercise.cardio_type === "assault_bike"
          ? { reps: null, duration_seconds: null, distance_meters: null, calories: 15 }
          : { reps: null, duration_seconds: null, distance_meters: 500, calories: null };
    } else {
      fields = { reps: 10, duration_seconds: null, distance_meters: null, calories: null };
    }
    const newExercise = {
      exercise_id: exercise.id,
      name: exercise.name,
      muscle_group: exercise.muscle_group,
      category: exercise.category,
      ...fields,
      cardio_type: exercise.is_cardio ? exercise.cardio_type : null,
      own_weight_kg: saved?.weight_kg ?? null,
      suggested_weight_male_kg: exercise.rx_weight_male_kg,
      suggested_weight_female_kg: exercise.rx_weight_female_kg,
      alternatives: [],
    };
    setWod((prev) => {
      const blocks = prev.blocks.map((b, i) => (i === blockIndex ? { ...b, exercises: [...b.exercises, newExercise] } : b));
      return { ...prev, blocks };
    });
  };

  // Mirrors ManualWodBuilder's homeAllowed + browse-list filtering, so exercises offered here
  // stay consistent with what the location/equipment/block type would otherwise allow.
  const buildAddExerciseFilter = (block) => (e) => {
    const homeEquipment = new Set(profile.home_equipment ?? []);
    const homeAllowed =
      location !== "home" ||
      !e.requires_gym ||
      (e.equipment_tag && homeEquipment.has(e.equipment_tag)) ||
      (e.is_cardio && e.cardio_type && homeEquipment.has(e.cardio_type));
    if (!homeAllowed) return false;
    if (block.block_type === "warmup") return e.category === "bodyweight" || e.category === "gymnastics";
    if (block.training_type === "STRETCH") return e.category === "stretching";
    if (block.block_type === "cardio") return Boolean(e.is_cardio);
    return !e.warmup_only && e.category !== "stretching";
  };

  const handleSaveResult = (result) =>
    createHistory({ user_id: profile.user_id, source: "generated", wod_json: wod, result });

  const handleShareWod = (name, recipientUserId) => shareWod(profile.user_id, name, wod, recipientUserId);

  const BLOCK_LABELS = { warmup: "Warming-up", main: "Workout", cardio: "Cardio" };

  const handleShareWhatsApp = () => {
    const lines = [`💪 Mijn workout (${wod.total_duration_minutes} min):`];
    wod.blocks.forEach((block) => {
      lines.push(`\n${BLOCK_LABELS[block.block_type] ?? block.block_type} (${block.duration_minutes} min):`);
      block.exercises.forEach((e) => {
        const qty = e.reps
          ? `${e.reps}x `
          : e.duration_seconds
          ? `${e.duration_seconds}s `
          : e.distance_meters
          ? `${e.distance_meters}m `
          : e.calories
          ? `${e.calories}cal `
          : "";
        const weight = weightText(e, sex);
        lines.push(`- ${qty}${e.name}${weight ? ` - ${weight}` : ""}`);
      });
    });
    lines.push("\nGemaakt met Open Gym-app 🏋️ https://open-gym-app.vercel.app");
    window.open(`https://wa.me/?text=${encodeURIComponent(lines.join("\n"))}`, "_blank");
  };

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

        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="location">Locatie</label>
          <select id="location" value={location} onChange={(event) => setLocation(event.target.value)}>
            <option value="gym">Crossfit-gym</option>
            <option value="home">Thuis</option>
          </select>
        </div>
      </div>

      <div className="mode-toggle">
        <button type="button" className={purpose === "workout" ? "active" : ""} onClick={() => setPurpose("workout")}>
          🏋 Workout
        </button>
        <button type="button" className={purpose === "stretch" ? "active" : ""} onClick={() => setPurpose("stretch")}>
          🧘 Stretch &amp; Core
        </button>
      </div>

      {purpose === "stretch" ? (
        <div className="card">
          <h3>Stretch &amp; Core-WOD</h3>
          <p className="field-hint" style={{ marginTop: 0 }}>
            Een reeks rustige stretches en core-stabiliteitsoefeningen ({STRETCH_HOLD_SECONDS} sec
            per oefening) voor de gekozen spiergroepen. Geen kracht- of conditietraining, alleen
            mobiliteit, stabiliteit en ontspanning.
          </p>
          <div className="field">
            <label>Spiergroepen</label>
            <MuscleGroupPicker selected={muscleGroups} onChange={setMuscleGroups} />
          </div>
          <div className="field">
            <label htmlFor="stretch-exercise-count">Aantal oefeningen (optioneel)</label>
            <input
              id="stretch-exercise-count"
              type="number"
              min={1}
              max={10}
              placeholder="Standaard 4"
              value={stretchExerciseCount}
              onChange={(event) => setStretchExerciseCount(event.target.value)}
            />
          </div>
          <button type="button" className="btn btn-primary" onClick={handleGenerateStretch} disabled={muscleGroups.length === 0 || loading}>
            {loading ? "Bezig met samenstellen..." : "Maak Stretch & Core-WOD"}
          </button>
          {muscleGroups.length === 0 && (
            <p className="field-hint" style={{ marginTop: 8 }}>Kies minstens één spiergroep om te starten.</p>
          )}
          {error && <p className="error-text">{error}</p>}
        </div>
      ) : (
      <>
      <div className="mode-toggle mode-toggle--sub">
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

        <div className="field">
          <label>Spiergroepen</label>
          <MuscleGroupPicker selected={muscleGroups} onChange={setMuscleGroups} />
        </div>

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
            {cardioTypeMismatch && !cardioWarningDismissed && (
              <ConfirmModal
                title="Niet beschikbaar thuis"
                message={`Je hebt in je profiel niet aangevinkt dat je thuis toegang hebt tot ${
                  CARDIO_TYPES.find((c) => c.value === cardioType)?.label ?? cardioType
                }. De app kiest daarom automatisch een ander type cardio voor deze workout.`}
                confirmLabel="OK, begrepen"
                hideCancel
                onConfirm={() => setCardioWarningDismissed(true)}
              />
            )}
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
      </>
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
          <div className="card" style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <h3 style={{ margin: 0 }}>In het kort</h3>
              <button type="button" className="btn-icon" onClick={handleShareWhatsApp}>
                📤 WhatsApp
              </button>
            </div>
            {wod.blocks.map((block, i) => (
              <p key={i} className="field-hint" style={{ margin: "8px 0 0" }}>
                <strong>{BLOCK_LABELS[block.block_type] ?? block.block_type}</strong> ({block.duration_minutes} min):{" "}
                {block.exercises.map((e) => e.name).join(", ")}
              </p>
            ))}
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
              onMoveExercise={(exerciseIndex, direction) =>
                handleMoveExercise(blockIndex, exerciseIndex, direction)
              }
              onRemoveExercise={(exerciseIndex) => handleRemoveExercise(blockIndex, exerciseIndex)}
              onAddExercise={(exercise) => handleAddExerciseToBlock(blockIndex, exercise)}
              addExerciseFilter={buildAddExerciseFilter(block)}
              onDurationChange={(minutes) => handleBlockDurationChange(blockIndex, minutes)}
            />
          ))}
          {wod.blocks.map((block, blockIndex) =>
            block.block_type === "warmup" ? (
              <button
                key={`add-warmup-exercise-${blockIndex}`}
                type="button"
                className="btn btn-secondary"
                style={{ width: "100%", marginTop: -8, marginBottom: 12 }}
                onClick={() => handleAddWarmupExercise(blockIndex)}
                disabled={addingWarmupExercise}
              >
                {addingWarmupExercise ? "Bezig..." : "+ Oefening toevoegen aan warming-up"}
              </button>
            ) : null
          )}
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: "100%", marginBottom: 12 }}
            onClick={() => setShowTimer(true)}
          >
            ⏱ Start workout
          </button>
          {showTimer && (
            <WorkoutTimer
              block={wod.blocks.find((b) => b.block_type === "main")}
              onClose={() => setShowTimer(false)}
            />
          )}
          <SaveResultForm onSave={handleSaveResult} />
          <ShareWodForm onShare={handleShareWod} userId={profile.user_id} />
        </div>
      )}
    </div>
  );
}
