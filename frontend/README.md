# careerBloom Frontend

Vite + React 19 app, bun as package manager.

## Scripts

| Command | Description |
| ------- | ----------- |
| `bun run dev` | Start dev server (http://localhost:5173) |
| `bun run build` | Production build |
| `bun run lint` | ESLint + Prettier |
| `bun run format` | Prettier write |
| `bun run generate-routes` | Regenerate TanStack Router route tree |

## Architecture

- **Server state** lives in TanStack Query (`useSession()`, `useSignOut()`). Never put API data in Zustand.
- **Zustand** is for ephemeral UI state only — cross-screen email, modal visibility.
- **Feature colocation**: feature code lives in `src/features/<name>/` with its own `screens/`, `hooks/`, `api/`, `types/`, and an `index.ts` public API. Shared UI primitives in `components/ui/`, shared utilities in `lib/`.
- **Routing**: TanStack Router file-based routing (`src/routes/`). Route files are lazy-loaded with `React.lazy()` + `<Suspense>`, paired with an `ErrorBoundary` that includes a retry action.

## Environment

Copy values into `.env` (not committed):

- `VITE_API_URL` — API base URL, e.g. `http://localhost:8000/api/v1`
