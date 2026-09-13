const ROLE_STYLES = {
  admin: 'bg-accent/15 text-accent',
  manager: 'bg-amber-500/15 text-amber-400',
  employee: 'bg-emerald-500/15 text-emerald-400',
}

export default function RoleBadge({ role }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
        ROLE_STYLES[role] || 'bg-gray-500/15 text-gray-400'
      }`}
    >
      {role}
    </span>
  )
}
