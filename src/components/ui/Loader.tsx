import { Loader2 } from "lucide-react";
import { cn } from "../../lib/format";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-5 w-5 animate-spin", className)} />;
}

export function FullPageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-100 dark:bg-gray-900">
      <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-theme-md dark:bg-gray-900 dark:ring-1 dark:ring-gray-800">
        <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
        <span className="text-sm font-medium text-slate-600 dark:text-gray-400">{label}</span>
      </div>
    </div>
  );
}

export function InlineLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-slate-500 dark:text-gray-400">
      <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
