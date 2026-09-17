# StockFlow — Project Guide

## 1. Project Overview

StockFlow is a company inventory and asset management system. It tracks
general stock (products like laptops, monitors, keyboards, mice) and
individual trackable assets (a specific laptop with a serial number,
assigned to a specific employee). Admins and managers manage products,
record stock in/out, and assign or return assets; employees log in and
see only the equipment currently assigned to them. Every stock change
and asset assignment is recorded in an audit history, so nothing is
ever silently overwritten. **Core idea:** stock quantity is never
stored as a single mutable number — it is *derived* by summing a
ledger of transactions.

## 2. Tech Stack

- Backend: Python 3.11+, FastAPI, SQLAlchemy 2.0 (async), Alembic, Pydantic, python-jose/PyJWT, passlib (bcrypt), Pytest, Uvicorn
- Frontend: React 18 (plain JavaScript, no TypeScript), Vite, React Router, React Query, Axios, Tailwind CSS
- Database: PostgreSQL
- Auth: JWT (access token), RBAC (Admin/Manager vs Employee)
- DevOps: Docker + Docker Compose, Railway/Render (backend+DB), Vercel/Netlify (frontend), GitHub Actions (optional CI)
- Deliberately not used: WebSockets/real-time, Celery/Redis, AI/ML, chart libraries, S3/file storage, TypeScript

## 3. Commands

Run from `backend/` — `myenv` is the **only** interpreter with pytest/uvicorn/alembic
installed (global Python has none of them; bare `pytest`/`uvicorn`/`alembic` will fail):
- Tests:   `./myenv/Scripts/python.exe -m pytest -q` (requires a separate `stockflow_test` Postgres DB)
- Server:  `./myenv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8003`
- Migrate: `./myenv/Scripts/alembic.exe upgrade head`

Frontend (from `frontend/`): `npm run dev` → :5173 | `npm run build` (no lint/test tooling configured)

Ports: backend **8003**, frontend **5173**, Postgres **5434**.
Note: `docker-compose.yml` (8000/5433) is NOT the working dev path — the local venv setup above is what's actually used.

## 4. Invariants & Gotchas

- Products CRUD and all `/stock` endpoints are **admin-only** (`require_admin`) — managers
  cannot manage products or record stock, despite `docs/roles.md`.
- Derived quantity: `get_product_quantity()` in `backend/app/routers/products.py` —
  `SUM(stock_transactions.change_quantity)`. `Product` has no quantity column; `dashboard.py`
  re-implements the same sum inline.
- RBAC: `require_admin` / `require_admin_or_manager` (`backend/app/core/dependencies.py`),
  applied per-route, not router-level.
- Login errors are **deliberately uniform** (`401 "Incorrect email or password"`) for wrong
  password, wrong role endpoint, or a deactivated account — this is an enumeration defense,
  don't "fix" it.
- Login is role-scoped: `POST /auth/login/{admin|manager|employee}`, plus a generic `POST /auth/login`.
- Single admin is enforced at the DB level (partial unique index); first-ever registration
  bootstraps the admin with no auth required.
- Users are **deactivated, never deleted**. `@staunchsys.com` is enforced on managed-user schemas.
- `pytest.ini` sets `asyncio_mode = auto` — write plain `async def test_*`, no `@pytest.mark.asyncio`.

## 5. Folder Structure

```
stockflow/
├── backend/
├── frontend/
├── docs/
├── tasks/
├── docker-compose.yml
└── README.md
```

## 6. Reference Docs

- Full DB schema: see [docs/schema.md](docs/schema.md)
- Full API endpoint list: see [docs/api.md](docs/api.md)
- Roles & permissions matrix: see [docs/roles.md](docs/roles.md)
- Backend/frontend coding conventions: see [docs/conventions.md](docs/conventions.md)
- Day-by-day build plan: see [docs/build-plan.md](docs/build-plan.md)
- Local setup + deployment checklist: see [docs/deployment.md](docs/deployment.md)
- Demo walkthrough script: see [docs/demo-script.md](docs/demo-script.md)

## 7. Standing Rules

**Task management:**
- Before starting any non-trivial task, write a short plan/checklist to `tasks/todo.md`.
- Work through it, checking items off as you go.
- Give a brief summary of what changed when the task is done.

**Self-improvement loop:**
- Maintain `tasks/lessons.md`.
- Check it for relevant past mistakes before starting a new task.
- After finishing a task — especially after fixing a bug or being
  corrected — append a short lesson so the same mistake isn't repeated.

**Verify before done:**
- Never mark a task complete without actually running it (tests, build,
  lint, or a manual check) and confirming it works.
- Don't assume code is correct just because it looks right.
- A `PostToolUse` hook (`.claude/hooks/check_backend_edit.py`) already
  runs backend pytest automatically after any edit under `backend/`, so
  its result is part of your verification, not a substitute for
  checking frontend/manual paths yourself.

**Performance / context loading:**
- Don't read or load more than the task needs.
- Prefer targeted reads of specific files/functions over dumping whole directories.
- Only open a `docs/*.md` file when the current task actually needs that detail.

**Error boundaries:**
- In the frontend, wrap route-level and any risky components in an
  `ErrorBoundary.jsx` component so a failure in one part of the UI
  doesn't crash the whole app.

**File size limit:**
- Keep any single file under ~200 lines.
- If a file grows past that, split the logic into a new file/function
  and import it back in, rather than letting one file balloon.
- The same hook mentioned above also warns (via `systemMessage`)
  whenever an edited file exceeds this limit.

**Simplicity & no duplication:**
- Prefer the simplest correct solution.
- Don't duplicate logic — if you're about to write code that already
  exists elsewhere (a helper, a component, a query pattern), reuse or
  extend it instead.
- See `docs/conventions.md` for the shared helpers, components, and
  patterns already in this codebase (e.g. `get_*_or_404` on the
  backend, `Modal.jsx`/`Pagination` on the frontend) before adding new ones.

**Docs vs. code conflicts:**
- `docs/*.md` and ONBOARDING.md/StockFlow_Report.md can go stale — this has
  already happened (`docs/roles.md` once claimed managers could manage
  products/stock; the code says admin-only).
- If a doc and the actual code disagree, trust the code.
- Flag the discrepancy to the user rather than silently picking one or
  quietly "fixing" the doc without saying so.

**Don't guess ports/URLs:**
- This project has real, historical port mismatches (backend 8000 vs 8003,
  Postgres 5433 vs 5434) across `.env`, `docker-compose.yml`, and older docs.
- Treat `docs/deployment.md` as the single source of truth for ports/URLs.
- Don't infer them from `.env.example`, `docker-compose.yml`, or any other
  doc without cross-checking `docs/deployment.md` first.
