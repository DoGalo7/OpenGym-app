export default function SwapMenu({ alternatives, onPick, onClose }) {
  if (alternatives.length === 0) {
    return (
      <div className="swap-menu">
        <p style={{ padding: "12px 16px", margin: 0 }}>Geen alternatieven beschikbaar.</p>
      </div>
    );
  }

  return (
    <div className="swap-menu">
      {alternatives.map((alt) => (
        <button
          key={alt.id}
          type="button"
          onClick={() => {
            onPick(alt);
            onClose();
          }}
        >
          {alt.name}
        </button>
      ))}
    </div>
  );
}
