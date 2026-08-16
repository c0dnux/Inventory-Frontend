# Pages & Routing

## 1. Route Table

### Public (redirected away if already authenticated — `RedirectIfAuthed`)

| Route              | Page                            | Purpose                                                                                           |
| ------------------ | ------------------------------- | ------------------------------------------------------------------------------------------------- |
| `/login`           | `pages/auth/Login.tsx`          | Email+password sign in; "Continue with Google" via GIS; redirects to `location.state.from` or `/` |
| `/signup`          | `pages/auth/Signup.tsx`         | Local account creation (backend always assigns Staff role)                                        |
| `/activate`        | `pages/auth/Activate.tsx`       | Enter 6-digit code from email                                                                     |
| `/forgot-password` | `pages/auth/ForgotPassword.tsx` | Request reset code                                                                                |
| `/reset-password`  | `pages/auth/ResetPassword.tsx`  | Code + new password                                                                               |
| _(all wrapped in)_ | `pages/auth/AuthLayout.tsx`     | Branded centered layout                                                                           |

### Protected (`RequireAuth` → `AppLayout` sidebar/topbar)

| Route                | Page                          | Notes                                                |
| -------------------- | ----------------------------- | ---------------------------------------------------- |
| `/`                  | `pages/Dashboard.tsx`         | Client-side stats from products + movements          |
| `/products`          | `pages/Products.tsx`          | Full CRUD; search (debounced `?search=`); modal form |
| `/purchases`         | `pages/Purchases.tsx`         | List, create (multi-line items), receive, cancel     |
| `/suppliers`         | `pages/Suppliers.tsx`         | CRUD; nav item hidden unless `suppliers:manage`      |
| `/adjustments`       | `pages/Adjustments.tsx`       | Manual stock adjustments (stock_in/out/adjust)       |
| `/movements`         | `pages/Movements.tsx`         | Read-only ledger                                     |
| `/notifications`     | `pages/Notifications.tsx`     | List + mark read/all-read                            |
| `/categories`        | `pages/Categories.tsx`        | CRUD                                                 |
| `/units`             | `pages/Units.tsx`             | CRUD                                                 |
| `/profile`           | `pages/Profile.tsx`           | Profile + change password (`/auth/update-password`)  |
| `/admin/roles`       | `pages/admin/Roles.tsx`       | Role CRUD + permission assignment                    |
| `/admin/permissions` | `pages/admin/Permissions.tsx` | Permission CRUD                                      |
| `/admin/audits`      | `pages/admin/Audits.tsx`      | Read-only audit log                                  |

### Fallbacks

| Route  | Behavior                   |
| ------ | -------------------------- |
| `/404` | `pages/NotFound.tsx`       |
| `*`    | `Navigate to /404 replace` |

## 2. Route Guards

- `RequireAuth` (`src/auth/RequireAuth.tsx`): if `loading` → `<FullPageLoader/>`; if no `user` → `<Navigate to="/login" state={{from}} replace/>`; else renders `<Outlet/>`.
- `RedirectIfAuthed`: if `user` → `<Navigate to="/" replace/>` (keeps authed users off auth screens).

## 3. Layout Components (`src/components/layout/`)

- **AppLayout.tsx** — `SidebarProvider` + collapsible sidebar + `Topbar` + `<main>` outlet.
- **Sidebar.tsx** — nav menus ("Menu" + "System"), **items filtered by `hasPermission(user, <permission>)`**:
  - Suppliers → `suppliers:manage`
  - Admin: Roles → `roles:manage`, Permissions → `permissions:manage`, Audits → `audits:read`
  - All other items (Dashboard, Products, Purchases, Adjustments, Movements, Categories, Units, Notifications, Profile) always shown.
  - Collapses to icon rail (90px) / expands (290px) / mobile overlay.
- **Topbar.tsx** — controlled search box (Enter → navigate to `/products?search=<q>`, synced with the Products page), theme toggle, notification bell, user menu.
- **NotificationBell.tsx** — dropdown, polls `notificationsApi.list({limit:8})` every **30s** (`refetchInterval`), unread badge, "Mark all read".

## 4. Permission Gating on Actions

Pages gate action buttons too (e.g. Products create/edit/delete via `hasPermission(user, "products:create"|"update"|"delete")` — typed keys from the `PERMISSIONS` table). This is UX-only — the backend enforces the same checks server-side.

## 5. Notable page behavior

- **Products**: `useDebounce` search input → `?search=`, `Pagination` (page size 15), create/edit `Modal` + `ConfirmDialog` for delete, and an **"Export CSV"** button (fetch all matches with `limit: 10000` + current filters → `lib/csv.ts` `downloadCsv`).
- **Purchases**: search by reference + status filter; create via `PurchaseFormModal` (line-item rows now labeled — header row "Product / Qty / Unit cost / Total" + caption explaining "unit cost = price per single unit, line total = quantity × unit cost"); **eye icon on every row opens a detail modal** (reference, supplier, date, status badge, note, cancel reason if cancelled, line-item table with product name + SKU / qty / unit cost / line total, grand total). Receive/Cancel confirmations unchanged.
- **Notifications**: unread rows are tinted (`bg-brand-50/50 dark:bg-brand-500/10`) with a brand icon chip (`dark:bg-brand-500/15 dark:text-brand-400`) and a "Mark read" button.
- **All list pages**: create/edit modals live in `src/components/forms/*FormModal.tsx` (extracted in Task 20); pages hold list/filter logic only.
- **Dashboard**: stats cards + low/out-of-stock table come from `GET /products/dashboard` (`productsApi.dashboard()`); the 14-day chart + recent feed come from `movementsApi.list`.
- **Auth pages**: toast + inline `FieldError` validation; Google button auto-hides without `VITE_GOOGLE_CLIENT_ID`.
