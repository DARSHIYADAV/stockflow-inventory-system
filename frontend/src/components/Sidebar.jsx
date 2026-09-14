import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import UserCard from './UserCard'

const links = [
  { to: '/dashboard', label: 'Home', allowedRoles: ['admin', 'manager'] },
  { to: '/products', label: 'Products', allowedRoles: ['admin'] },
  { to: '/assets', label: 'Assets', allowedRoles: ['admin', 'manager'] },
  { to: '/users', label: 'Users', allowedRoles: ['admin'] },
  { to: '/my-assets', label: 'My Assets', allowedRoles: ['employee', 'manager'] },
  { to: '/change-password', label: 'Change Password' },
]

export default function Sidebar() {
  const { user } = useAuth()
  const visibleLinks = links.filter((link) => !link.allowedRoles || link.allowedRoles.includes(user?.role))

  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 flex-col border-r border-border bg-panel/60 sm:flex">
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {visibleLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-2">
        <UserCard />
      </div>
    </aside>
  )
}
