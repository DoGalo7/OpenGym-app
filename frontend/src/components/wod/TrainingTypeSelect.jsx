const TRAINING_TYPES = [
  { value: "AMRAP", label: "AMRAP", hint: "Zoveel mogelijk ronden in de beschikbare tijd." },
  { value: "EMOM", label: "EMOM", hint: "Elke minuut een nieuwe oefening." },
  { value: "FOR_TIME", label: "For Time", hint: "Voltooi het schema zo snel mogelijk." },
  { value: "TABATA", label: "Tabata", hint: "20 seconden werk, 10 seconden rust, 8 ronden per oefening." },
];

export default function TrainingTypeSelect({ value, onChange }) {
  const current = TRAINING_TYPES.find((t) => t.value === value);

  return (
    <div className="field">
      <label htmlFor="training-type">Type training</label>
      <select id="training-type" value={value} onChange={(event) => onChange(event.target.value)}>
        {TRAINING_TYPES.map((type) => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </select>
      {current && <p className="field-hint">{current.hint}</p>}
    </div>
  );
}
