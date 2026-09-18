# Local Setup & Deployment

## Local Setup Instructions (actual working workflow)

The `docker-compose.yml` in this repo is not the workflow currently in use —
local development runs the backend directly through its virtualenv against a
locally installed Postgres. There is also **no seed script**
(`backend/app/seed.py` does not exist); demo accounts are created manually.

```bash
# 1. Clone repo
git clone <repo-url>
cd stockflow

# 2. Backend: create/activate the venv, install deps, run migrations
cd backend
python -m venv myenv
./myenv/Scripts/pip install -r requirements.txt
./myenv/Scripts/alembic.exe upgrade head

# 3. Run the backend (see backend/.env for DATABASE_URL / JWT_SECRET)
./myenv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8003

# 4. Install & run frontend
cd ../frontend
npm install
npm run dev
```

- Backend API docs: `http://localhost:8003/docs`
- Frontend: `http://localhost:5173`
- Postgres: local instance on port `5434` (see `backend/.env` for the exact
  connection string; a separate `stockflow_test` database is required to run
  the backend test suite — see `CLAUDE.md` § Commands).
- Demo sign-ins: see [docs/demo-script.md](docs/demo-script.md).

### If you do use Docker

`docker-compose.yml` defines a `db` (Postgres 16, port `5433`) and a `backend`
service (port `8000`). This differs from the ports above, so if you run this
path instead, the frontend's `VITE_API_BASE_URL` must be updated to match
(currently the committed `frontend/.env` points at `8003`).

## Deployment Checklist

- [ ] Push repo to GitHub
- [ ] Create Postgres instance on Railway/Render
- [ ] Deploy backend (set `DATABASE_URL`, `JWT_SECRET` env vars)
- [ ] Run migrations on deployed DB (`alembic upgrade head`)
- [ ] Create the first admin via `POST /auth/register` (bootstraps with no auth
      required — see `CLAUDE.md` § Invariants & Gotchas), then create any
      further users through the app
- [ ] Deploy frontend to Vercel/Netlify (set `VITE_API_BASE_URL` to the deployed backend URL)
- [ ] Test full flow on live URL: login → add product → stock in → create asset → assign → dashboard reflects changes
- [ ] Update README with live demo link
