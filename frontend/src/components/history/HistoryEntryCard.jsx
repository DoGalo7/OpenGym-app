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

export default function HistoryEntryCard({ entry, onUpdateResult }) {
  const [expanded, setExpanded] = useState(false);
  const [result, setResult] = useState(entry.result ?? "");
  const [saving, setSaving] = useState(false);

  const title = entry.source === "fixed" ? entry.wod_json.name : "Zelf samengestelde WOD";

  const handleSaveResult = async () => {
    setSaving(true);
    try {
      await onUpdateResult(entry.id, result.trim());
    } finally {
      setSaving(false);
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
        <button type="button" className="btn-icon" onClick={() => setExpanded((v) => !v)}>
          {expanded ? "Verberg" : "Bekijk"}
        </button>
      </div>

      {entry.result && <p style={{ marginTop: 8 }}>Resultaat: <strong>{entry.result}</strong></p>}

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
          <button type="button" className="btn btn-secondary" onClick={handleSaveResult} disabled={saving}>
            Opslaan
          </button>
        </div>
      )}
    </div>
  );
}
