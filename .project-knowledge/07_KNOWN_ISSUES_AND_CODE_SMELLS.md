# Known Issues, Gaps & Code Smells

## 1. Current Known Issues

1. **[MITIGATED, Task 5]** `?search=` works only for Products. The backend `APIFeatures.search` builds a Mongo `$text` query and only `Product` has a text index; since Task 5 the backend **drops `search` silently** for models without a text index (no more 500), so the frontend still only exposes search on Products — a `?search=` on other resources is simply ignored.
2. **[FIXED, Task 2] `DashboardStats` type was declared but unused** — the dashboard now consumes `GET /products/dashboard` (`productsApi.dashboard()`), which returns `DashboardStats` including `lowStockProducts` for the low/out-of-stock table.
3. **[FIXED, Task 3] Purchase receive/cancel lack server-side transactionality** — `receivePurchaseOrder` and `adjustStock` are now wrapped in `mongoose.startSession().withTransaction()` (sequential item processing; stock/movements/audits/notifications share the session). Cancel is pending-only and writes no movements (Task 4).
4. **[RESOLVED] `isOutgoingMovement` included `purchase_cancel`** — the backend never records that movement type (cancel only applies to pending POs). Removed from the outgoing set so the arrow logic and the backend schema agree.
5. **`totalCount` is optional in responses.** The frontend falls back to array length, so server-driven pagination metadata isn't strictly required.
6. **Google Sign-In is a no-op without `VITE_GOOGLE_CLIENT_ID`** — button silently hidden; devs may think auth is broken.
7. **[FIXED, Task 14] Topbar search box is decorative** — now a controlled input; on Enter it navigates to `/products?search=<q>` and the Products page syncs its (debounced) search state from the `search` URL param bidirectionally (the page's own search box writes the param back).
8. **[FIXED, Task 15] No skeleton loaders** — every list page now renders a column-matching skeleton (`TableSkeleton`/`ListSkeleton`/`CardGridSkeleton` in `components/ui/Skeleton.tsx`) instead of `InlineLoader`; Dashboard keeps the spinner.
9. **[FIXED, Task 16] Admin detection was split** between a route-level `role.name === "Admin"` idea and the empty-permissions superuser check. There is no route-level check anymore — `isSuperuser()` in `lib/permissions.ts` is the single source of truth and `hasPermission` delegates to it.
10. **[FIXED, Task 17] Resource/action strings were hand-written at each `hasPermission` call site** — now the typed `PERMISSIONS` table (`lib/permissions.ts`) is the one source, `hasPermission(user, "products:create")` takes a `PermissionName` key, and unknown names fail `tsc`. Must still be kept in sync with `seeds/seed_permissions.js` (same `resource:action` naming).
11. **[FIXED, Task 18] Query failures were silent** — the axios response interceptor in `lib/api.ts` now shows a deduped default error toast for errors that reach the end unhandled (queries/reads). Mutations pass `{ skipErrorToast: true }` centrally in `src/api/*` since their call sites already toast custom messages; `NotificationBell`'s 30s poll opts out too. `emitToast`/`registerToast` in `lib/toast.ts` bridge non-React code to `ToastProvider`.
12. **[FIXED, Task 19] Every mutation invalidated the whole query (full refetch after every edit)** — Product edit/delete and the stock adjust mutation now use optimistic `useMutation` helpers (`lib/queryCache.ts`: `optimisticPatch`/`optimisticUpsert`/`optimisticRemove` + snapshot/rollback). Product stock after an adjustment is patched exactly (backend math, incl. `stockValue`/`isLowStock`/`isOutOfStock` virtuals) so `["products"]` is not refetched; adjustments/movements/notifications lists are still refetched on settle (small, non-reconstructible shape). Product create and the adjustments list insert deliberately stay on `invalidateQueries` (page placement depends on server sort/filters).
13. **[FIXED, Task 20] Lint/prettier/tests absent** — ESLint 10 flat config (`eslint.config.js`, `react-hooks` v7 recommended-latest + `react-refresh`; 0 errors / 14 warnings — `set-state-in-effect` downgraded to warn for intentional modal-reset & URL-sync patterns), Prettier 3 (`.prettierrc.json`, whole `src` reformatted), Vitest 4 + Testing Library + jsdom (`vitest.config.ts`, `src/test/setup.ts`). Coverage: `lib/queryCache`, `lib/permissions`, `lib/format`, `ui/Pagination` (21 tests).

## 2. Behavioral / Quirks

- Auth cookies are **httpOnly** — no token access from JS; debugging requires DevTools "Application → Cookies".
- `staleTime: 30s` + `refetchOnWindowFocus: false` means lists can be up to 30s stale after background mutations elsewhere.
- NotificationBell polls every 30s regardless of active route.
- `RedirectIfAuthed` forces authed users to `/` — visiting `/login` while authed just bounces.

## 3. Code Smells / Cleanup Opportunities

- Page components are large (400+ lines) — modal forms could be extracted into `src/components/forms/`. **[DONE in Task 20]** — all 8 inline modal forms now live in `src/components/forms/*FormModal.tsx` and pages only hold list/filter logic.
- `branding.ts` `logoUrl` — **[DONE in Task 20]** — field removed along with the dead `<img>` branches; only `logoMark` ("SP") renders in `Sidebar`/`AuthLayout`.

## 4. Missing Features (not yet in code)

- No frontend tests (Vitest/RTL) and no lint/prettier config. **[DONE in Task 20]** — see fixed item 13; more test files welcome (`npm test`).
- No pagination UI shared type-safety beyond `Pagination.tsx`.
- `DashboardStats` aggregate endpoint does not exist server-side.
- No CSV/export of lists. **[DONE in Task 20]** — `Products` page has an "Export CSV" button (`lib/csv.ts` → `downloadCsv`, honors current filters, BOM + escaping).
- No offline/PWA support.

## 5. Tech Debt Notes

- Tailwind 3.4 — no migration plan to v4.
- Vite future flags enabled in `App.tsx` (`v7_startTransition`, `v7_relativeSplatPath`) — React Router v7 upgrade path already prepared.
- **[VERIFIED, Task 20 — no action needed]** `index.css` `--n-*` neutral variables + static `gray` palette are **not** overlapping in usage: all 82 `gray-*` utilities are `dark:`-prefixed explicit TailAdmin overrides (`dark:bg-gray-900`, `dark:border-gray-800`, …), and every themable surface uses `slate-*` which maps to `rgb(var(--n-*))` and auto-flips in dark mode. This split is documented as intentional in `tailwind.config.js` (static gray must stay static — pointing it at the flipping tokens would turn `dark:bg-gray-900` into light).
