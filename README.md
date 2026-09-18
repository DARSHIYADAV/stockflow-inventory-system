# StockFlow Inventory System

A company inventory and asset management system built with React, FastAPI, and PostgreSQL. It tracks products, stock levels, and individual equipment assigned to employees, with a full history of every stock change and asset assignment.

## Tech Stack

- Frontend: React (JavaScript)
- Backend: FastAPI (Python)
- Database: PostgreSQL
- Auth: JWT-based, role-based access control

## Status

🚧 In development

## Deployment: required environment variables

Set these on the hosting platform (backend). All are read via
`backend/app/config.py` (pydantic-settings); locally they can instead go in
`backend/.env`, which is gitignored and must never be committed.

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | Postgres connection string, e.g. `postgresql+asyncpg://user:pass@host:5432/db` |
| `JWT_SECRET` | yes | Secret used to sign/verify JWTs — must be a long random value in production, never the code default |
| `JWT_ALGORITHM` | no (default `HS256`) | JWT signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | no (default `1440`, i.e. 24h) | Access token lifetime |
| `CORS_ORIGINS` | yes in production | Comma-separated list of allowed frontend origins (e.g. `https://your-frontend.example.com`) — never set to `*` |

The production Docker image (`backend/Dockerfile`) runs uvicorn without
`--reload`, so it won't leak stack traces or auto-restart on file changes.

## Future improvements (not yet implemented)

- Rate limiting on auth endpoints (brute-force protection)
- Structured request/error logging
- Automated CI (lint/test) on push
- Frontend component/unit tests (Vitest + React Testing Library) — today
  the frontend only has a build-check hook, not real test coverage
