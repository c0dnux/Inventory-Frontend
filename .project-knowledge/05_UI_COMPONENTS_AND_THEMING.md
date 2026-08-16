# UI Components, Theming & Layout

## 1. UI Kit (`src/components/ui/`)

| Component           | Purpose                                                                                                                                                                                                        |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button.tsx`        | Variants/sizes/loading spinner                                                                                                                                                                                 |
| `Card.tsx`          | `Card` / `CardHeader` / `CardContent`                                                                                                                                                                          |
| `Badge.tsx`         | Status badges + `statusVariant(type)` mapping                                                                                                                                                                  |
| `Table.tsx`         | `Table` / `THead` / `Th` / `TBody` / `Tr` / `Td`                                                                                                                                                               |
| `Form.tsx`          | `Input`, `PasswordInput`, `Select`, `Label`, `FieldError` (+ `.field`/`.label` CSS classes)                                                                                                                    |
| `Modal.tsx`         | Dialog with size/footer, `animate-scale-in`                                                                                                                                                                    |
| `ConfirmDialog.tsx` | Delete confirmation                                                                                                                                                                                            |
| `Toast.tsx`         | `ToastProvider` + `useToast()` (`toast(variant, msg)`)                                                                                                                                                         |
| `Pagination.tsx`    | Page controls (used with `totalCount`)                                                                                                                                                                         |
| `StatCard.tsx`      | Dashboard metric cards                                                                                                                                                                                         |
| `PageHeader.tsx`    | Page title + description                                                                                                                                                                                       |
| `Loader.tsx`        | `FullPageLoader`, `InlineLoader`, `Spinner` (Dashboard still uses `InlineLoader`)                                                                                                                              |
| `Skeleton.tsx`      | `Skeleton` (pulse block), `TableSkeleton` (rows × columns mirroring a page's table), `ListSkeleton` (notifications feed), `CardGridSkeleton` (roles cards) — used by every list page instead of `InlineLoader` |
| `EmptyState.tsx`    | Empty list placeholder                                                                                                                                                                                         |
| `Pagination.tsx`    | Page controls                                                                                                                                                                                                  |

## 2. Layout

- **AppLayout** (`components/layout/AppLayout.tsx`): `SidebarProvider` wraps `Sidebar` + `Topbar` + `<main className="mx-auto max-w-[1536px] p-4 md:p-6">`.
- **Sidebar** (`Sidebar.tsx`): fixed left rail; states = expanded (290px), collapsed icon rail (90px), hover-expand, mobile overlay; nav filtered by permissions (see `03_PAGES_AND_ROUTING.md`).
- **Topbar** (`Topbar.tsx`): hamburger (mobile), page chrome, `ThemeToggleButton`, `NotificationBell`, user menu.
- **NotificationBell**: dropdown panel; polls every 30s; "Mark all read".

## 3. Theming System

- **Dark mode**: `ThemeContext` (`src/context/ThemeContext.tsx`) persists `localStorage["theme"]`, toggles `.dark` on `<html>`. `index.html` has a pre-paint script so no flash of wrong theme. Theme persistence uses a lazy `useState` initializer (no sync effect); one effect applies the class + saves.
- **Neutral scale**: `--n-25 … --n-950` in `src/index.css` (light values in `:root`, dark values in `.dark`). Tailwind `slate-*` utilities map to these (`rgb(var(--n-NN) / <alpha-value>)`), so **all `slate-*` classes auto-flip** with dark mode.
- **Brand color**: `colors.brand` (indigo-blue) in `tailwind.config.js` — **static hex, not a CSS variable** (unlike the README's earlier `--brand-*` claim). Change palette here.
- **Semantic palettes**: `success`/`error`/`warning`/`blue-light`/`orange` + aliases (`emerald`→success, `red`→error, `amber`→warning, `sky`→blue-light).
- **Gray**: static TailAdmin palette in config (deliberately NOT dark-aware — `dark:bg-gray-900` etc. are explicit). Verified (Task 20): `gray-*` is only ever used `dark:`-prefixed; `slate-*`/`--n-*` governs all themable surfaces. Do not point `gray` at the flipping tokens.
- **Static brand tints need explicit dark companions**: `brand-*` is static hex, so any `bg-brand-50/100`, `text-brand-600`, etc. must pair with `dark:bg-brand-500/15 dark:text-brand-400` (pattern in Notifications.tsx unread rows + auth pages). `slate-*`/semantic palettes auto-flip.
- **Fonts/shadows/animations**: Outfit font, `shadow-theme-xs…xl`, keyframes `fade-in`/`slide-up`/`scale-in`/`slide-in-right`.

## 4. Formatting Helpers (`src/lib/format.ts`)

- `cn(...)` — clsx + tailwind-merge.
- `formatCurrency`, `formatNumber` — `Intl.NumberFormat` using `brand.locale`/`brand.currency`.
- `formatDate`, `formatDateTime`, `timeAgo` — date display helpers.
- `isOutgoingMovement(type)` — true for `stock_out`, `adjustment_out` (drives +/- arrows on Dashboard).
- `useDebounce(value, 300)` — search inputs.

## 5. Tooling (Task 20)

- **Lint**: ESLint 10 flat config (`eslint.config.js`) — `npm run lint` (0 errors; `set-state-in-effect` + `react-refresh` at warn).
- **Format**: Prettier 3 (`npm run format` / `format:check`).
- **Tests**: Vitest 4 + Testing Library + jsdom (`npm test` / `test:watch`). Config: `vitest.config.ts`, setup `src/test/setup.ts`. Existing suites: `lib/queryCache`, `lib/permissions`, `lib/format`, `components/ui/Pagination` (21 tests).

## 6. Charts

- `components/charts/AreaChart.tsx` — lightweight SVG area chart fed by `{label, value}[]` (14-day stock activity). No chart library dependency.
