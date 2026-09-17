# Todo — CLAUDE.md best-practice additions + docs repair

- [x] Verify facts before documenting (ports, auth routes, seed script, demo creds)
- [x] CLAUDE.md: add `## Commands` section (myenv-only interpreter, real ports, test DB)
- [x] CLAUDE.md: add `## Invariants & Gotchas` section (admin-only products/stock, derived quantity, uniform login errors, asyncio_mode, deactivate-not-delete)
- [x] CLAUDE.md: link new `docs/conventions.md`
- [x] Create `docs/conventions.md` (backend + frontend patterns, route-duplication trap)
- [x] Fix `docs/roles.md` — matrix contradicts code (managers are NOT allowed products/stock)
- [x] Fix `docs/api.md` — add role-scoped logins + change-password, correct permission columns
- [x] Fix `docs/deployment.md` — remove nonexistent seed script, correct ports
- [x] Add demo sign-ins to `docs/demo-script.md` (dev-only note)
- [x] Verify: pytest still 98 passed; roles.md matches `grep Depends(require_`; CLAUDE.md stays short (110 lines)
