# StockFlow — Team Onboarding Guide

Welcome to **StockFlow**, a company inventory and asset management system. This guide gets you from zero to productive on this codebase.

## What it does

StockFlow tracks two kinds of company property:
- **Stock** — bulk items (laptops, monitors, keyboards) counted by quantity, not individually tracked.
- **Assets** — specific, individually trackable items (one laptop with one serial number), assigned to one employee at a time.

**The core design rule:** a product's quantity is never a stored, editable number. It's always calculated fresh by summing every stock-in/stock-out transaction ever recorded — a ledger, not a mutable field. The same applies to assets: every assign/return appends a row to an audit history table; nothing is ever overwritten.

## Roles

Three roles, each with its own login URL (`/login/admin`, `/login/manager`, `/login/employee`):

| Capability | Admin | Manager | Employee |
|---|---|---|---|
| Dashboard & recent activity | Full | Counts only | — |
| Manage products & stock | Yes | — | — |
| Create/assign/return assets | Yes | Yes | — |
| View own assigned equipment | Yes | Yes | Yes |
| Manage user accounts | Yes | — | — |

Exactly **one admin account** can ever exist — enforced at the database level (not just the app layer). Trying to log into the wrong role's endpoint fails with the same generic "incorrect email or password" error a real wrong password would give, so there's no way to probe an account's existence or role.

## Tech stack

**Frontend:** React 18 + Vite, Tailwind CSS, React Query, Axios, React Router
**Backend:** FastAPI (Python), SQLAlchemy 2.0 (async), Alembic (migrations), Pydantic
**Database:** PostgreSQL
**Auth:** JWT (python-jose) + bcrypt (passlib)
**Testing:** Pytest (100 tests as of this writing)

## Folder structure

```
stockflow/
├── backend/
│   ├── app/
│   │   ├── main.py, config.py, database.py
│   │   ├── models/        # SQLAlchemy models (users, products, stock_transactions, assets, asset_history)
│   │   ├── schemas/       # Pydantic request/response schemas
│   │   ├── routers/       # auth, products, stock, assets, users, dashboard
│   │   └── core/          # security.py (JWT/hashing), dependencies.py (RBAC)
│   ├── alembic/versions/  # migrations, in order
│   └── tests/             # pytest suite, one file per router
├── frontend/
│   └── src/
│       ├── pages/         # one file per route
│       ├── components/    # shared UI (modals, Sidebar, UserCard, etc.)
│       ├── api/            # axios calls per resource
│       └── context/       # AuthContext, ThemeContext
└── CLAUDE.md              # original project spec/build plan
```

## Running it locally

**Backend** (from `backend/`):
```bash
./myenv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8003
```

**Frontend** (from `frontend/`):
```bash
npm run dev
```

Backend: `http://localhost:8003` (docs at `/docs`) · Frontend: `http://localhost:5173`

Database: PostgreSQL on port 5434, database name `stockflow` (a separate `stockflow_test` database is used for the test suite — tests refuse to run against anything else, by design).

## Running tests

```bash
cd backend
./myenv/Scripts/python.exe -m pytest -q
```

## Key conventions to know before touching code

- **Never add a stored, mutable quantity field.** Stock is always derived by summing `stock_transactions`. If you're tempted to "just cache the total," don't.
- **Never overwrite asset assignment state without logging it.** Every assign/return must append to `asset_history`.
- New user emails must end in `@staunchsys.com` (validated on both frontend and backend).
- Manager and employee accounts can be **deactivated** (not deleted) — this blocks login and hides them from assignment pickers, without breaking historical records that reference them by name.
- Admin accounts can never be deactivated, and there can never be more than one.
- Every error message for login failures (wrong password, wrong role, deactivated account) must stay generically worded — never reveal which case it was.

## Where to look first

- `backend/app/core/dependencies.py` — the RBAC gates (`require_admin`, `require_admin_or_manager`) used everywhere.
- `backend/app/routers/` — one file per resource; RBAC and business rules live here.
- `frontend/src/components/Sidebar.jsx` — the source of truth for which nav links each role sees.
- `CLAUDE.md` — the original spec this project was built against; still the best "why does this exist" reference.
