import ThemeToggle from './ThemeToggle'
import UserMenu from './UserMenu'

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-40 flex h-14 items-center border-b border-border bg-panel/95 px-4 backdrop-blur">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-hover text-sm shadow-[0_2px_8px_-2px_rgba(59,130,246,0.6)]">
            📦
          </div>
          <span className="text-lg font-semibold tracking-tight text-ink-primary">
            Stock<span className="text-accent">Flow</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </nav>
  )
}
