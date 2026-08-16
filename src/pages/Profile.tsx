import { useState } from "react";
import { KeyRound, Mail, Shield, UserRound } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { roleName } from "../lib/permissions";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { PasswordInput, Label, FieldError } from "../components/ui/Form";
import { PageHeader } from "../components/ui/PageHeader";
import { errorMessage } from "../lib/api";
import { useToast } from "../components/ui/Toast";
import type { User } from "../types";

function permissionSummary(user: User | null) {
  const role = user?.role;
  if (!role || typeof role === "string") return [];
  const byResource = new Map<string, string[]>();
  for (const p of role.permissions ?? []) {
    const list = byResource.get(p.resource) ?? [];
    list.push(p.action);
    byResource.set(p.resource, list);
  }
  return [...byResource.entries()];
}

export function ProfilePage() {
  const { user, updatePassword } = useAuth();
  const { toast } = useToast();
  const summary = permissionSummary(user);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const confirmMismatch = confirmPassword.length > 0 && confirmPassword !== newPassword;

  const validatePassword = () => {
    const next: Record<string, string> = {};
    if (!currentPassword) next.currentPassword = "Enter your current password";
    if (newPassword.length < 8) next.newPassword = "New password must be at least 8 characters";
    if (confirmMismatch) next.confirmPassword = "Passwords do not match";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword()) return;
    setSubmitting(true);
    try {
      await updatePassword({
        currentPassword,
        newPassword,
        confirmNewPassword: confirmPassword,
      });
      toast("success", "Password updated. You're now logged in with the new password.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setErrors({});
    } catch (err) {
      toast("error", errorMessage(err, "Could not update password."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Profile" description="Your account details and permissions." />

      <Card>
        <CardContent className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="h-20 w-20 rounded-full object-cover ring-4 ring-brand-50"
            />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-violet-600 text-2xl font-bold text-white">
              {(user?.name ?? "?")[0]?.toUpperCase()}
            </span>
          )}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
            <p className="mt-0.5 flex items-center justify-center gap-1.5 text-sm text-slate-500 sm:justify-start">
              <Mail className="h-4 w-4" /> {user?.email}
            </p>
            <div className="mt-2 flex items-center justify-center gap-2 sm:justify-start">
              <Badge variant="brand">
                <Shield className="h-3 w-3" /> {roleName(user)}
              </Badge>
              <Badge variant={user?.active ? "success" : "neutral"}>
                {user?.active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Account" subtitle="Information associated with your account" />
        <CardContent className="space-y-3">
          <div className="flex justify-between border-b border-slate-50 pb-3">
            <span className="flex items-center gap-2 text-sm text-slate-500">
              <UserRound className="h-4 w-4" /> Full name
            </span>
            <span className="text-sm font-medium text-slate-800">{user?.name}</span>
          </div>
          <div className="flex justify-between border-b border-slate-50 pb-3">
            <span className="flex items-center gap-2 text-sm text-slate-500">
              <Mail className="h-4 w-4" /> Email
            </span>
            <span className="text-sm font-medium text-slate-800">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-slate-500">User ID</span>
            <span className="font-mono text-xs text-slate-400">{user?._id}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Update password"
          subtitle="Change the password used to sign in to your account"
        />
        <CardContent>
          <form
            onSubmit={handleUpdatePassword}
            className="grid max-w-lg grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <div className="sm:col-span-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <PasswordInput
                id="currentPassword"
                autoComplete="current-password"
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <FieldError message={errors.currentPassword} />
            </div>
            <div>
              <Label htmlFor="newPassword">New password</Label>
              <PasswordInput
                id="newPassword"
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <FieldError message={errors.newPassword} />
            </div>
            <div>
              <Label htmlFor="confirmNewPassword">Confirm new password</Label>
              <PasswordInput
                id="confirmNewPassword"
                autoComplete="new-password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <FieldError
                message={confirmMismatch ? "Passwords do not match" : errors.confirmPassword}
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" variant="outline" loading={submitting}>
                <KeyRound className="h-4 w-4" /> Update password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Permissions"
          subtitle={`Role "${roleName(user)}" grants the following access`}
        />
        <CardContent>
          {summary.length === 0 ? (
            <p className="text-sm text-slate-400">No permissions recorded.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {summary.map(([resource, actions]) => (
                <div
                  key={resource}
                  className="rounded-lg border border-slate-100 bg-slate-50/60 p-3"
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    {resource}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {actions.map((a) => (
                      <Badge key={a} variant="brand">
                        {a}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
