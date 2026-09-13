const STYLES = {
  available: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
  ok: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
  assigned: 'bg-amber-500/15 text-amber-400 border-amber-500/40',
  retired: 'bg-gray-500/15 text-gray-400 border-gray-500/40',
  low: 'bg-red-500/15 text-red-400 border-red-500/40',
}

export default function StatusBadge({ status, label }) {
  const style = STYLES[status] || STYLES.retired
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize tracking-wide ${style}`}
    >
      {label || status}
    </span>
  )
}
