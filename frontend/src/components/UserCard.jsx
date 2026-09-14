import { useAuth } from '../context/AuthContext'
import RoleBadge from './RoleBadge'

export default function UserCard({ className = '' }) {
  const { user, logout } = useAuth()

  if (!user) return null

  return (
    <div className={`card p-1 ${className}`}>
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-ink-primary">{user.name}</p>
          <RoleBadge role={user.role} />
        </div>
        <p className="mt-0.5 truncate text-xs text-ink-muted">{user.email}</p>
      </div>
      <div className="my-1 border-t border-border" />
      <button
        onClick={logout}
        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-red-500 transition-colors duration-150 hover:bg-red-500/10"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 17l5-5-5-5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H3" />
        </svg>
        Log out
      </button>
    </div>
  )
}
