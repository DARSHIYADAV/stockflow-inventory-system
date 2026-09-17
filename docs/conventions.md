# Coding Conventions

## Backend

- Data access: `select()` + `await db.execute()` / `await db.scalar()`; explicit
  `await db.commit()` / `await db.refresh()` — no implicit autocommit.
- Always raise with `status.HTTP_*` constants, never bare integers.
- 404 lookups go through small helpers (`get_product_or_404`, `get_asset_or_404`, etc.)
  rather than inline checks in every route.
- Router files: `router = APIRouter(prefix="/<plural>", tags=["<plural>"])`, registered
  in `app/main.py`. RBAC is applied per-route (`Depends(require_admin)` etc.), not at
  the router level.
- Tests: one file per router (`test_<resource>.py`). `auth_headers(user)` is a plain
  function imported from `tests.conftest` — **not** a pytest fixture. `pytest.ini` sets
  `asyncio_mode = auto`, so tests are plain `async def test_*` with no
  `@pytest.mark.asyncio` decorator.

## Frontend

- Styling: use the `@layer components` classes defined in `src/styles/index.css`
  (`card`, `btn-primary/secondary/danger`, `input-field`, `select-field`, `table-shell`,
  `modal-panel`, `stat-card`, `empty-state`, `spinner`, …) and semantic color tokens
  (`bg-panel`, `text-ink-primary/secondary/muted`, `border-border`, `accent`) instead of
  raw Tailwind colors — the theme is CSS-variable driven with `darkMode: 'class'`.
- Modals: every modal wraps the shared `src/components/Modal.jsx` and takes the prop
  contract `{ entity?, onClose, onSubmit, submitting, error }`. The parent page owns
  mutation state and renders the modal conditionally; local form state is a single
  `form` object updated via `handleChange(field, value)`.
- Data fetching: thin per-resource modules in `src/api/*.js` (return `data`), consumed
  by React Query in the page. Query keys are plain kebab-case string arrays with no
  central key factory (e.g. `['assets', statusFilter]`, `['dashboard-summary']`). Each
  page defines its own `invalidate()` calling `queryClient.invalidateQueries(...)` from
  mutation `onSuccess` handlers.
- Pagination is client-side via the shared `Pagination` component (`PAGE_SIZE = 5`),
  not server-side.
- Auth: JWT lives in `localStorage['token']`; the axios request interceptor attaches
  `Authorization: Bearer`. On a 401 (excluding `/auth/login` calls) the response
  interceptor clears the token and hard-redirects via `window.location.href`, not a
  router navigate.
- Reuse existing shared components rather than reinventing: `Layout` (every page wraps
  in it), `Spinner`, `EmptyState`, `StatusBadge`, `RoleBadge`, `UserCard`, `UserMenu`,
  `ThemeToggle`.

## Cross-cutting trap: adding a new route

Role-gating is currently duplicated in **three** places, and they can disagree:
1. `src/App.jsx` — the route's `<ProtectedRoute allowedRoles={[...]}>`
2. `src/components/Sidebar.jsx` — its own `links[].allowedRoles` array
3. Individual pages sometimes compute their own `canManage` flag (e.g.
   `Products.jsx` computes `admin || manager` even though the route and the API are
   admin-only)

When adding or changing a role-gated route, update all three, and check them against
the actual backend dependency (`require_admin` vs `require_admin_or_manager`) rather
than assuming they already agree.
