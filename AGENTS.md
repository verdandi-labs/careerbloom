## Python dependency management
- Always use `uv` for Python operations. Never use `pip`, `pip install`, or `uv pip install`.
- When adding packages: `uv add <package>`.
- When running code: `uv run <script>`.
- When syncing: `uv sync`.
- For spaCy models, use `uv add en-core-web-sm es-core-news-sm` (they're pip-installable wheels).
- If a dependency fails to resolve, use `uv add --frozen <pkg>` to skip locking.

## Before making changes
- Always explain your plan first — what files will be created/modified, why, and the order of operations.
- Wait for my approval before writing any code or running any commands.
- For complex features, ask clarifying questions to narrow the scope before proposing a plan.

## Frontend vs backend
- `frontend/` = Vite + React app (frontend)
- `backend/` = FastAPI app (backend)
- Supabase functions live in `supabase/functions/`
