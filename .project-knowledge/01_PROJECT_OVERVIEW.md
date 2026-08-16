# Project Overview: StockPilot Frontend

## 1. Core Metadata

- **Project Name**: StockPilot (branded `stockpilot` in index.html)
- **Type**: SPA / Client for the Inventory Backend API
- **Runtime**: React 18 (`18.3.1`) + TypeScript (`5.6`, strict mode) + Vite (`5.4`)
- **Styling**: Tailwind CSS (`3.4`) with custom `tailwind.config.js` (TailAdmin-inspired palettes)
- **Data fetching**: TanStack Query v5 (`@tanstack/react-query`) + axios (`1.7`)
- **Routing**: React Router v6 (`6.26`)
- **Repo location**: `frontend/` inside the Inventory monorepo-style folder

## 2. Scripts (`frontend/package.json`)

- `npm run dev` → `vite` (dev server on port 3001)
- `npm run build` → `tsc --noEmit && vite build` (type-check + production build to `dist/`)
- `npm run preview` → `vite preview`
- `npm run lint` → ESLint 10 flat config (0 errors; `set-state-in-effect` + `react-refresh` at warn)
- `npm run format` / `format:check` → Prettier 3 (`--write` / check)
- `npm test` / `test:watch` → Vitest 4 + Testing Library (jsdom, setup `src/test/setup.ts`)

## 3. Environment Variables (`frontend/.env`, template in `.env.example`)

| Variable                | Default                 | Purpose                                                      |
| ----------------------- | ----------------------- | ------------------------------------------------------------ |
| `VITE_API_URL`          | `/api/v1`               | API base path the axios client uses (proxied by Vite in dev) |
| `VITE_PROXY_TARGET`     | `http://localhost:3000` | Backend origin the Vite dev-server proxies `/api` to         |
| `VITE_GOOGLE_CLIENT_ID` | _(empty)_               | Enables "Continue with Google" (Google Identity Services)    |

> Vite exposes these as `import.meta.env.VITE_*` at build time — there are no runtime env lookups.

## 4. Directory Structure

```text
frontend/
├── index.html                  # HTML shell, Google Fonts (Outfit), theme pre-paint script
├── vite.config.ts              # port 3001, /api proxy → VITE_PROXY_TARGET
├── tailwind.config.js          # brand/slate/semantic palettes, shadows, keyframes
├── tsconfig.json               # strict TS, bundler resolution, noEmit
├── eslint.config.js            # flat config (eslint 10, react-hooks v7, react-refresh)
├── .prettierrc.json / .prettierignore
├── vitest.config.ts            # jsdom + src/test/setup.ts
└── src/
    ├── main.tsx                # ReactDOM root + <App/>
    ├── App.tsx                 # Providers + route tree
    ├── index.css               # Tailwind layers, --n-* neutral vars, .dark overrides, .field/.label
    ├── api/                    # One module per backend resource (axios calls)
    │   ├── auth.ts  categories.ts  units.ts  suppliers.ts  products.ts
    │   ├── purchases.ts  adjustments.ts  movements.ts  notifications.ts
    │   ├── permissions.ts  roles.ts  audits.ts
    ├── auth/                   # AuthContext (state) + RequireAuth/RedirectIfAuthed guards
    ├── components/
    │   ├── auth/GoogleSignInButton.tsx   # GIS button (hidden w/o client id)
    │   ├── charts/AreaChart.tsx           # SVG stock-activity chart
    │   ├── common/ThemeToggleButton.tsx
    │   ├── forms/               # *FormModal.tsx per resource (extracted Task 20)
    │   │   └── Product, Purchase, Adjustment, Supplier, Category, Unit, Permission, Role
    │   ├── layout/AppLayout.tsx Sidebar.tsx Topbar.tsx NotificationBell.tsx
    │   └── ui/                  # Button, Card, Modal, Table, Form, Badge, Toast, Pagination, ...
    ├── config/branding.ts       # name, tagline, logoMark, currency, locale
    ├── context/SidebarContext.tsx ThemeContext.tsx
    ├── lib/api.ts               # axios instance + silent-refresh interceptor + default error toast + errorMessage()
    ├── lib/toast.ts             # React-free toast bus (interceptor → ToastProvider bridge)
    ├── lib/queryCache.ts        # optimistic cache helpers (optimisticPatch/Upsert/Remove + snapshot/rollback)
    ├── lib/csv.ts               # downloadCsv() (BOM + escaping) for list exports
    ├── lib/permissions.ts       # hasPermission()/roleName()/isSuperuser() + PERMISSIONS table
    ├── lib/format.ts            # cn(), formatCurrency/Number/Date, timeAgo, isOutgoingMovement
    ├── lib/useDebounce.ts       # 300ms debounce hook (search inputs)
    ├── pages/                   # feature pages (Products, Purchases, Dashboard, ...)
    │   ├── admin/               # Roles, Permissions, Audits (admin-only)
    │   └── auth/                # Login, Signup, Activate, Forgot/Reset Password, AuthLayout
    ├── test/setup.ts            # jest-dom matchers + RTL cleanup
    └── types/index.ts           # All shared domain interfaces
```

## 5. Key Dependencies

- **Runtime**: `react`, `react-dom`, `react-router-dom`, `@tanstack/react-query`, `axios`, `lucide-react` (icons), `clsx` + `tailwind-merge` (the `cn()` helper).
- **Dev**: `typescript`, `vite`, `@vitejs/plugin-react`, `tailwindcss`, `autoprefixer`, `postcss`, `@types/*`, `eslint` 10 + `typescript-eslint` + `eslint-plugin-react-hooks` (v7) + `eslint-plugin-react-refresh`, `prettier`, `vitest` 4 + `jsdom` + `@testing-library/react` + `@testing-library/jest-dom` + `@testing-library/user-event`.

## 6. Branding / Theming (how to restyle)

1. **Product identity** — `src/config/branding.ts`: `name`, `tagline`, `logoMark` (text monogram, used in Sidebar/AuthLayout), `description`, `currency`, `locale`. (`logoUrl` was removed in Task 20 — the monogram is the only logo.)
2. **Brand color** — `tailwind.config.js` `colors.brand` (static hex, indigo-blue). Used via `bg-brand-500`, `text-brand-600`, etc. Note: static brand tints need an explicit `dark:bg-brand-500/15 dark:text-brand-400` companion (see Notifications.tsx) — they do not auto-flip like `slate-*`.
3. **Neutral scale / dark mode** — `src/index.css` `--n-25 … --n-950` CSS variables; `.dark` redefines them. Tailwind's `slate-*` utilities map to these vars, so everything flips with the `.dark` class automatically.
4. **Semantic palettes** — `success`, `error`, `warning`, `blue-light`, `orange` (+ aliases `emerald`/`red`/`amber`/`sky`) all static hex in `tailwind.config.js`.
5. **Font** — Outfit loaded in `index.html`; `fontFamily.sans` in the Tailwind config.
