# Architecture & Data Flow

## 1. App Shell (`src/main.tsx` → `src/App.tsx`)

`main.tsx` renders `<App/>` inside `React.StrictMode`. `App.tsx` composes providers outside-in:

```
QueryClientProvider (TanStack Query)
  └─ ThemeProvider            (dark/light, localStorage)
      └─ ToastProvider        (toast notifications)
          └─ AuthProvider     (user/token state + auth methods)
              └─ BrowserRouter (v7 future flags: v7_startTransition, v7_relativeSplatPath)
                  └─ <Routes>
```

`QueryClient` defaults: `retry: 1`, `refetchOnWindowFocus: false`, `staleTime: 30s`.

## 2. Routing Tree

- **Public (guest-only)** via `<RedirectIfAuthed/>` wrapper: `/login`, `/signup`, `/activate`, `/forgot-password`, `/reset-password`.
- **Protected** via `<RequireAuth/>` → `<AppLayout/>` (sidebar + topbar + `<Outlet/>`): `/` (Dashboard), `/products`, `/purchases`, `/suppliers`, `/adjustments`, `/movements`, `/notifications`, `/categories`, `/units`, `/profile`, `/admin/roles`, `/admin/permissions`, `/admin/audits`.
- **Fallbacks**: `/404` (NotFoundPage) and `*` → redirect to `/404`.

See `03_PAGES_AND_ROUTING.md` for the full table.

## 3. Auth Boot (hydration)

`AuthProvider` on mount calls `authApi.profile()` (`POST /auth/profile`). If it succeeds, `setUser(profile)`; if it 401s, the axios interceptor silently tries `/auth/refresh` before the profile request is retried. On success `loading` flips false. A global `auth:logout` CustomEvent (dispatched by the interceptor when refresh fails) clears user/token.

## 4. Data Flow (React Query + axios)

- Each `src/api/*` module wraps `api.*` calls and returns parsed payloads (see `04_API_LAYER_AND_TYPES.md`).
- Reads use `useQuery({ queryKey, queryFn, enabled, ... })`. Mutations:
  - **Simple pattern** — create/update/delete then `useQueryClient().invalidateQueries({ queryKey })` (most pages).
  - **Optimistic pattern (Task 19)** — Products edit/delete and the stock-adjust mutation in `Adjustments.tsx` use `lib/queryCache.ts` helpers (`optimisticPatch`/`optimisticUpsert`/`optimisticRemove` + `snapshotQueries`/`restoreQueries`) inside `onMutate`/`onError`/`onSuccess`/`onSettled`, so the UI updates instantly and rolls back on failure. See `07_KNOWN_ISSUES_AND_CODE_SMELLS.md` item 12.
- Shared axios instance (`src/lib/api.ts`):
  - `baseURL: VITE_API_URL || "/api/v1"`
  - `withCredentials: true` (browser sends httpOnly auth cookies)
  - Response interceptor for silent refresh (see `06_AUTH_AND_RBAC_CLIENT.md`).
  - Response interceptor also shows a **default error toast** for unhandled query errors (Task 18); mutations pass `{ skipErrorToast: true }` centrally in `src/api/*` since call sites toast their own custom messages. `lib/toast.ts` bridges non-React code (interceptors) to `ToastProvider`.
- Error display: `errorMessage(err, fallback)` extracts `response.data.message` / `.error` from axios errors.

## 5. Dashboard

`GET /products/dashboard` (Task 2) backs the stats cards and low/out-of-stock table:

- `productsApi.dashboard()` → `{ totalProducts, totalStockValue, lowStockItems, outOfStockItems, lowStockProducts }`, cached under `["products","dashboard"]`.
- `movementsApi.list({ limit: 300, sort: "-createdAt" })` → 14-day area chart (`AreaChart.tsx`) + recent movements feed, cached under `["movements","recent"]`.

## 6. Conventions

- **One API module per resource**, exporting `xxxApi` objects with `list/get/create/update/remove` (+ resource-specific actions like `purchasesApi.receive/cancel`).
- **Pages** are flat components in `src/pages/`; **admin** pages in `src/pages/admin/`; **auth** pages in `src/pages/auth/`. Create/edit **modals live in `src/components/forms/*FormModal.tsx`** (extracted Task 20) — pages hold list/filter/action logic only.
- **UI** is composed from the `src/components/ui/` kit; pages rarely use raw HTML for controls.
- `cn(...)` (clsx + tailwind-merge) is the standard class combiner.
