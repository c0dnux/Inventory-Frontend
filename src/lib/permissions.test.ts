import { describe, it, expect } from "vitest";
import { isSuperuser, hasPermission, roleName, PERMISSIONS } from "./permissions";
import type { User } from "../types";

function userWith(role: unknown): User {
  return { role } as unknown as User;
}

describe("permissions", () => {
  it("treats an Admin role with no permissions as superuser", () => {
    expect(isSuperuser(userWith({ name: "Admin", permissions: [] }))).toBe(true);
    expect(isSuperuser(userWith({ name: "Manager", permissions: [] }))).toBe(false);
    expect(
      isSuperuser(
        userWith({ name: "Admin", permissions: [{ resource: "products", action: "read" }] }),
      ),
    ).toBe(false);
    expect(isSuperuser(userWith("Admin"))).toBe(false);
  });

  it("grants permission when the role's matrix contains the resource+action pair", () => {
    const user = userWith({
      name: "Manager",
      permissions: [{ resource: "products", action: "create" }],
    });
    expect(hasPermission(user, "products:create")).toBe(true);
    expect(hasPermission(user, "products:delete")).toBe(false);
  });

  it("grants every permission to a superuser", () => {
    const user = userWith({ name: "Admin", permissions: [] });
    expect(hasPermission(user, "roles:manage")).toBe(true);
    expect(hasPermission(user, "audits:read")).toBe(true);
  });

  it("rejects users without a role object", () => {
    expect(hasPermission(userWith(null), "products:read")).toBe(false);
    expect(hasPermission(userWith(undefined), "products:read")).toBe(false);
    expect(hasPermission(null, "products:read")).toBe(false);
  });

  it("exposes the full permission matrix", () => {
    expect(Object.keys(PERMISSIONS)).toHaveLength(12);
    expect(PERMISSIONS["stock:adjust"]).toEqual({ resource: "stock", action: "adjust" });
  });

  it("returns the role name for display", () => {
    expect(roleName(userWith({ name: "Staff", permissions: [] }))).toBe("Staff");
    expect(roleName(userWith("Admin"))).toBe("Unknown");
    expect(roleName(userWith(null))).toBe("—");
  });
});
