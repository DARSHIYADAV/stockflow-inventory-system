import ThemeToggle from './ThemeToggle'
import UserMenu from './UserMenu'

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-40 flex h-14 items-center border-b border-border bg-panel/95 px-4 backdrop-blur">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-sm">
            📦
          </div>
          <span className="text-lg font-semibold tracking-tight text-ink-primary">StockFlow</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </nav>
  )
}
