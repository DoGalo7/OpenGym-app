import { useState } from "react";

import FixedWodStructure from "../wod/FixedWodStructure";
import WodBlockCard from "../wod/WodBlockCard";

function formatDate(isoString) {
  return new Date(isoString).toLocaleString("nl-NL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryEntryCard({ entry, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [result, setResult] = useState(entry.result ?? "");
  const [note, setNote] = useState(entry.note ?? "");
  const [saving, setSaving] = useState(false);

  const title = entry.source === "fixed" ? entry.wod_json.name : "Zelf samengestelde WOD";

  const handleSaveDetails = async () => {
    setSaving(true);
    try {
      await onUpdate(entry.id, { result: result.trim() || null, note: note.trim() || null });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFavorite = () => onUpdate(entry.id, { favorite: !entry.favorite });

  const handleDelete = () => {
    if (window.confirm("Deze workout uit je geschiedenis verwijderen? Dit kan niet ongedaan gemaakt worden.")) {
      onDelete(entry.id);
    }
  };

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div>
          <h3 style={{ marginBottom: 4 }}>{title}</h3>
          <p className="field-hint" style={{ margin: 0 }}>
            {formatDate(entry.created_at)} · <span className="badge">{entry.source === "fixed" ? "Vaste WOD" : "Gegenereerd"}</span>
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button
            type="button"
            className="btn-icon"
            onClick={handleToggleFavorite}
            aria-label={entry.favorite ? "Verwijder uit favorieten" : "Voeg toe aan favorieten"}
            aria-pressed={entry.favorite}
          >
            {entry.favorite ? "♥" : "♡"}
          </button>
          <button type="button" className="btn-icon" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Verberg" : "Bekijk"}
          </button>
        </div>
      </div>

      {entry.result && <p style={{ marginTop: 8 }}>Resultaat: <strong>{entry.result}</strong></p>}
      {entry.note && <p className="field-hint" style={{ marginTop: 4 }}>Notitie: {entry.note}</p>}

      {expanded && (
        <div style={{ marginTop: 12 }}>
          {entry.source === "fixed" ? (
            <FixedWodStructure structure={entry.wod_json.structure} />
          ) : (
            entry.wod_json.blocks.map((block, index) => (
              <WodBlockCard key={index} block={block} sex={null} readOnly />
            ))
          )}

          <div className="field" style={{ marginTop: 12 }}>
            <label htmlFor={`result-${entry.id}`}>Resultaat bijwerken</label>
            <input
              id={`result-${entry.id}`}
              type="text"
              placeholder="bijv. 12:34 of 5 ronden + 3 reps"
              value={result}
              onChange={(event) => setResult(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor={`note-${entry.id}`}>Notitie (optioneel)</label>
            <input
              id={`note-${entry.id}`}
              type="text"
              placeholder="bijv. voelde zwaar, RX gehaald"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={handleSaveDetails} disabled={saving}>
              {saving ? "Bezig..." : "Opslaan"}
            </button>
            <button type="button" className="btn-icon" onClick={handleDelete}>
              Verwijder
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
