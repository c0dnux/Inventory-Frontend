import { api } from "../lib/api";
import type { PageParams, Purchase } from "../types";

interface PurchaseListResponse {
  data: { purchases: Purchase[] };
  totalCount?: number;
}

export interface PurchaseItemPayload {
  product: string;
  quantity: number;
  unitCost: number;
}

export interface PurchasePayload {
  supplier: string;
  items: PurchaseItemPayload[];
  note?: string;
}

export const purchasesApi = {
  list: async (params?: PageParams) => {
    const res = await api.get<PurchaseListResponse>("/purchases", { params });
    return {
      purchases: res.data.data.purchases,
      totalCount: res.data.totalCount ?? res.data.data.purchases.length,
    };
  },

  get: (id: string) =>
    api.get<{ data: { purchase: Purchase } }>(`/purchases/${id}`).then((r) => r.data.data.purchase),

  create: (payload: PurchasePayload) =>
    api
      .post<{ data: { purchase: Purchase } }>("/purchases/make", payload, {
        skipErrorToast: true,
      })
      .then((r) => r.data.data.purchase),

  receive: (purchaseId: string) =>
    api
      .post<{ data: { purchase: Purchase } }>(
        "/purchases/receive",
        { purchaseId },
        { skipErrorToast: true },
      )
      .then((r) => r.data.data.purchase),

  cancel: (purchaseId: string, cancelReason: string) =>
    api
      .post<{ data: { purchase: Purchase } }>(
        "/purchases/cancel",
        { purchaseId, cancelReason },
        { skipErrorToast: true },
      )
      .then((r) => r.data.data.purchase),
};
