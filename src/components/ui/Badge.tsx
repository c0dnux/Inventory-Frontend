import type { ReactNode } from "react";
import { cn } from "../../lib/format";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral" | "brand";

const styles: Record<BadgeVariant, string> = {
  success: "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500",
  warning: "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400",
  danger: "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500",
  info: "bg-blue-light-50 text-blue-light-600 dark:bg-blue-light-500/15 dark:text-blue-light-500",
  neutral: "bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-white/80",
  brand: "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400",
};

export function Badge({
  children,
  variant = "neutral",
  className,
}: {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
        styles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function statusVariant(status: string): BadgeVariant {
  switch (status) {
    case "active":
    case "received":
      return "success";
    case "pending":
    case "inactive":
      return "warning";
    case "cancelled":
    case "discontinued":
      return "danger";
    default:
      return "neutral";
  }
}
