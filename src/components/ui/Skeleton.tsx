import { cn } from "../../lib/format";
import { Table, THead, Th, TBody, Tr, Td } from "./Table";

type Column = string | { label?: string; align?: "left" | "right" };

const toCol = (c: Column) =>
  typeof c === "string"
    ? { label: c, align: "left" as const }
    : { label: c.label, align: c.align ?? ("left" as const) };

/** Pulsing placeholder block. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-md bg-slate-200 dark:bg-gray-800", className)}
    />
  );
}

/** Skeleton list rows (notifications feed etc.). */
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <ul
      className="divide-y divide-slate-100 dark:divide-gray-800"
      aria-busy="true"
      aria-label="Loading list"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex items-start gap-4 px-5 py-4">
          <Skeleton className="mt-0.5 h-10 w-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3.5 w-full max-w-md" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-8 w-16 shrink-0" />
        </li>
      ))}
    </ul>
  );
}

/** Skeleton cards in a responsive grid (roles page). */
export function CardGridSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
      aria-busy="true"
      aria-label="Loading cards"
    >
      {Array.from({ length: cards }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="flex items-start justify-between">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="flex gap-1">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
          <Skeleton className="mt-4 h-5 w-32" />
          <Skeleton className="mt-2 h-3.5 w-full" />
          <Skeleton className="mt-1 h-3.5 w-3/4" />
          <div className="mt-4 space-y-2">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ columns, rows = 5 }: { columns: Column[]; rows?: number }) {
  const cols = columns.map(toCol);
  return (
    <div aria-busy="true" aria-label="Loading table">
      <Table>
        <THead>
          {cols.map((c, i) => (
            <Th key={i} className={c.align === "right" ? "text-right" : undefined}>
              {c.label ?? ""}
            </Th>
          ))}
        </THead>
        <TBody>
          {Array.from({ length: rows }).map((_, r) => (
            <Tr key={r}>
              {cols.map((c, i) => (
                <Td key={i} className={c.align === "right" ? "text-right" : undefined}>
                  <Skeleton className={cn("h-4", c.align === "right" ? "ml-auto w-16" : "w-28")} />
                </Td>
              ))}
            </Tr>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
