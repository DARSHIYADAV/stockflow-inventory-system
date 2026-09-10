# StockFlow — Project Guide

## 1. Project Overview

StockFlow is a company inventory and asset management system. It tracks
general stock (products like laptops, monitors, keyboards, mice) and
individual trackable assets (a specific laptop with a serial number,
assigned to a specific employee). Admins and managers manage products,
record stock in/out, and assign or return assets. Employees log in and
see only the equipment currently assigned to them. Every stock change
and every asset assignment is recorded in an audit history, so nothing
is ever silently overwritten.

**Core idea to remember:** stock quantity is never stored as a single
mutable number — it is *derived* by summing a ledger of transactions.
This is the single most important design decision in the project and
the best thing to be able to explain.

---

## 2. Tech Stack

### Backend
- Python 3.11+
- FastAPI — REST API framework
- SQLAlchemy 2.0 (async) — ORM
- Alembic — database migrations
- Pydantic — request/response validation
- python-jose or PyJWT — JWT handling
- passlib (bcrypt) — password hashing
- Pytest — testing
- Uvicorn — ASGI server

### Frontend
- React 18 (plain JavaScript, no TypeScript)
- Vite — build tool/dev server
- React Router — client-side routing
- React Query (TanStack Query) — server state/data fetching
- Axios — API client
- Tailwind CSS — styling
- React Hook Form (optional) — forms

### Database
- PostgreSQL

### Auth
- JWT (access token)
- Role-based access control (RBAC): Admin/Manager vs Employee

### DevOps
- Docker + Docker Compose (local dev: backend + Postgres)
- Railway or Render (backend + Postgres hosting)
- Vercel or Netlify (frontend hosting)
- GitHub (version control)
- GitHub Actions (optional CI)

### Dev Tooling
- Claude Code — AI pair-programmer for scaffolding/implementation/tests
- FastAPI Swagger UI (`/docs`) — manual API testing

### Deliberately Not Used (scope control)
- No WebSockets / real-time
- No Celery / Redis background jobs
- No AI / ML
- No chart library (dashboard shows numbers only)
- No S3 / file storage
- No TypeScript

---

## 3. Folder Structure

```
stockflow/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI app entrypoint
│   │   ├── config.py                # settings/env vars
│   │   ├── database.py              # SQLAlchemy engine/session
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── product.py
│   │   │   ├── stock_transaction.py
│   │   │   ├── asset.py
│   │   │   └── asset_history.py
│   │   ├── schemas/                 # Pydantic schemas
│   │   │   ├── user.py
│   │   │   ├── product.py
│   │   │   ├── asset.py
│   │   │   └── dashboard.py
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── products.py
│   │   │   ├── stock.py
│   │   │   ├── assets.py
│   │   │   ├── users.py
│   │   │   └── dashboard.py
│   │   ├── core/
│   │   │   ├── security.py          # JWT + password hashing
│   │   │   └── dependencies.py      # auth/RBAC dependencies
│   │   └── seed.py                  # demo data seed script
│   ├── alembic/                     # migrations
│   ├── tests/
│   │   ├── test_auth.py
│   │   ├── test_stock.py
│   │   └── test_assets.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── api/
│   │   │   └── client.js            # axios instance + interceptors
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── Assets.jsx
│   │   │   ├── MyAssets.jsx
│   │   │   └── Users.jsx
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── ProductModal.jsx
│   │   │   └── AssetModal.jsx
│   │   └── styles/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── docker-compose.yml
├── CLAUDE.md
└── README.md
```

---

## 4. Database Schema

### `users`
| Column | Type | Notes |
|---|---|---|
| id | UUID/PK | |
| name | string | |
| email | string, unique | |
| password_hash | string | |
| role | enum(admin, manager, employee) | |
| created_at | timestamp | |

### `products`
| Column | Type | Notes |
|---|---|---|
| id | UUID/PK | |
| name | string | e.g. "MacBook Pro" |
| category | string | e.g. "Laptop" |
| supplier_name | string | plain text field, not a separate table |
| low_stock_threshold | integer | for dashboard alerts |
| created_at | timestamp | |

*Quantity is NOT a column here — it's derived by summing `stock_transactions`.*

### `stock_transactions`
| Column | Type | Notes |
|---|---|---|
| id | UUID/PK | |
| product_id | FK → products | |
| change_quantity | integer | positive = stock in, negative = stock out |
| reason | string | e.g. "New purchase", "Issued to employee" |
| actor_id | FK → users | who performed the action |
| created_at | timestamp | |

### `assets`
| Column | Type | Notes |
|---|---|---|
| id | UUID/PK | |
| asset_tag | string, unique | e.g. "AST-001" |
| product_id | FK → products | |
| serial_number | string, nullable | |
| status | enum(available, assigned, retired) | |
| assigned_to | FK → users, nullable | |
| purchase_date | date, nullable | |
| created_at | timestamp | |

### `asset_history`
| Column | Type | Notes |
|---|---|---|
| id | UUID/PK | |
| asset_id | FK → assets | |
| action | enum(assigned, returned) | |
| employee_id | FK → users | |
| actor_id | FK → users | who performed the assign/return |
| note | string, nullable | |
| created_at | timestamp | |

### Relationships Summary
- `products` 1 → many `stock_transactions`
- `products` 1 → many `assets`
- `assets` 1 → many `asset_history`
- `users` 1 → many `stock_transactions` (as actor)
- `users` 1 → many `asset_history` (as employee and/or actor)
- `users` 1 → many `assets` (currently assigned)

