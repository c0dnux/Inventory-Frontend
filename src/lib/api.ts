import axios from "axios";
import { emitToast } from "./toast";

declare module "axios" {
  export interface AxiosRequestConfig {
    /**
     * Opt out of the interceptor-level error toast. Set by call sites that
     * render their own error message (most mutations), and by silent polls.
     */
    skipErrorToast?: boolean;
  }
}

/**
 * Shared axios instance.
 *
 * - baseURL comes from VITE_API_URL (default `/api/v1`, proxied by Vite in dev).
 * - `withCredentials` lets the browser attach the httpOnly `jwt` / `jwt_refresh`
 *   cookies the backend sets, so auth works without storing tokens in JS.
 */
export const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL as string | undefined) || "/api/v1",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// --- Silent refresh flow ---------------------------------------------------
// On a 401 the interceptor calls POST /auth/refresh (the backend rotates the
// refresh cookie and issues a new access cookie), then retries the request.
// If refresh fails we emit `auth:logout` so the AuthProvider can clear state.

let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (!original) return Promise.reject(error);

    const isAuthRefresh =
      typeof original.url === "string" && original.url.includes("/auth/refresh");
    // Public auth entry points: a 401 there is a meaningful credential error
    // ("wrong password", "not activated", ...), never a sign to refresh.
    const isPublicAuth =
      typeof original.url === "string" &&
      /\/auth\/(login|signup|google|activate|forgot-password|reset-password)(\/|$)/.test(
        original.url,
      );
    const status = error.response?.status;

    if (status === 401 && !original._retry && !isAuthRefresh && !isPublicAuth) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push((token) => {
            if (token) {
              original._retry = true;
              resolve(api(original));
            } else {
              reject(error);
            }
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post("/auth/refresh");
        pendingQueue.forEach((cb) => cb(data.token ?? "refreshed"));
        pendingQueue = [];
        return api(original);
      } catch (refreshError) {
        pendingQueue.forEach((cb) => cb(null));
        pendingQueue = [];
        window.dispatchEvent(new CustomEvent("auth:logout"));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (!original.skipErrorToast && !isAuthRefresh) {
      showErrorToast(error);
    }

    return Promise.reject(error);
  },
);

/**
 * Default error toast for unhandled/unexpected failures. Deduped per
 * `method + url` within the toast lifetime so react-query retries (and the
 * silent-refresh retry of the same request) don't stack toasts.
 */
const lastErrorToastAt = new Map<string, number>();

function showErrorToast(error: unknown): void {
  const url = axios.isAxiosError(error) ? (error.config?.url ?? "") : "";
  const method = axios.isAxiosError(error) ? (error.config?.method ?? "") : "";
  const key = `${method} ${url}`;
  const now = Date.now();
  if (now - (lastErrorToastAt.get(key) ?? 0) < 4500) return;
  lastErrorToastAt.set(key, now);
  emitToast("error", errorMessage(error));
}

export function errorMessage(err: unknown, fallback = "Something went wrong.") {
  if (axios.isAxiosError(err)) {
    const message = err.response?.data?.message;
    if (typeof message === "string") return message;
    if (err.response?.data?.error && typeof err.response.data.error === "string") {
      return err.response.data.error;
    }
    return err.message || fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
