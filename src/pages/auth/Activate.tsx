import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { AuthLayout } from "./AuthLayout";
import { Button } from "../../components/ui/Button";
import { Input, Label } from "../../components/ui/Form";
import { errorMessage } from "../../lib/api";
import { useToast } from "../../components/ui/Toast";

export function ActivatePage() {
  const { activate } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail = (location.state as { email?: string } | null)?.email ?? "";

  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length < 4) {
      toast("error", "Enter the 6-digit activation code from your email.");
      return;
    }
    setSubmitting(true);
    try {
      await activate(code.trim());
      toast("success", "Account activated. Welcome!");
      navigate("/", { replace: true });
    } catch (err) {
      toast("error", errorMessage(err, "Invalid or expired activation code."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="animate-slide-up text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
          <MailCheck className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-2xl font-bold text-slate-900">Activate your account</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
          We sent a 6-digit activation code to{" "}
          <span className="font-semibold text-slate-700">{initialEmail || "your email"}</span>.
          Enter it below to finish setting up your account.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4 text-left">
          <div>
            <Label htmlFor="code">Activation code</Label>
            <Input
              id="code"
              inputMode="numeric"
              autoFocus
              placeholder="000000"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
              className="text-center text-lg font-semibold tracking-[0.4em]"
            />
          </div>
          <Button type="submit" className="w-full" size="lg" loading={submitting}>
            Activate account
          </Button>
        </form>

        <p className="mt-8 text-sm text-slate-500">
          <Link
            to="/signup"
            className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-500"
          >
            Use a different email
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
