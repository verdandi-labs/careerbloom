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

## Frontend architecture
- **Server state** belongs in TanStack Query. Use `useSession()` for the user query, `useLogin()`/`useSetPassword()`/`useSignOut()` for auth mutations. Never put API data in Zustand.
- **Zustand** is for ephemeral UI state only — auth flow mode (`magic-link` | `login`), cross-screen email, modal visibility. Actions must be stable references defined once in the store.
- **State boundary rule**: before adding anything to Zustand, ask if it has a server source (API response) or a URL source (search param / route state). If yes, keep it in TanStack Query or TanStack Router instead. Most "UI state" like banner visibility, selected tab, or onboarding progress is actually derived from server data or URL params.
- **Feature colocation**: feature-specific code goes in `frontend/src/features/<name>/` with its own screens/, hooks/, api/, types/, and index.ts for the public API. Shared UI primitives in `components/ui/`. Shared utilities in `lib/`.
- **Code splitting**: use `React.lazy()` + `<Suspense>` for feature screens at the route level. Vite auto-splits these into separate chunks — no `manualChunks` in vite config needed.
- **Route-level error boundaries**: pair `<Suspense>` with an `<ErrorBoundary>` wrapping each lazy-loaded route. The error boundary fallback must include a retry action. A lazy chunk that fails to load (network blip, deploy race) will otherwise crash the whole page silently.
- **No AuthProvider/AuthInit**. Auth initialization happens automatically via `useSession()` query on mount.
