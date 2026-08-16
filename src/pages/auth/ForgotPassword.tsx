import { useState } from "react";
import { Link } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { AuthLayout } from "./AuthLayout";
import { Button } from "../../components/ui/Button";
import { Input, Label } from "../../components/ui/Form";
import { errorMessage } from "../../lib/api";
import { useToast } from "../../components/ui/Toast";

export function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      toast("error", errorMessage(err, "Could not send reset email."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="animate-slide-up text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
          <KeyRound className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-2xl font-bold text-slate-900">Reset your password</h1>

        {sent ? (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
            <p className="text-sm font-medium text-emerald-700">
              If an account exists for <span className="font-semibold">{email}</span>, a reset code
              has been sent. Use it on the reset page.
            </p>
          </div>
        ) : (
          <>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
              Enter the email linked to your account and we'll send you a password reset code.
            </p>
            <form onSubmit={handleSubmit} className="mt-8 space-y-4 text-left">
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
              </div>
              <Button type="submit" className="w-full" size="lg" loading={submitting}>
                Send reset code
              </Button>
            </form>
          </>
        )}

        <div className="mt-8 flex justify-center gap-4 text-sm">
          <Link
            to="/reset-password"
            className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-500"
          >
            I have a code
          </Link>
          <span className="text-slate-300">•</span>
          <Link
            to="/login"
            className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-500"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
