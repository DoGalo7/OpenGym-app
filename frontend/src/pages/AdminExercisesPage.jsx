import { useEffect, useState } from "react";

import { createExercise, deleteExercise, listAllExercises, updateExercise } from "../api/adminExercises";

const MUSCLE_GROUPS = ["schouders", "rug", "borst", "armen", "benen", "billen", "buik", "volledig_lichaam", "cardio"];
const LEVELS = ["beginner", "intermediate", "advanced"];
const CATEGORIES = ["barbell", "dumbbell", "kettlebell", "rack", "bodyweight", "cardio", "gymnastics", "stretching"];
const CARDIO_TYPES = ["", "assault_bike", "ski_erg", "row", "run"];

function emptyForm() {
  return {
    name: "",
    muscle_group: "benen",
    level: "beginner",
    category: "bodyweight",
    requires_gym: false,
    equipment_tag: "",
    is_cardio: false,
    cardio_type: "",
    is_hyrox: false,
    rx_weight_male_kg: "",
    rx_weight_female_kg: "",
    description: "",
    base_movement: "",
    warmup_only: false,
  };
}

function toPayload(form) {
  return {
    name: form.name.trim(),
    muscle_group: form.muscle_group,
    level: form.level,
    category: form.category,
    requires_gym: form.requires_gym,
    equipment_tag: form.equipment_tag.trim() || null,
    is_cardio: form.is_cardio,
    cardio_type: form.is_cardio && form.cardio_type ? form.cardio_type : null,
    is_hyrox: form.is_hyrox,
    rx_weight_male_kg: form.rx_weight_male_kg === "" ? null : Number(form.rx_weight_male_kg),
    rx_weight_female_kg: form.rx_weight_female_kg === "" ? null : Number(form.rx_weight_female_kg),
    description: form.description.trim() || null,
    base_movement: form.base_movement.trim() || null,
    warmup_only: form.warmup_only,
  };
}

