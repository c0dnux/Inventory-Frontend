import { api } from "../lib/api";
import type { PageParams, StockMovement } from "../types";

interface MovementListResponse {
  data: { movements: StockMovement[] };
  totalCount?: number;
}

export const movementsApi = {
  list: async (params?: PageParams) => {
    const res = await api.get<MovementListResponse>("/movements", { params });
    return {
      movements: res.data.data.movements,
      totalCount: res.data.totalCount ?? res.data.data.movements.length,
    };
  },

  get: (id: string) =>
    api
      .get<{ data: { movement: StockMovement } }>(`/movements/${id}`)
      .then((r) => r.data.data.movement),
};
