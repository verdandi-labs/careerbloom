# CareerBloom

Career transition companion for people figuring out what comes next. Helping you understand your assets, where you want to go, and how to present yourself along the way, without the pressure of having it all figured out before you start.

## Stack

| Layer    | Tech |
| -------- | ---- |
| Frontend | Vite + React 19, TanStack Router + Query, Zustand, Tailwind CSS 4, bun |
| AI       | LangGraph + LangChain, Groq (primary), Cloudflare Workers AI (fallback) |
| Backend  | FastAPI, SQLAlchemy (async), PostgreSQL (Neon), uv |
| Auth     | Google + GitHub OAuth, httpOnly session cookies |
| Deploy   | Docker, Render |

## Repo layout

- `src/` — new Python code and the uv project root (source of truth): `graph/`, `llm/`, `prompts/`, `workflows/`, `cv/`
- `backend/` — legacy FastAPI app, kept for the deploy until the refactor is done. Do not add new features here
- `backend/migrations/` — numbered SQL files for schema changes (no Alembic)
- `frontend/` — Vite + React app (bun)
- `docs/` — architecture notes and feature specs

## Setup

### Python (src)

This is the source of truth for new AI code and the uv project root.

```sh
cd src
cp .env.example .env   # fill in the values
uv sync
uv run ruff check --fix .
uv run ruff format .
```

### Backend (legacy app)

```sh
cd backend
# create .env with the vars below, then
uv run uvicorn main:app --reload --port 8000
```

Required env vars:

| Var | Description |
| --- | ----------- |
| `NEON_DATABASE_URL` | PostgreSQL connection string |
| `HMAC_SECRET` | Secret for hashing emails and magic-link tokens |
| `MASTER_KEY` | Fernet master key that wraps per-user encryption keys (32-byte base64-urlsafe, no default) |
| `SESSION_SECRET` | Secret for signing session cookies (no default — app refuses to start without it) |
| `GOOGLE_CLIENT_ID` | For Google sign-in |
| `GOOGLE_CLIENT_SECRET` | For Google sign-in |
| `GITHUB_CLIENT_ID` | For GitHub sign-in |
| `GITHUB_CLIENT_SECRET` | For GitHub sign-in |
| `GROQ_API_KEY` | Groq API key for AI workflows |
| `GROQ_BASE_URL` | Groq OpenAI-compatible base URL |
| `CLOUDFLARE_API_KEY` | Cloudflare Workers AI key (fallback) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID (fallback) |
| `FRONTEND_URL` | Frontend origin (used in magic-link emails) |
| `CORS_ORIGINS` | Comma-separated allowed origins |
| `DEBUG` | Enable debug mode (default `false`) |

Generate the `MASTER_KEY` with:
```sh
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

### Frontend

```sh
cd frontend
bun install
bun run dev        # http://localhost:5173
bun run lint       # eslint
bun run format     # prettier
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

Single Docker image (Dockerfile) builds the frontend and serves it from FastAPI. Set `CORS_ORIGINS`, `FRONTEND_URL` and `MASTER_KEY` to the deployed values in the host's env vars — `.env` files do not ship with the image.

## License

Source-available, not open source. Licensed under the PolyForm Noncommercial License 1.0.0. Free for personal, educational and research use. Any commercial use requires a separate licence: verdandi.labs@gmail.com
