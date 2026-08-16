/**
 * Brand configuration.
 *
 * This file is the single place to change the product's identity (name, logo,
 * tagline). The color palette itself is driven by the `--brand-*` CSS
 * variables in `src/index.css` — update those to restyle the whole app.
 */
export const brand = {
  /** Product / application name shown in the sidebar, title and login screen. */
  name: "StockPilot",
  /** Short subtitle. */
  tagline: "Inventory Management System",
  /** One or two characters used as the logo mark (no image logo is supported). */
  logoMark: "SP",
  /** Shown on the login screen. */
  description: "Track products, purchases and stock levels from one clean dashboard.",
  /** Currency used to format money values (ISO 4217). */
  currency: "USD",
  /** Locale used for currency/date formatting. */
  locale: "en-US",
} as const;