function ExerciseForm({ form, setForm }) {
  return (
    <>
      <div className="field">
        <label>Naam</label>
        <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div className="field">
        <label>Spiergroep</label>
        <select value={form.muscle_group} onChange={(e) => setForm({ ...form, muscle_group: e.target.value })}>
          {MUSCLE_GROUPS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Niveau</label>
        <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
          {LEVELS.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Categorie</label>
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
        <input type="checkbox" checked={form.requires_gym} onChange={(e) => setForm({ ...form, requires_gym: e.target.checked })} />
        Vereist gym-apparatuur
      </label>
      <div className="field">
        <label>Equipment-tag (thuis-apparatuur key, optioneel)</label>
        <input type="text" value={form.equipment_tag} onChange={(e) => setForm({ ...form, equipment_tag: e.target.value })} />
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
        <input type="checkbox" checked={form.is_cardio} onChange={(e) => setForm({ ...form, is_cardio: e.target.checked })} />
        Is cardio
      </label>
      {form.is_cardio && (
        <div className="field">
          <label>Cardio-type</label>
          <select value={form.cardio_type} onChange={(e) => setForm({ ...form, cardio_type: e.target.value })}>
            {CARDIO_TYPES.map((c) => (
              <option key={c} value={c}>{c || "(geen)"}</option>
            ))}
          </select>
        </div>
      )}
      <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
        <input type="checkbox" checked={form.is_hyrox} onChange={(e) => setForm({ ...form, is_hyrox: e.target.checked })} />
        Hyrox-oefening
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
        <input type="checkbox" checked={form.warmup_only} onChange={(e) => setForm({ ...form, warmup_only: e.target.checked })} />
        Alleen voor warming-up
      </label>
      <div className="field">
        <label>RX-gewicht man (kg, optioneel)</label>
        <input type="number" step={0.5} value={form.rx_weight_male_kg} onChange={(e) => setForm({ ...form, rx_weight_male_kg: e.target.value })} />
      </div>
      <div className="field">
        <label>RX-gewicht vrouw (kg, optioneel)</label>
        <input type="number" step={0.5} value={form.rx_weight_female_kg} onChange={(e) => setForm({ ...form, rx_weight_female_kg: e.target.value })} />
      </div>
      <div className="field">
        <label>Base movement (groepeert varianten, optioneel)</label>
        <input type="text" value={form.base_movement} onChange={(e) => setForm({ ...form, base_movement: e.target.value })} />
      </div>
      <div className="field">
        <label>Beschrijving (optioneel)</label>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} style={{ width: "100%" }} />
      </div>
    </>
  );
}

function ExerciseRowAdmin({ exercise, onSaved, onDeleted }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const startEdit = () => {
    setForm({
      name: exercise.name,
      muscle_group: exercise.muscle_group,
      level: exercise.level,
      category: exercise.category,
      requires_gym: exercise.requires_gym,
      equipment_tag: exercise.equipment_tag ?? "",
      is_cardio: exercise.is_cardio,
      cardio_type: exercise.cardio_type ?? "",
      is_hyrox: exercise.is_hyrox,
      rx_weight_male_kg: exercise.rx_weight_male_kg ?? "",
      rx_weight_female_kg: exercise.rx_weight_female_kg ?? "",
      description: exercise.description ?? "",
      base_movement: exercise.base_movement ?? "",
      warmup_only: exercise.warmup_only,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateExercise(exercise.id, toPayload(form));
      onSaved(updated);
      setOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`"${exercise.name}" verwijderen?`)) return;
    setSaving(true);
    setError(null);
    try {
      await deleteExercise(exercise.id);
      onDeleted(exercise.id);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div className="exercise-name">{exercise.name}</div>
          <div className="exercise-meta">
            {exercise.muscle_group} · {exercise.category} · {exercise.level}
            {exercise.warmup_only && " · warmup only"}
          </div>
        </div>
        <button type="button" className="btn-icon" onClick={() => (open ? setOpen(false) : startEdit())}>
          {open ? "Sluiten" : "Bewerken"}
        </button>
      </div>
      {open && form && (
        <div style={{ marginTop: 12 }}>
          <ExerciseForm form={form} setForm={setForm} />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Bezig..." : "Opslaan"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleDelete} disabled={saving}>
              Verwijder
            </button>
          </div>
          {error && <p className="error-text">{error}</p>}
        </div>
      )}
    </div>
  );
}

export default function AdminExercisesPage() {
  const [exercises, setExercises] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(emptyForm());
  const [adding, setAdding] = useState(false);

  const load = () => listAllExercises().then(setExercises).catch((err) => setError(err.message));

  useEffect(() => {
    load();
  }, []);

  const filtered = exercises.filter((e) => e.name.toLowerCase().includes(search.trim().toLowerCase()));

  const handleAdd = async () => {
    if (!addForm.name.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const created = await createExercise(toPayload(addForm));
      setExercises((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setAddForm(emptyForm());
      setShowAdd(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div>
      <h1>Admin: oefeningen</h1>
      <p className="field-hint">
        Niet gekoppeld aan het hoofdmenu - alleen voor beheer. Wijzigingen zijn direct zichtbaar
        voor alle sporters.
      </p>
      {error && <p className="error-text">{error}</p>}

      <div className="card">
        <button type="button" className="btn btn-secondary" onClick={() => setShowAdd((v) => !v)}>
          {showAdd ? "Annuleren" : "+ Nieuwe oefening"}
        </button>
        {showAdd && (
          <div style={{ marginTop: 12 }}>
            <ExerciseForm form={addForm} setForm={setAddForm} />
            <button type="button" className="btn btn-primary" onClick={handleAdd} disabled={adding || !addForm.name.trim()}>
              {adding ? "Bezig..." : "Toevoegen"}
            </button>
          </div>
        )}
      </div>

      <div className="field">
        <label htmlFor="admin-search">Zoek oefening</label>
        <input id="admin-search" type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Typ om te zoeken..." />
      </div>

      <p className="field-hint">{filtered.length} van {exercises.length} oefeningen</p>

      {filtered.map((exercise) => (
        <ExerciseRowAdmin
          key={exercise.id}
          exercise={exercise}
          onSaved={(updated) => setExercises((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))}
          onDeleted={(id) => setExercises((prev) => prev.filter((e) => e.id !== id))}
        />
      ))}
    </div>
  );
}
