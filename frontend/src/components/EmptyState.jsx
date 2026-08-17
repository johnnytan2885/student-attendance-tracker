function EmptyState({ message, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      <p className="empty-state-message">{message}</p>
      {actionLabel && onAction && (
        <button className="btn-primary" onClick={onAction}>{actionLabel}</button>
      )}
    </div>
  );
}

export default EmptyState;