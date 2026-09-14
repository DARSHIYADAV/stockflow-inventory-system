import { useAuth } from '../context/AuthContext'

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export default function UserMenu() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <div
      className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent"
      aria-label="User avatar"
    >
      {getInitials(user.name)}
    </div>
  )
}
