import { api } from "../lib/api";
import type { PageParams, Supplier } from "../types";

interface SupplierListResponse {
  data: { suppliers: Supplier[] };
  totalCount?: number;
}

export interface SupplierPayload {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  isActive?: boolean;
}

export const suppliersApi = {
  list: async (params?: PageParams) => {
    const res = await api.get<SupplierListResponse>("/suppliers", { params });
    return {
      suppliers: res.data.data.suppliers,
      totalCount: res.data.totalCount ?? res.data.data.suppliers.length,
    };
  },

  get: (id: string) =>
    api.get<{ data: { supplier: Supplier } }>(`/suppliers/${id}`).then((r) => r.data.data.supplier),

  create: (payload: SupplierPayload) =>
    api
      .post<{ data: { supplier: Supplier } }>("/suppliers/create", payload, {
        skipErrorToast: true,
      })
      .then((r) => r.data.data.supplier),

  update: (id: string, payload: Partial<SupplierPayload>) =>
    api
      .put<{ data: { supplier: Supplier } }>(`/suppliers/${id}`, payload, {
        skipErrorToast: true,
      })
      .then((r) => r.data.data.supplier),

  remove: (id: string) => api.delete(`/suppliers/${id}`, { skipErrorToast: true }),
};
