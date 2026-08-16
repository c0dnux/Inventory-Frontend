import { api } from "../lib/api";
import type { Unit } from "../types";

interface UnitListResponse {
  data: { units: Unit[] };
}

export interface UnitPayload {
  name: string;
  abbreviation: string;
  description?: string;
  isActive?: boolean;
}

export const unitsApi = {
  list: async (params?: { page?: number; limit?: number; sort?: string }) => {
    const res = await api.get<UnitListResponse>("/units", { params });
    return { units: res.data.data.units };
  },

  create: (payload: UnitPayload) =>
    api
      .post<{ data: { unit: Unit } }>("/units/create", payload, {
        skipErrorToast: true,
      })
      .then((r) => r.data.data.unit),

  update: (id: string, payload: Partial<UnitPayload>) =>
    api
      .put<{ data: { unit: Unit } }>(`/units/${id}`, payload, {
        skipErrorToast: true,
      })
      .then((r) => r.data.data.unit),

  remove: (id: string) => api.delete(`/units/${id}`, { skipErrorToast: true }),
};
