import { api } from "../lib/api";
import type { AuthResponse, User } from "../types";

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
  confirmPassword: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    api
      .post<AuthResponse>("/auth/login", { email, password }, { skipErrorToast: true })
      .then((r) => r.data),

  signup: (payload: SignupPayload) =>
    api
      .post<{ status: string; message: string }>("/auth/signup", payload, {
        skipErrorToast: true,
      })
      .then((r) => r.data),

  activate: (token: string) =>
    api
      .post<AuthResponse>("/auth/activate", { token }, { skipErrorToast: true })
      .then((r) => r.data),

  google: (credential: string) =>
    api
      .post<AuthResponse>("/auth/google", { credential }, { skipErrorToast: true })
      .then((r) => r.data),

  forgotPassword: (email: string) =>
    api
      .post<{ status: string; message: string }>(
        "/auth/forget-password",
        { email },
        { skipErrorToast: true },
      )
      .then((r) => r.data),

  resetPassword: (payload: ResetPasswordPayload) =>
    api
      .post<AuthResponse>("/auth/reset-password", payload, {
        skipErrorToast: true,
      })
      .then((r) => r.data),

  updatePassword: (payload: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }) =>
    api
      .post<AuthResponse>("/auth/update-password", payload, {
        skipErrorToast: true,
      })
      .then((r) => r.data),

  refresh: () => api.post<AuthResponse>("/auth/refresh").then((r) => r.data),

  logout: () =>
    api
      .post<{ status: string; message: string }>("/auth/logout", undefined, {
        skipErrorToast: true,
      })
      .then((r) => r.data),

  profile: () => api.post<{ status: string; data: User }>("/auth/profile").then((r) => r.data.data),
};
