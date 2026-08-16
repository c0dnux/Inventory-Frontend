import { api } from "../lib/api";
import type { Category } from "../types";

interface CategoryListResponse {
  data: { categories: Category[] };
}

export interface CategoryPayload {
  name: string;
  description?: string;
  isActive?: boolean;
}

export const categoriesApi = {
  list: async (params?: { page?: number; limit?: number; sort?: string }) => {
    const res = await api.get<CategoryListResponse>("/categories", { params });
    return { categories: res.data.data.categories };
  },

  create: (payload: CategoryPayload) =>
    api
      .post<{ data: { category: Category } }>("/categories/create", payload, {
        skipErrorToast: true,
      })
      .then((r) => r.data.data.category),

  update: (id: string, payload: Partial<CategoryPayload>) =>
    api
      .put<{ data: { category: Category } }>(`/categories/${id}`, payload, {
        skipErrorToast: true,
      })
      .then((r) => r.data.data.category),

  remove: (id: string) => api.delete(`/categories/${id}`, { skipErrorToast: true }),
};
