import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { brand } from "../../config/branding";
import { BarChart3, BellRing, PackageSearch } from "lucide-react";

function BrandPanel() {
  return (
    <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-950 lg:flex lg:w-1/2">
      {/* subtle grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-500/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 h-[28rem] w-[28rem] rounded-full bg-blue-light-500/20 blur-3xl" />

      <div className="relative z-10 flex items-center gap-3 p-10">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-sm font-bold text-white">
          {brand.logoMark}
        </span>
        <div>
          <p className="text-lg font-bold text-white">{brand.name}</p>
          <p className="text-xs font-medium text-brand-300">{brand.tagline}</p>
        </div>
      </div>

      <div className="relative z-10 space-y-8 p-10">
        <h2 className="max-w-md text-3xl font-bold leading-tight text-white">
          Everything in stock, perfectly in sync.
        </h2>
        <div className="space-y-4">
          {[
            {
              icon: PackageSearch,
              title: "Real-time stock levels",
              text: "Know exactly what's on your shelves at any moment.",
            },
            {
              icon: BellRing,
              title: "Smart stock alerts",
              text: "Get notified the moment items run low or go out of stock.",
            },
            {
              icon: BarChart3,
              title: "Clear oversight",
              text: "Purchases, movements and audit trails in one place.",
            },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-brand-300">
                <f.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{f.title}</p>
                <p className="text-sm text-brand-200/80">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="relative z-10 p-10 text-xs text-brand-300/70">
        © {new Date().getFullYear()} {brand.name}. All rights reserved.
      </p>
    </div>
  );
}

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-gray-900">
      <BrandPanel />

      {/* Form panel */}
      <div className="flex w-full items-center justify-center px-4 py-10 lg:w-1/2">
        <div className="w-full max-w-md">
          <Link to="/login" className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-sm font-bold text-white">
              {brand.logoMark}
            </span>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">{brand.name}</p>
              <p className="text-xs text-slate-500 dark:text-gray-400">{brand.tagline}</p>
            </div>
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
