const MUSCLE_GROUPS = [
  { value: "schouders", label: "Schouders" },
  { value: "rug", label: "Rug" },
  { value: "borst", label: "Borst" },
  { value: "armen", label: "Armen" },
  { value: "benen", label: "Benen" },
  { value: "billen", label: "Billen" },
  { value: "buik", label: "Buik" },
  { value: "volledig_lichaam", label: "Volledig lichaam" },
];

export default function MuscleGroupPicker({ selected, onChange }) {
  const toggle = (value) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else if (value === "volledig_lichaam") {
      // Volledig lichaam sluit specifieke spiergroepen uit (en andersom) — combineren is verwarrend.
      onChange(["volledig_lichaam"]);
    } else {
      onChange([...selected.filter((v) => v !== "volledig_lichaam"), value]);
    }
  };

  return (
    <div className="chip-group">
      {MUSCLE_GROUPS.map((group) => (
        <button
          key={group.value}
          type="button"
          className={`chip${selected.includes(group.value) ? " active" : ""}`}
          onClick={() => toggle(group.value)}
        >
          {group.label}
        </button>
      ))}
    </div>
  );
}
