import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authApi } from "../api/auth";
import type { ResetPasswordPayload, SignupPayload } from "../api/auth";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogle: (credential: string) => Promise<User>;
  signup: (payload: SignupPayload) => Promise<void>;
  activate: (token: string) => Promise<User>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (payload: ResetPasswordPayload) => Promise<User>;
  updatePassword: (payload: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      try {
        const profile = await authApi.profile();
        if (!cancelled) {
          setUser(profile);
          setToken(null);
        }
      } catch {
        // Not logged in (interceptor already tried to refresh).
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    hydrate();

    const onAuthLogout = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener("auth:logout", onAuthLogout);
    return () => {
      cancelled = true;
      window.removeEventListener("auth:logout", onAuthLogout);
    };
  }, []);

  const applyAuth = useCallback((res: { token: string; data: { user: User } }) => {
    setToken(res.token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const login = useCallback(
    async (email: string, password: string) => applyAuth(await authApi.login(email, password)),
    [applyAuth],
  );

  const loginWithGoogle = useCallback(
    async (credential: string) => applyAuth(await authApi.google(credential)),
    [applyAuth],
  );

  const signup = useCallback(async (payload: SignupPayload) => {
    await authApi.signup(payload);
  }, []);

  const activate = useCallback(
    async (activationToken: string) => applyAuth(await authApi.activate(activationToken)),
    [applyAuth],
  );

  const forgotPassword = useCallback(async (email: string) => {
    await authApi.forgotPassword(email);
  }, []);

  const resetPassword = useCallback(
    async (payload: ResetPasswordPayload) => applyAuth(await authApi.resetPassword(payload)),
    [applyAuth],
  );

  const updatePassword = useCallback(
    async (payload: { currentPassword: string; newPassword: string; confirmNewPassword: string }) =>
      applyAuth(await authApi.updatePassword(payload)),
    [applyAuth],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Server logout may fail (public route reads req.user); clear locally.
    }
    setUser(null);
    setToken(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      loginWithGoogle,
      signup,
      activate,
      forgotPassword,
      resetPassword,
      updatePassword,
      logout,
      setUser,
    }),
    [
      user,
      token,
      loading,
      login,
      loginWithGoogle,
      signup,
      activate,
      forgotPassword,
      resetPassword,
      updatePassword,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
