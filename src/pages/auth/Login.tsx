import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { brand } from "../../config/branding";
import { useAuth } from "../../auth/AuthContext";
import { AuthLayout } from "./AuthLayout";
import { Button } from "../../components/ui/Button";
import { GoogleSignInButton } from "../../components/auth/GoogleSignInButton";
import { Input, PasswordInput, Label, FieldError } from "../../components/ui/Form";
import { errorMessage } from "../../lib/api";
import { useToast } from "../../components/ui/Toast";

export function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const validate = () => {
    const next: typeof errors = {};
    if (!email) next.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Enter a valid email";
    if (!password) next.password = "Password is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await login(email, password);
      toast("success", "Welcome back!");
      navigate(from, { replace: true });
    } catch (err) {
      toast("error", errorMessage(err, "Login failed."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async (credential: string) => {
    setSubmitting(true);
    try {
      await loginWithGoogle(credential);
      toast("success", "Signed in with Google");
      navigate(from, { replace: true });
    } catch (err) {
      toast("error", errorMessage(err, "Google sign-in failed."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="animate-slide-up">
        <h1 className="text-2xl font-bold text-slate-900">Sign in to your account</h1>
        <p className="mt-1 text-sm text-slate-500">Welcome back to {brand.name}.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <FieldError message={errors.email} />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                to="/forgot-password"
                className="mb-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-500"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <FieldError message={errors.password} />
          </div>

          <Button type="submit" className="w-full" size="lg" loading={submitting}>
            Sign in
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-medium text-slate-400">or</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>
        <div className="flex justify-center">
          <GoogleSignInButton onCredential={handleGoogle} disabled={submitting} />
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-500"
          >
            Create one
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
