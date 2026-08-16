import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

export function EmptyState({
  title = "Nothing here yet",
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-gray-800 dark:text-gray-400">
        <Inbox className="h-6 w-6" />
      </div>
      <h3 className="mt-1 text-sm font-semibold text-slate-800 dark:text-white/90">{title}</h3>
      {description && (
        <p className="max-w-sm text-sm text-slate-500 dark:text-gray-400">{description}</p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
