const LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Gemiddeld" },
  { value: "advanced", label: "Gevorderd" },
];

export default function LevelSelect({ value, onChange }) {
  return (
    <div className="field">
      <label htmlFor="profile-level">Niveau</label>
      <select id="profile-level" value={value ?? ""} onChange={(event) => onChange(event.target.value || null)}>
        <option value="">Geen voorkeur (niveau telt niet mee)</option>
        {LEVELS.map((level) => (
          <option key={level.value} value={level.value}>
            {level.label}
          </option>
        ))}
      </select>
      {value == null && (
        <p className="field-hint" style={{ marginTop: 4 }}>
          Zonder niveau kiest de app uit alle oefeningen, wat meer variatie in je WOD's geeft.
        </p>
      )}
    </div>
  );
}
