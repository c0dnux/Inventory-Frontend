import type { QueryClient, QueryKey } from "@tanstack/react-query";

/**
 * Optimistic-update helpers for cached list queries (`["products", ...]`,
 * `["adjustments", ...]`, ...). Each list query's data carries the collection
 * under its own key (`{ products, totalCount }`), and a partial
 * `{ queryKey: [key] }` matcher touches every variant of that collection in
 * the cache (paginated lists, dropdowns, ...). Queries with a different shape
 * (e.g. the dashboard's `["products","dashboard"]`) are left untouched.
 */

type CachedList = Record<string, unknown> & { totalCount?: number };

/** Replace items in-place (by `_id`) across every cached variant of `key`. */
export function optimisticPatch<T extends { _id: string }>(
  queryClient: QueryClient,
  key: string,
  apply: (item: T) => T,
): void {
  queryClient.setQueriesData({ queryKey: [key], type: "all" }, (old) => {
    if (!old || typeof old !== "object") return old;
    const data = old as CachedList;
    if (!Array.isArray(data[key])) return old;
    return { ...data, [key]: (data[key] as T[]).map(apply) };
  });
}

/** Insert `item` (front of list) or replace the existing `_id` match. */
export function optimisticUpsert<T extends { _id: string }>(
  queryClient: QueryClient,
  key: string,
  item: T,
): void {
  queryClient.setQueriesData({ queryKey: [key], type: "all" }, (old) => {
    if (!old || typeof old !== "object") return old;
    const data = old as CachedList;
    if (!Array.isArray(data[key])) return old;
    const items = data[key] as T[];
    const idx = items.findIndex((i) => i._id === item._id);
    if (idx >= 0) {
      const next = items.slice();
      next[idx] = item;
      return { ...data, [key]: next };
    }
    return { ...data, [key]: [item, ...items] };
  });
}

/** Remove an item by `_id` and decrement `totalCount` (if present). */
export function optimisticRemove<T extends { _id: string }>(
  queryClient: QueryClient,
  key: string,
  id: string,
): void {
  queryClient.setQueriesData({ queryKey: [key], type: "all" }, (old) => {
    if (!old || typeof old !== "object") return old;
    const data = old as CachedList;
    if (!Array.isArray(data[key])) return old;
    const items = data[key] as T[];
    const next = items.filter((i) => i._id !== id);
    if (next.length === items.length) return old;
    const { totalCount } = data;
    return {
      ...data,
      [key]: next,
      ...(typeof totalCount === "number" ? { totalCount: Math.max(0, totalCount - 1) } : {}),
    };
  });
}

/** Snapshot every cached variant of `key` for rollback on error. */
export function snapshotQueries(queryClient: QueryClient, key: string): Array<[QueryKey, unknown]> {
  return queryClient.getQueriesData({ queryKey: [key], type: "all" });
}

/** Restore a snapshot (rollback). */
export function restoreQueries(
  queryClient: QueryClient,
  snapshot: Array<[QueryKey, unknown]>,
): void {
  for (const [queryKey, data] of snapshot) {
    queryClient.setQueryData(queryKey, data);
  }
}
