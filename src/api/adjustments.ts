import { api } from "../lib/api";
import type { AdjustmentType, PageParams, StockAdjustment } from "../types";

interface AdjustmentListResponse {
  data: { adjustments: StockAdjustment[] };
  totalCount?: number;
}

export interface AdjustmentPayload {
  productId: string;
  type: AdjustmentType;
  quantity: number;
  reason: string;
  note?: string;
}

export const adjustmentsApi = {
  list: async (params?: PageParams) => {
    const res = await api.get<AdjustmentListResponse>("/adjustments", { params });
    return {
      adjustments: res.data.data.adjustments,
      totalCount: res.data.totalCount ?? res.data.data.adjustments.length,
    };
  },

  get: (id: string) =>
    api
      .get<{ data: { adjustment: StockAdjustment } }>(`/adjustments/${id}`)
      .then((r) => r.data.data.adjustment),

  adjust: (payload: AdjustmentPayload) =>
    api
      .post<{ data: { adjustment: StockAdjustment } }>("/adjustments/adjust", payload, {
        skipErrorToast: true,
      })
      .then((r) => r.data.data.adjustment),
};
