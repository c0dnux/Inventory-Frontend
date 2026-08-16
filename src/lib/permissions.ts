import type { User } from "../types";

/**
 * Canonical permission matrix — mirrors `seeds/seed_permissions.js` on the
 * backend. Keyed by permission name (`resource:action`). `hasPermission` and
 * every gating call site use these names, so the resource/action strings can't
 * drift from the backend's matrix. Add/rename a permission here AND in the
 * backend seed together.
 */
export const PERMISSIONS = {
  "products:create": { resource: "products", action: "create" },
  "products:read": { resource: "products", action: "read" },
  "products:update": { resource: "products", action: "update" },
  "products:delete": { resource: "products", action: "delete" },
  "purchases:create": { resource: "purchases", action: "create" },
  "purchases:cancel": { resource: "purchases", action: "cancel" },
  "stock:adjust": { resource: "stock", action: "adjust" },
  "suppliers:manage": { resource: "suppliers", action: "manage" },
  "users:manage": { resource: "users", action: "manage" },
  "permissions:manage": { resource: "permissions", action: "manage" },
  "roles:manage": { resource: "roles", action: "manage" },
  "audits:read": { resource: "audits", action: "read" },
} as const satisfies Record<string, { resource: string; action: string }>;

export type PermissionName = keyof typeof PERMISSIONS;

/**
 * Single source of truth for implicit-superuser detection.
 * A role named "Admin" with no permissions recorded (e.g. before the seed
 * script runs) is treated as fully privileged. Every authorization decision
 * in the app funnels through `hasPermission`, which consults this — keep
 * Admin-detection logic here and nowhere else.
 */
export function isSuperuser(user: User | null | undefined): boolean {
  const role = user?.role;
  if (!role || typeof role === "string") return false;
  return role.name === "Admin" && !role.permissions?.length;
}

/** Check whether a user's role grants a named permission (e.g. "products:create"). */
export function hasPermission(user: User | null | undefined, permission: PermissionName): boolean {
  const role = user?.role;
  if (!role || typeof role === "string") return false;

  if (isSuperuser(user)) return true;

  const { resource, action } = PERMISSIONS[permission];
  return (role.permissions ?? []).some((p) => p.resource === resource && p.action === action);
}

export function roleName(user: User | null | undefined): string {
  const role = user?.role;
  if (!role) return "—";
  return typeof role === "string" ? "Unknown" : role.name;
}
