import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./auth/AuthContext";
import { RequireAuth, RedirectIfAuthed } from "./auth/RequireAuth";
import { ToastProvider } from "./components/ui/Toast";
import { ThemeProvider } from "./context/ThemeContext";
import { AppLayout } from "./components/layout/AppLayout";
import { LoginPage } from "./pages/auth/Login";
import { SignupPage } from "./pages/auth/Signup";
import { ActivatePage } from "./pages/auth/Activate";
import { ForgotPasswordPage } from "./pages/auth/ForgotPassword";
import { ResetPasswordPage } from "./pages/auth/ResetPassword";
import { DashboardPage } from "./pages/Dashboard";
import { ProductsPage } from "./pages/Products";
import { PurchasesPage } from "./pages/Purchases";
import { SuppliersPage } from "./pages/Suppliers";
import { AdjustmentsPage } from "./pages/Adjustments";
import { MovementsPage } from "./pages/Movements";
import { NotificationsPage } from "./pages/Notifications";
import { CategoriesPage } from "./pages/Categories";
import { UnitsPage } from "./pages/Units";
import { ProfilePage } from "./pages/Profile";
import { RolesPage } from "./pages/admin/Roles";
import { PermissionsPage } from "./pages/admin/Permissions";
import { AuditsPage } from "./pages/admin/Audits";
import { NotFoundPage } from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <Routes>
                {/* Public auth routes */}
                <Route element={<RedirectIfAuthed />}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/activate" element={<ActivatePage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                </Route>

                {/* Protected app routes */}
                <Route element={<RequireAuth />}>
                  <Route element={<AppLayout />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/purchases" element={<PurchasesPage />} />
                    <Route path="/suppliers" element={<SuppliersPage />} />
                    <Route path="/adjustments" element={<AdjustmentsPage />} />
                    <Route path="/movements" element={<MovementsPage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/categories" element={<CategoriesPage />} />
                    <Route path="/units" element={<UnitsPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/admin/roles" element={<RolesPage />} />
                    <Route path="/admin/permissions" element={<PermissionsPage />} />
                    <Route path="/admin/audits" element={<AuditsPage />} />
                  </Route>
                </Route>

                <Route path="/404" element={<NotFoundPage />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
