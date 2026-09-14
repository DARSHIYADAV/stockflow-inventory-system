export default function EmptyState({ icon = '—', message }) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon">{icon}</span>
      <p className="text-sm text-ink-muted">{message}</p>
    </div>
  )
}
