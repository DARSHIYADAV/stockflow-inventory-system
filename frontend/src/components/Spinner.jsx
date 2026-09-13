export default function Spinner({ label = 'Loading...' }) {
  return (
    <div className="flex items-center gap-3 py-8 text-sm text-gray-400">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}
