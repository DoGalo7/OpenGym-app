export default function FixedWodStructure({ structure }) {
  const [schemeLabel, ...movements] = structure.split("\n");

  return (
    <div>
      <p className="badge" style={{ marginBottom: 10 }}>{schemeLabel}</p>
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        {movements.map((movement, index) => (
          <li key={index} style={{ marginBottom: 6 }}>{movement}</li>
        ))}
      </ul>
    </div>
  );
}
