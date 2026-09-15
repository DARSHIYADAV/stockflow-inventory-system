import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import UserCard from './UserCard'

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 11.5 12 4l9 7.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
    </svg>
  )
}

function ProductsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8 12 3 3 8l9 5 9-5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8v8l9 5 9-5V8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 13v8" />
    </svg>
  )
}

function AssetsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0">
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 20h8M12 16v4" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0">
      <circle cx="9" cy="8" r="3.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.75 19a6.25 6.25 0 0 1 12.5 0" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 8.25a3.25 3.25 0 1 1 3.25 3.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 13.25c2.64.4 4.75 2.36 5.25 5.75" />
    </svg>
  )
}

function MyAssetsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0">
      <rect x="4" y="3" width="16" height="12" rx="1.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20h6M12 15v5" />
      <circle cx="12" cy="9" r="2.25" />
    </svg>
  )
}

function ChangePasswordIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0">
      <rect x="5" y="10.5" width="14" height="9.5" rx="1.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
      <circle cx="12" cy="15" r="1.4" />
    </svg>
  )
}

const links = [
  { to: '/dashboard', label: 'Home', icon: HomeIcon, allowedRoles: ['admin', 'manager'] },
  { to: '/products', label: 'Products', icon: ProductsIcon, allowedRoles: ['admin'] },
  { to: '/assets', label: 'Assets', icon: AssetsIcon, allowedRoles: ['admin', 'manager'] },
  { to: '/users', label: 'Users', icon: UsersIcon, allowedRoles: ['admin'] },
  { to: '/my-assets', label: 'My Assets', icon: MyAssetsIcon, allowedRoles: ['employee', 'manager'] },
  { to: '/change-password', label: 'Change Password', icon: ChangePasswordIcon },
]

export default function Sidebar() {
  const { user } = useAuth()
  const visibleLinks = links.filter((link) => !link.allowedRoles || link.allowedRoles.includes(user?.role))

  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 flex-col border-r border-border bg-panel/60 sm:flex">
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {visibleLinks.map((link) => {
          const Icon = link.icon
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `sidebar-link flex items-center gap-2.5 ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}`
              }
            >
              <Icon />
              {link.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t border-border p-2">
        <UserCard />
      </div>
    </aside>
  )
}
