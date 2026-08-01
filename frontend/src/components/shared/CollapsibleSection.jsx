export default function CollapsibleSection({ title, hint, defaultOpen = false, children }) {
  return (
    <details className="collapsible" open={defaultOpen}>
      <summary>
        <span>
          {title}
          {hint && <div className="field-hint" style={{ marginTop: 2 }}>{hint}</div>}
        </span>
      </summary>
      <div className="collapsible-body">{children}</div>
    </details>
  );
}