---

## 5. API Endpoints

### Auth
- `POST /auth/register` — create user (admin only, or open registration for first admin)
- `POST /auth/login` — returns JWT access token
- `GET /auth/me` — current user info

### Products
- `GET /products` — list all products (with derived quantity)
- `POST /products` — create product (admin/manager)
- `PUT /products/{id}` — edit product (admin/manager)
- `DELETE /products/{id}` — delete product (admin)

### Stock
- `POST /stock/{product_id}/transaction` — record stock in/out (admin/manager)
- `GET /stock/{product_id}/history` — transaction history for a product

### Assets
- `GET /assets` — list all assets (filterable by status)
- `POST /assets` — create asset (admin/manager)
- `POST /assets/{id}/assign` — assign to employee (admin/manager)
- `POST /assets/{id}/return` — mark returned (admin/manager)
- `GET /assets/{id}/history` — asset assignment history
- `GET /assets/my` — assets assigned to the logged-in employee

### Users
- `GET /users` — list all users (admin only)
- `PUT /users/{id}/role` — change a user's role (admin only)

### Dashboard
- `GET /dashboard/summary` — counts: total products, low-stock count, total assets, assigned assets, recent activity feed

---

## 6. Roles & Permissions

| Action | Admin | Manager | Employee |
|---|---|---|---|
| View dashboard | ✅ | ✅ | ❌ |
| Manage products | ✅ | ✅ | ❌ |
| Record stock in/out | ✅ | ✅ | ❌ |
| Manage assets (create/assign/return) | ✅ | ✅ | ❌ |
| View all users | ✅ | ❌ | ❌ |
| Change user roles | ✅ | ❌ | ❌ |
| View own assigned assets | ✅ | ✅ | ✅ |

---

## 7. Day-by-Day Build Plan (2 Days)

### Day 1 — Backend + Auth + Core CRUD
- Hr 1: `CLAUDE.md`, repo scaffold, Docker Compose (FastAPI + Postgres), all SQLAlchemy models, first Alembic migration
- Hr 2-3: Auth (register/login, JWT, password hashing), RBAC dependency (admin/manager vs employee)
- Hr 4-5: Products CRUD + stock in/out endpoint (writes to `stock_transactions`, quantity derived via sum)
- Hr 6-7: Assets CRUD + assign/return endpoints (writes to `asset_history`)
- Hr 8: Dashboard summary endpoint (counts, low-stock query, recent activity feed)
- **Checkpoint:** entire backend testable via `/docs`.

### Day 2 — Frontend + Polish + Deploy
- Hr 1-2: React scaffold, auth context, protected routes, API client, layout/nav
- Hr 3: Dashboard page (stat cards + recent activity list)
- Hr 4: Products page (table + add/edit modal + stock in/out action)
- Hr 5: Assets page (table + assign/return action, filter by status)
- Hr 6: Users page (admin-only) + My Assets page (employee view)
- Hr 7: Seed script with demo data, Pytest tests (stock derivation, asset assign/return, RBAC boundaries)
- Hr 8: Dockerize, deploy backend+DB (Railway/Render), deploy frontend (Vercel), README + demo walkthrough
- **Checkpoint:** live URL, seeded demo data, fully demoable.

---

## 8. Local Setup Instructions

```bash
# 1. Clone repo
git clone <repo-url>
cd stockflow

# 2. Start backend + database
docker compose up -d

# 3. Run migrations
docker compose exec backend alembic upgrade head

# 4. Seed demo data
docker compose exec backend python -m app.seed

# 5. Install & run frontend
cd frontend
npm install
npm run dev
```

- Backend API docs: `http://localhost:8000/docs`
- Frontend: `http://localhost:5173`

---

## 9. Deployment Checklist

- [ ] Push repo to GitHub
- [ ] Create Postgres instance on Railway/Render
- [ ] Deploy backend (set `DATABASE_URL`, `JWT_SECRET` env vars)
- [ ] Run migrations on deployed DB
- [ ] Run seed script (or seed manually via `/docs`)
- [ ] Deploy frontend to Vercel/Netlify (set API base URL env var)
- [ ] Test full flow on live URL: login → add product → stock in → create asset → assign → dashboard reflects changes
- [ ] Update README with live demo link

---

## 10. Demo Script (for presenting)

1. Log in as Admin → show dashboard (counts, recent activity)
2. Add a new product (e.g., "Dell Monitor") → show it appear with 0 quantity
3. Record stock in (+30) → quantity updates, transaction appears in history
4. Create an asset (specific laptop, e.g. AST-005) → show it as "Available"
5. Assign asset to an employee → status changes to "Assigned", history logged
6. Log out, log in as that Employee → show "My Assets" page with only their equipment
7. Log back in as Admin → return the asset → show it goes back to "Available", history shows both events
8. Point to dashboard low-stock alert if any product is under threshold

---

## 11. Future Improvements (mention in README, don't build now)

- Postgres exclusion constraints / stronger concurrency guarantees for stock updates
- Employee-initiated "request equipment" workflow (currently admin/manager-driven only)
- Supplier as a full entity with purchase order tracking
- Charts/visualizations on dashboard (Recharts)
- Email notifications on assignment
- Refresh token rotation for auth
