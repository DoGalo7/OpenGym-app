export default function ConfirmModal({
  title, message, confirmLabel = "Doorgaan", cancelLabel = "Annuleren", onConfirm, onCancel, hideCancel = false,
}) {
  return (
    <div className="modal-backdrop" onClick={onCancel ?? onConfirm}>
      <div className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        {title && <h3>{title}</h3>}
        <p>{message}</p>
        <div className="modal-actions">
          {!hideCancel && (
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              {cancelLabel}
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
