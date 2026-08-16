import { api } from "../lib/api";
import type { Role } from "../types";

interface RoleListResponse {
  data: { roles: Role[] };
}

export interface RolePayload {
  name: string;
  description?: string;
  permissions: string[];
  isActive?: boolean;
}

export const rolesApi = {
  list: async () => {
    const res = await api.get<RoleListResponse>("/roles", { params: { limit: 50 } });
    return { roles: res.data.data.roles };
  },

  create: (payload: RolePayload) =>
    api
      .post<{ data: { role: Role } }>("/roles/create", payload, {
        skipErrorToast: true,
      })
      .then((r) => r.data.data.role),

  update: (id: string, payload: Partial<RolePayload>) =>
    api
      .put<{ data: { role: Role } }>(`/roles/${id}`, payload, {
        skipErrorToast: true,
      })
      .then((r) => r.data.data.role),

  remove: (id: string) => api.delete(`/roles/${id}`, { skipErrorToast: true }),
};
