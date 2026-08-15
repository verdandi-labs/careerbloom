# careerBloom

Career growth app: build your CV, cover letters, and get AI-powered guidance — with magic-link authentication and optional bring-your-own-database.

## Stack

| Layer    | Tech |
| -------- | ---- |
| Frontend | Vite + React 19, TanStack Router + Query, Zustand, Tailwind CSS 4, bun |
| Backend  | FastAPI, SQLAlchemy (async), PostgreSQL (Neon), uv |
| Auth     | Email magic links (SendGrid), Google + GitHub OAuth, httpOnly session cookies |
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
| `HMAC_SECRET` | Secret for hashing emails and magic-link tokens |
| `GOOGLE_KMS_KEY_NAME` | KMS crypto key name that wraps per-user encryption keys (no default) |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | Service-account JSON for calling KMS (optional if using ADC) |
| `SESSION_SECRET` | Secret for signing session cookies (no default — app refuses to start without it) |
| `SENDGRID_API_KEY` | For magic-link emails |
| `GOOGLE_CLIENT_ID` | For Google sign-in |
| `GOOGLE_CLIENT_SECRET` | For Google sign-in |
| `GITHUB_CLIENT_ID` | For GitHub sign-in |
| `GITHUB_CLIENT_SECRET` | For GitHub sign-in |
| `GEMINI_API_KEY` | For AI features |
| `FRONTEND_URL` | Frontend origin (used in magic-link emails) |
| `CORS_ORIGINS` | Comma-separated allowed origins |

Generate `GOOGLE_KMS_KEY_NAME` by creating a KMS keyring and crypto key (see `backend/.env.example` for the expected resource name format).

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

Sign in with a one-time email magic link (valid 15 min) or Google/GitHub OAuth. Sessions are 7-day httpOnly cookies; the raw token is stored only as a hash.

## Deploy

Single Docker image (Dockerfile) builds the frontend and serves it from FastAPI. Set `CORS_ORIGINS` and `FRONTEND_URL` to the deployed origin in the host's env vars — `.env` files do not ship with the image.
