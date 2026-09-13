import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import RoleBadge from './RoleBadge'

const links = [
  { to: '/dashboard', label: 'Dashboard', allowedRoles: ['admin', 'manager'] },
  { to: '/products', label: 'Products', allowedRoles: ['admin'] },
  { to: '/assets', label: 'Assets', allowedRoles: ['admin', 'manager'] },
  { to: '/users', label: 'Users', allowedRoles: ['admin'] },
  { to: '/my-assets', label: 'My Assets', allowedRoles: ['employee', 'manager'] },
  { to: '/change-password', label: 'Change Password' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const visibleLinks = links.filter((link) => !link.allowedRoles || link.allowedRoles.includes(user?.role))

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-panel/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-8">
          <span className="text-lg font-semibold tracking-tight text-white">StockFlow</span>
          <div className="flex gap-1">
            {visibleLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'nav-link-active' : 'nav-link-inactive'}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <span className="flex items-center gap-2 text-sm text-gray-400">
              {user.name}
              <RoleBadge role={user.role} />
            </span>
          )}
          <button onClick={logout} className="btn-secondary px-3 py-1.5 text-sm">
            Log out
          </button>
        </div>
      </div>
    </nav>
  )
}
