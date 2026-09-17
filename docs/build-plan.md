# Build Plan (Phased)

### Phase 0 — Scaffold
`CLAUDE.md`, repo scaffold, Docker Compose (FastAPI + Postgres), all SQLAlchemy models, first Alembic migration

### Phase 1 — Auth & RBAC
Auth (register/login, JWT, password hashing), RBAC dependency (admin/manager vs employee)

### Phase 2 — Products & Stock
Products CRUD + stock in/out endpoint (writes to `stock_transactions`, quantity derived via sum)

### Phase 3 — Assets
Assets CRUD + assign/return endpoints (writes to `asset_history`)

### Phase 4 — Dashboard API
Dashboard summary endpoint (counts, low-stock query, recent activity feed)

**Checkpoint:** entire backend testable via `/docs`.

### Phase 5 — Frontend Scaffold
React scaffold, auth context, protected routes, API client, layout/nav

### Phase 6 — Core Pages
- Dashboard page (stat cards + recent activity list)
- Products page (table + add/edit modal + stock in/out action)
- Assets page (table + assign/return action, filter by status)
- Users page (admin-only) + My Assets page (employee view)

### Phase 7 — Seed, Tests & Deploy
- Seed script with demo data, Pytest tests (stock derivation, asset assign/return, RBAC boundaries)
- Dockerize, deploy backend+DB (Railway/Render), deploy frontend (Vercel), README + demo walkthrough

**Checkpoint:** live URL, seeded demo data, fully demoable.
