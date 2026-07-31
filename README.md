# careerBloom

Career growth app: build your CV, cover letters, and get AI-powered guidance — with magic-link authentication and optional bring-your-own-database.

## Stack

| Layer    | Tech |
| -------- | ---- |
| Frontend | Vite + React 19, TanStack Router + Query, Zustand, Tailwind CSS 4, bun |
| Backend  | FastAPI, SQLAlchemy (async), PostgreSQL (Neon), uv |
| Auth     | Email magic links (SendGrid), JWT access + refresh tokens |
| Deploy   | Docker, Render |

## Repo layout

- `frontend/` — Vite + React app (bun)
- `backend/` — FastAPI app (uv)
- `backend/migrations/` — numbered SQL files for schema changes (no Alembic)
- `supabase/functions/` — Supabase edge functions

## Setup

### Backend

```sh
cd backend
cp .env.example .env   # fill in the values
uv sync
uv run uvicorn main:app --reload --port 8000
```

Required env vars:

| Var | Description |
| --- | ----------- |
| `NEON_DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWTs (no default — app refuses to start without it) |
| `SENDGRID_API_KEY` | For magic-link emails |
| `ENCRYPTION_KEY` | For encrypting BYODB connection passwords |
| `GEMINI_API_KEY` | For AI features |
| `FRONTEND_URL` | Frontend origin (used in magic-link emails) |
| `CORS_ORIGINS` | Comma-separated allowed origins |

### Frontend

```sh
cd frontend
bun install
bun run dev        # http://localhost:5173
bun run lint       # eslint + prettier
bun run build      # production build
```

## Schema migrations

No Alembic. Schema changes are documented as numbered SQL files in `backend/migrations/`.

Convention: `001_description.sql`, `002_description.sql`, etc.
- One file per change
- Files are append-only documentation of what ran against the live DB
- Never edit a file that has already been executed
- New environments: run files in order against the target DB

## Auth

Magic-link only. Sign in with email → receive a one-time link (valid 15 min) → link exchanges for JWT access/refresh tokens.

## Deploy

Single Docker image (Dockerfile) builds the frontend and serves it from FastAPI. Set `CORS_ORIGINS` and `FRONTEND_URL` to the deployed origin in the host's env vars — `.env` files do not ship with the image.
