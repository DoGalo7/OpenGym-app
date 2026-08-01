import { useEffect, useRef, useState } from "react";

function playBeep(frequency = 880, durationMs = 200) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.frequency.value = frequency;
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    oscillator.start();
    oscillator.stop(ctx.currentTime + durationMs / 1000);
    oscillator.onended = () => ctx.close();
  } catch {
    // Web Audio not available - the timer still works visually without sound.
  }
}

const TABATA_REST_SECONDS = 10;

// Turns a WodBlock into a flat list of timed phases to step through. AMRAP is one long
// phase; EMOM gets one phase per minute cycling through the block's exercises; Tabata
// alternates werk/rust phases; Stretch/Cooldown uses each exercise's own duration_seconds.
function buildPhases(block) {
  const exercises = block.exercises ?? [];
  const type = block.training_type;

  if (type === "EMOM") {
    const rounds = block.duration_minutes;
    return Array.from({ length: rounds }, (_, i) => ({
      label: `Ronde ${i + 1}/${rounds}`,
      seconds: block.interval_seconds || 60,
      exerciseName: exercises.length ? exercises[i % exercises.length].name : null,
    }));
  }

  if (type === "TABATA") {
    const rounds = typeof block.rounds === "number" ? block.rounds : 8;
    const work = block.interval_seconds || 20;
    const phases = [];
    for (let i = 0; i < rounds; i++) {
      phases.push({
        label: `Werk - ronde ${i + 1}/${rounds}`,
        seconds: work,
        exerciseName: exercises.length ? exercises[i % exercises.length].name : null,
        kind: "work",
      });
      phases.push({ label: "Rust", seconds: TABATA_REST_SECONDS, exerciseName: null, kind: "rest" });
    }
    return phases;
  }

  if (type === "STRETCH") {
    return exercises.map((e) => ({ label: e.name, seconds: e.duration_seconds || 40, exerciseName: null }));
  }

  // AMRAP - one long countdown, no per-exercise phases (round composition is free-form).
  return [{ label: "AMRAP", seconds: block.duration_minutes * 60, exerciseName: null }];
}

function formatTime(totalSeconds) {
  const clamped = Math.max(0, totalSeconds);
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function WorkoutTimer({ block, onClose }) {
  const isCountUp = block.training_type === "FOR_TIME";
  const phasesRef = useRef(isCountUp ? [] : buildPhases(block));
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(isCountUp ? 0 : phasesRef.current[0]?.seconds ?? 0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!running || finished) return undefined;
    const id = setInterval(() => {
      if (isCountUp) {
        setSecondsLeft((s) => s + 1);
        return;
      }
      setSecondsLeft((s) => {
        if (s > 1) return s - 1;
        const nextIndex = phaseIndex + 1;
        if (nextIndex >= phasesRef.current.length) {
          playBeep(660, 400);
          setTimeout(() => playBeep(660, 400), 350);
          setFinished(true);
          setRunning(false);
          return 0;
        }
        playBeep(880, 200);
        setPhaseIndex(nextIndex);
        return phasesRef.current[nextIndex].seconds;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, finished, isCountUp, phaseIndex]);

  const handleStart = () => {
    playBeep(1046, 150);
    setRunning(true);
  };

  const handleStop = () => {
    setRunning(false);
    setFinished(true);
  };

  const currentPhase = phasesRef.current[phaseIndex];

  return (
    <div className="modal-backdrop">
      <div className="modal-card timer-card" role="dialog" aria-modal="true">
        <h3 style={{ marginBottom: 4 }}>{isCountUp ? "For Time" : currentPhase?.label}</h3>
        {!isCountUp && currentPhase?.exerciseName && (
          <p className="field-hint" style={{ marginTop: 0 }}>{currentPhase.exerciseName}</p>
        )}
        <div className="timer-display">{formatTime(secondsLeft)}</div>
        {finished && <p className="status-text">Klaar!</p>}
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Sluiten
          </button>
          {!running && !finished && (
            <button type="button" className="btn btn-primary" onClick={handleStart}>
              Start
            </button>
          )}
          {running && (
            <button type="button" className="btn btn-primary" onClick={handleStop}>
              Stop
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
