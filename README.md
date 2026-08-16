# StockPilot — Frontend

React + TypeScript + Tailwind frontend for the Inventory backend API.

## Quick start

Backend first (in the repo root):

```bash
npm install
npm run seed        # one-time: creates default roles/permissions
npm run start:dev   # NODE_ENV=development → uses local MongoDB
```

Then the frontend (this folder):

```bash
npm install
npm run dev         # serves at http://localhost:3001
```

The Vite dev server proxies `/api` to the backend so **no CORS changes are
needed in development**. The proxy target defaults to `http://localhost:3000`
and is configurable in `.env`:

| Variable                | Default                 | Purpose                                          |
| ----------------------- | ----------------------- | ------------------------------------------------ |
| `VITE_API_URL`          | `/api/v1`               | API base path the axios client uses              |
| `VITE_PROXY_TARGET`     | `http://localhost:3000` | Backend origin the Vite proxy forwards `/api` to |
| `VITE_GOOGLE_CLIENT_ID` | _(empty)_               | Enables "Continue with Google" when set          |

## Branding / theming

Everything brand-related lives in two clearly marked places:

1. **`src/config/branding.ts`** — product name, tagline, logo, logo mark,
   currency and locale.
2. **`src/index.css`** — the `--brand-*` CSS variables (the color palette).
   `tailwind.config.js` maps Tailwind's `brand.*` utility classes to these
   variables, so changing the palette restyles the entire app.

## Auth model

- The backend sets httpOnly cookies (`jwt` access + `jwt_refresh` refresh).
  `axios` uses `withCredentials`, so the browser handles cookies automatically.
- On a `401`, an interceptor calls `POST /api/v1/auth/refresh` and retries the
  request; if refresh fails the user is signed out.
- UI actions (buttons, menu items) are gated by the user's `role.permissions`
  using `hasPermission(user, resource, action)` in `src/lib/permissions.ts`.

## Notes on the backend

- Run `npm run seed` once so the default roles (Admin / Manager / Staff) and
  the permission matrix exist before creating users.
- If the backend is on a port other than 3000, update `VITE_PROXY_TARGET` (and
  start the backend with `CORS_ORIGIN=http://localhost:3001` only if you call
  the API directly instead of through the proxy).
