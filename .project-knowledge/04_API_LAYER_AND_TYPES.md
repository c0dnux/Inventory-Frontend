# API Layer & TypeScript Types

## 1. Axios Instance (`src/lib/api.ts`)

- `baseURL: import.meta.env.VITE_API_URL || "/api/v1"`.
- `withCredentials: true` — the browser attaches the httpOnly `jwt` / `jwt_refresh` cookies automatically; **no tokens are stored in JS**.
- Response interceptor: on `401` (excluding `/auth/refresh` and the public auth endpoints) it calls `POST /auth/refresh` once, queues concurrent 401s, and retries the original request. On refresh failure it dispatches `window` CustomEvent `auth:logout`. See `06_AUTH_AND_RBAC_CLIENT.md`.
- `errorMessage(err, fallback)` → `response.data.message` or `response.data.error` (string) or `err.message`.

## 2. API Modules (`src/api/*`) → Backend endpoints

All paths are relative to `/api/v1` and all requests are cookie-authenticated.

| Module             | Calls                                                                                                                                                                           | Notes                                                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth.ts`          | `POST /auth/login`, `/signup`, `/activate` (sends `{token}`), `/google`, `/refresh`, `/forget-password`, `/reset-password`, `/update-password`, `/logout`; `POST /auth/profile` | `updatePassword`/`profile` require auth (interceptor handles it)                                                                               |
| `products.ts`      | `GET /products`, `GET /products/dashboard`, `GET /products/:id`, `POST /products/create`, `PUT /products/:id`, `DELETE /products/:id`                                           | list passes `PageParams` (`?search`, `?page`, `?limit`, `?sort`…) → `{products, count, totalCount}`; `dashboard()` → `DashboardStats` (Task 2) |
| `purchases.ts`     | `GET /purchases`, `GET /purchases/:id`, `POST /purchases/make`, `POST /purchases/receive`, `POST /purchases/cancel`                                                             | `receive(purchaseId)`, `cancel(purchaseId, cancelReason)`                                                                                      |
| `suppliers.ts`     | `GET /suppliers`, `GET /suppliers/:id`, `POST /suppliers/create`, `PUT /suppliers/:id`, `DELETE /suppliers/:id`                                                                 |                                                                                                                                                |
| `adjustments.ts`   | `GET /adjustments`, `GET /adjustments/:id`, `POST /adjustments/adjust`                                                                                                          | `adjust({productId,type,quantity,reason,note})`                                                                                                |
| `movements.ts`     | `GET /movements`, `GET /movements/:id`                                                                                                                                          | read-only                                                                                                                                      |
| `notifications.ts` | `GET /notifications`, `GET /notifications/:id`, `POST /notifications/read`, `POST /notifications/all-read`                                                                      | `markRead(id)` sends `{id}`                                                                                                                    |
| `categories.ts`    | `GET /categories`, `POST /categories/create`, `PUT /categories/:id`, `DELETE /categories/:id`                                                                                   |                                                                                                                                                |
| `units.ts`         | `GET /units`, `POST /units/create`, `PUT /units/:id`, `DELETE /units/:id`                                                                                                       |                                                                                                                                                |
| `roles.ts`         | `GET /roles` (limit 50), `POST /roles/create`, `PUT /roles/:id`, `DELETE /roles/:id`                                                                                            | `RolePayload.permissions: string[]` (IDs)                                                                                                      |
| `permissions.ts`   | `GET /permissions` (limit 100), `POST /permissions/add-permission`, `PUT /permissions/:id`, `DELETE /permissions/:id`                                                           |                                                                                                                                                |
| `audits.ts`        | `GET /audits`                                                                                                                                                                   | read-only                                                                                                                                      |

List modules read the optional `totalCount` from the backend (added 2026-08-15) and fall back to `data.data.<items>.length`.

> **Error-toast convention (Task 18):** every mutation helper in `src/api/*` passes `{ skipErrorToast: true }` because the call site toasts its own message; the interceptor shows a default toast for unhandled query errors. `notificationsApi.list` accepts an extra config param so `NotificationBell`'s 30s poll opts out too. See `07_KNOWN_ISSUES_AND_CODE_SMELLS.md` item 11.

## 3. Shared Types (`src/types/index.ts`)

- `Permission { _id, name, resource, action, description? }`
- `Role { _id, name, description?, permissions: Permission[], isActive }`
- `User { _id, name, email, avatar?, role: Role | string, active }` — `role` may arrive as a string if not populated.
- `AuthResponse { status, token, message, data: { user } }`
- `Category`, `Unit`, `Supplier` (nested `address`), `Product` (with virtuals `isLowStock`, `isOutOfStock`, `stockValue`), `Purchase` + `PurchaseItem` + `PurchaseStatus`, `StockAdjustment` + `AdjustmentType`, `StockMovement`, `AppNotification`, `AuditLog`.
- `PageParams { page?, limit?, sort?, fields?, [key]: string|number|undefined }`
- `DashboardStats` — `totalProducts`, `totalStockValue`, `lowStockItems`, `outOfStockItems`, `lowStockProducts[]`; returned by `productsApi.dashboard()` and consumed by the Dashboard page (Task 2).

## 4. Data shapes worth knowing

- `Product.category` / `Product.unit` are **plain ObjectIds (strings)** in the type — not populated objects.
- `Purchase.supplier` / `createdBy` are strings (IDs); `PurchaseItem.product` is a string (ID). Pages build `Map`s from their side queries (suppliers list → supplier name; `["products","select"]` → product name/SKU) to render names — see the Purchases detail modal.
- The backend returns `totalCount` for products/purchases/suppliers/adjustments/movements/audits; the client falls back gracefully.
