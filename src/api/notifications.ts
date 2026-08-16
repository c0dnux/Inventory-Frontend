import { api } from "../lib/api";
import type { AxiosRequestConfig } from "axios";
import type { AppNotification } from "../types";

interface NotificationListResponse {
  data: { notifications: AppNotification[] };
}

export const notificationsApi = {
  list: async (params?: { page?: number; limit?: number }, config?: AxiosRequestConfig) => {
    const res = await api.get<NotificationListResponse>("/notifications", {
      params,
      ...config,
    });
    return { notifications: res.data.data.notifications };
  },

  get: (id: string) =>
    api
      .get<{ data: { notification: AppNotification } }>(`/notifications/${id}`)
      .then((r) => r.data.data.notification),

  markRead: (id: string) =>
    api.post(`/notifications/read`, { id }, { skipErrorToast: true }).then((r) => r.data),

  markAllRead: () =>
    api.post(`/notifications/all-read`, undefined, { skipErrorToast: true }).then((r) => r.data),
};
