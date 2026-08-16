import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { AuthLayout } from "./AuthLayout";
import { Button } from "../../components/ui/Button";
import { GoogleSignInButton } from "../../components/auth/GoogleSignInButton";
import { Input, PasswordInput, Label, FieldError } from "../../components/ui/Form";
import { errorMessage } from "../../lib/api";
import { useToast } from "../../components/ui/Toast";

export function SignupPage() {
  const { signup, loginWithGoogle } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const confirmMismatch = confirmPassword.length > 0 && confirmPassword !== password;

  const validate = () => {
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = "Name must be at least 2 characters";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Enter a valid email";
    if (password.length < 8) next.password = "Password must be at least 8 characters";
    if (confirmMismatch) next.confirmPassword = "Passwords do not match";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await signup({ name, email, password, confirmPassword });
      toast("success", "Account created! Check your email for the activation code.");
      navigate("/activate", { state: { email } });
    } catch (err) {
      toast("error", errorMessage(err, "Could not create account."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async (credential: string) => {
    setSubmitting(true);
    try {
      await loginWithGoogle(credential);
      toast("success", "Signed in with Google");
      navigate("/", { replace: true });
    } catch (err) {
      toast("error", errorMessage(err, "Google sign-in failed."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="animate-slide-up">
        <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
        <p className="mt-1 text-sm text-slate-500">Start managing your inventory in minutes.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              autoComplete="name"
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <FieldError message={errors.name} />
          </div>

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

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <FieldError message={errors.password} />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <PasswordInput
                id="confirmPassword"
                autoComplete="new-password"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <FieldError
                message={confirmMismatch ? "Passwords do not match" : errors.confirmPassword}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" loading={submitting}>
            Create account
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
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-500"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
