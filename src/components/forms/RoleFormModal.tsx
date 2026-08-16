import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { rolesApi, type RolePayload } from "../../api/roles";
import { Button } from "../ui/Button";
import { Input, Select, Label, FieldError } from "../ui/Form";
import { Modal } from "../ui/Modal";
import { useToast } from "../ui/Toast";
import { errorMessage } from "../../lib/api";
import type { Permission, Role } from "../../types";

const ROLE_NAMES = ["Admin", "Manager", "Staff"];

export function RoleFormModal({
  open,
  onClose,
  role,
  permissions,
}: {
  open: boolean;
  onClose: () => void;
  role?: Role | null;
  permissions: Permission[];
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const editing = Boolean(role);

  const [name, setName] = useState("Manager");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(role?.name ?? "Manager");
    setDescription(role?.description ?? "");
    setSelected(new Set((role?.permissions ?? []).map((p) => p._id)));
    setErrors({});
  }, [open, role]);

  const grouped = useMemo(() => {
    const map = new Map<string, Permission[]>();
    for (const p of permissions) {
      const list = map.get(p.resource) ?? [];
      list.push(p);
      map.set(p.resource, list);
    }
    return [...map.entries()];
  }, [permissions]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Role name is required";
    if (!ROLE_NAMES.includes(name.trim()))
      next.name = `Name must be one of: ${ROLE_NAMES.join(", ")}`;
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      const payload: RolePayload = {
        name: name.trim(),
        description: description || undefined,
        permissions: [...selected],
      };
      if (role) {
        await rolesApi.update(role._id, payload);
        toast("success", "Role updated.");
      } else {
        await rolesApi.create(payload);
        toast("success", "Role created.");
      }
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      onClose();
    } catch (err) {
      toast("error", errorMessage(err, "Could not save role."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? `Edit role: ${role?.name}` : "Create role"}
      subtitle="Roles bundle a set of permissions granted to users."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="role-form" loading={submitting}>
            {editing ? "Save changes" : "Create role"}
          </Button>
        </>
      }
    >
      <form id="role-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">Role name</Label>
            <Select id="name" value={name} onChange={(e) => setName(e.target.value)}>
              {ROLE_NAMES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
            <FieldError message={errors.name} />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>

        <div>
          <Label>Permissions</Label>
          {grouped.length === 0 ? (
            <p className="text-sm text-slate-400">No permissions found. Create some first.</p>
          ) : (
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
              {grouped.map(([resource, perms]) => (
                <div key={resource}>
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                    {resource}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {perms.map((p) => {
                      const checked = selected.has(p._id);
                      return (
                        <button
                          key={p._id}
                          type="button"
                          onClick={() => toggle(p._id)}
                          className={
                            checked
                              ? "inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white transition"
                              : "inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-brand-400 hover:text-brand-600"
                          }
                        >
                          <span
                            className={
                              checked
                                ? "flex h-3.5 w-3.5 items-center justify-center rounded-sm bg-white/20 text-[10px]"
                                : "flex h-3.5 w-3.5 items-center justify-center rounded-sm border border-slate-300 text-[10px]"
                            }
                          >
                            {checked ? "✓" : ""}
                          </span>
                          {p.action}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}
