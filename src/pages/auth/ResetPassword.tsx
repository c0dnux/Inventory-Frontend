import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { AuthLayout } from "./AuthLayout";
import { Button } from "../../components/ui/Button";
import { Input, PasswordInput, Label, FieldError } from "../../components/ui/Form";
import { errorMessage } from "../../lib/api";
import { useToast } from "../../components/ui/Toast";

export function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const confirmMismatch = confirmPassword.length > 0 && confirmPassword !== password;

  const validate = () => {
    const next: Record<string, string> = {};
    if (token.trim().length < 4) next.token = "Enter the reset code from your email";
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
      await resetPassword({ token: token.trim(), password, confirmPassword });
      toast("success", "Password updated. You're signed in.");
      navigate("/", { replace: true });
    } catch (err) {
      toast("error", errorMessage(err, "Could not reset password."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="animate-slide-up text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
          <ShieldCheck className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-2xl font-bold text-slate-900">Choose a new password</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
          Enter the reset code you received and your new password.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4 text-left">
          <div>
            <Label htmlFor="token">Reset code</Label>
            <Input
              id="token"
              inputMode="numeric"
              placeholder="000000"
              maxLength={6}
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/[^0-9]/g, ""))}
              className="text-center text-lg font-semibold tracking-[0.4em]"
            />
            <FieldError message={errors.token} />
          </div>
          <div>
            <Label htmlFor="password">New password</Label>
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
            <Label htmlFor="confirmPassword">Confirm new password</Label>
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

          <Button type="submit" className="w-full" size="lg" loading={submitting}>
            Reset password
          </Button>
        </form>

        <p className="mt-8 text-sm text-slate-500">
          <Link
            to="/login"
            className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-500"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
