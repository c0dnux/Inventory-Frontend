import { api } from "../lib/api";
import type { Permission } from "../types";

interface PermissionListResponse {
  data: { permissions: Permission[] };
}

export interface PermissionPayload {
  name: string;
  resource: string;
  action: string;
  description?: string;
}

export const permissionsApi = {
  list: async () => {
    const res = await api.get<PermissionListResponse>("/permissions", {
      params: { limit: 100 },
    });
    return { permissions: res.data.data.permissions };
  },

  create: (payload: PermissionPayload) =>
    api
      .post<{ data: { permission: Permission } }>("/permissions/add-permission", payload, {
        skipErrorToast: true,
      })
      .then((r) => r.data.data.permission),

  update: (id: string, payload: Partial<PermissionPayload>) =>
    api
      .put<{ data: { permission: Permission } }>(`/permissions/${id}`, payload, {
        skipErrorToast: true,
      })
      .then((r) => r.data.data.permission),

  remove: (id: string) => api.delete(`/permissions/${id}`, { skipErrorToast: true }),
};
