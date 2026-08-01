const CATEGORIES = [
  { value: "barbell", label: "Barbell" },
  { value: "dumbbell", label: "Dumbbell" },
  { value: "kettlebell", label: "Kettlebell" },
  { value: "rack", label: "Rack" },
  { value: "bodyweight", label: "Eigen gewicht" },
  { value: "gymnastics", label: "Gymnastiek" },
];

export default function CategoryPicker({ selected, onChange }) {
  const toggle = (value) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="chip-group">
      {CATEGORIES.map((category) => (
        <button
          key={category.value}
          type="button"
          className={`chip${selected.includes(category.value) ? " active" : ""}`}
          onClick={() => toggle(category.value)}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}
