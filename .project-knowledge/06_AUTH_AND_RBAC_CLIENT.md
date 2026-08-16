# Authentication & Client-Side RBAC

## 1. Auth State (`src/auth/AuthContext.tsx`)

`AuthProvider` exposes:

- `user: User | null`, `token: string | null`, `loading: boolean`
- `login(email, password)`, `signup(payload)`, `activate(token)` (the 6-digit code), `loginWithGoogle(credential)`
- `forgotPassword(email)`, `resetPassword(email, code, newPassword)`, `updatePassword(currentPassword, newPassword)`
- `logout()`, `setUser(user)`

**Hydration**: on mount → `authApi.profile()` (`POST /auth/profile`). On success `setUser(data.user)`. Because cookies are httpOnly, the axios interceptor handles 401s transparently; on refresh failure it fires `window.dispatchEvent(new CustomEvent("auth:logout"))`, which clears the session (app stays logged-out until next profile fetch fails → app shows login).

## 2. Silent Refresh Flow (`src/lib/api.ts`)

1. Any request returns `401` (and the URL isn't `/auth/refresh` or a public auth route).
2. First 401: `isRefreshing = true`, calls `POST /auth/refresh`.
3. Concurrent 401s push their configs into `failedQueue`; after refresh success they're retried with `Authorization` headers copied.
4. Refresh success → reset `isRefreshing`, drain queue; refresh failure → dispatch `auth:logout`, reset queue, reject.
5. **Public auth routes exempt** so login/signup/activate don't trigger the refresh cascade.

> The `jwt_refresh` cookie is path-scoped to `/api/v1/auth`, so only refresh/profile/update-password requests send it. A full-page navigation still works because the `jwt` cookie applies to the whole `/api/v1` path.

## 3. Permission Model (client mirror)

`src/lib/permissions.ts`:

- `PERMISSIONS`: canonical permission table keyed by name (`products:create` → `{ resource, action }`) — mirrors `seeds/seed_permissions.js`; add/rename a permission in BOTH files together. `PermissionName = keyof typeof PERMISSIONS`.
- `hasPermission(user, permission: PermissionName)`: false when no user/role; delegates to `isSuperuser`, otherwise looks up the name in `PERMISSIONS` and matches `role.permissions` for `resource` + `action`. **Typed key — unknown permission names are compile errors**, so call sites can't drift from the matrix.
- `isSuperuser(user)`: **single source of truth** for implicit-superuser detection — true when role is `Admin` AND `role.permissions` is empty (pre-seed safety net). All other checks call this; keep Admin-detection logic here and nowhere else.
- `roleName(user)` → `user.role?.name` (handles string vs object role).
- **No separate route-level `role.name === "Admin"` check exists** — `/admin/*` routes and the sidebar are all gated via `hasPermission` (Admin-with-empty-permissions gets full UI access; the backend `authorize` stays strict, so an unseeded Admin gets 403s from the API until the seed script runs).

## 4. Where Gating Applies

- **Sidebar nav items** — filtered by `hasPermission` (Suppliers → `suppliers:manage`; Admin → `roles:manage` / `permissions:manage` / `audits:read`).
- **Page action buttons** — e.g. Products: create/edit/delete gated by `products:create|update|delete`.
- **Server re-checks everything** — client gating is UX only.

## 5. Google Sign-In (`src/components/auth/GoogleSignInButton.tsx`)

- Loads Google Identity Services (`https://accounts.google.com/gsi/client`) and renders a GIS button.
- **Hidden entirely unless `VITE_GOOGLE_CLIENT_ID` is set** (dev default has no client id).
- Calls `authApi.google({ credential })` → backend validates + links/creates account.
