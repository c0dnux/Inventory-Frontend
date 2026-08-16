import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/format";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "brand",
  hint,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "brand" | "success" | "warning" | "danger";
  hint?: string;
}) {
  const tones = {
    brand: "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400",
    success: "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500",
    warning: "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400",
    danger: "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500",
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs transition hover:shadow-theme-md dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="flex items-center justify-between">
        <span className={cn("flex h-12 w-12 items-center justify-center rounded-xl", tones[tone])}>
          <Icon className="h-6 w-6" />
        </span>
      </div>
      <div className="mt-5 flex items-end justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-gray-400">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-800 dark:text-white/90">
            {value}
          </p>
        </div>
      </div>
      {hint && <p className="mt-1 text-xs text-slate-400 dark:text-gray-400">{hint}</p>}
    </div>
  );
}
