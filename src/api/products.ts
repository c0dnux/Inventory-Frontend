import { api } from "../lib/api";
import type { DashboardStats, PageParams, Product } from "../types";

interface ProductListResponse {
  data: { products: Product[] };
  results?: number;
  totalCount?: number;
}

export interface ProductPayload {
  productName: string;
  description?: string;
  category: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  reorderLevel: number;
  status?: "active" | "inactive" | "discontinued";
}

export const productsApi = {
  list: async (params?: PageParams) => {
    const res = await api.get<ProductListResponse>("/products", { params });
    return {
      products: res.data.data.products,
      count: res.data.data.products.length,
      totalCount: res.data.totalCount ?? res.data.data.products.length,
    };
  },

  get: (id: string) =>
    api.get<{ data: { product: Product } }>(`/products/${id}`).then((r) => r.data.data.product),

  dashboard: () =>
    api.get<{ data: DashboardStats }>("/products/dashboard").then((r) => r.data.data),

  create: (payload: ProductPayload) =>
    api
      .post<{ data: { product: Product } }>("/products/create", payload, {
        skipErrorToast: true,
      })
      .then((r) => r.data.data.product),

  update: (id: string, payload: Partial<ProductPayload>) =>
    api
      .put<{ data: { product: Product } }>(`/products/${id}`, payload, {
        skipErrorToast: true,
      })
      .then((r) => r.data.data.product),

  remove: (id: string) => api.delete(`/products/${id}`, { skipErrorToast: true }),
};
