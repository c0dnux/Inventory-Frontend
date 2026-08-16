import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { permissionsApi, type PermissionPayload } from "../../api/permissions";
import { Button } from "../ui/Button";
import { Input, Select, Label, Textarea, FieldError } from "../ui/Form";
import { Modal } from "../ui/Modal";
import { useToast } from "../ui/Toast";
import { errorMessage } from "../../lib/api";
import type { Permission } from "../../types";

const ACTIONS = ["create", "read", "update", "delete", "manage"];

export function PermissionFormModal({
  open,
  onClose,
  permission,
}: {
  open: boolean;
  onClose: () => void;
  permission?: Permission | null;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const editing = Boolean(permission);

  const [form, setForm] = useState<PermissionPayload>({
    name: "",
    resource: "",
    action: "read",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      name: permission?.name ?? "",
      resource: permission?.resource ?? "",
      action: permission?.action ?? "read",
      description: permission?.description ?? "",
    });
    setErrors({});
  }, [open, permission]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.resource.trim()) next.resource = "Resource is required (e.g. products)";
    if (!form.action) next.action = "Action is required";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      const payload: PermissionPayload = {
        ...form,
        name: form.name || `${form.resource}:${form.action}`,
        description: form.description || undefined,
      };
      if (permission) {
        await permissionsApi.update(permission._id, payload);
        toast("success", "Permission updated.");
      } else {
        await permissionsApi.create(payload);
        toast("success", "Permission created.");
      }
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      onClose();
    } catch (err) {
      toast("error", errorMessage(err, "Could not save permission."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit permission" : "Add permission"}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="permission-form" loading={submitting}>
            {editing ? "Save changes" : "Create permission"}
          </Button>
        </>
      }
    >
      <form id="permission-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="resource">Resource</Label>
            <Input
              id="resource"
              placeholder="products"
              value={form.resource}
              onChange={(e) => setForm((f) => ({ ...f, resource: e.target.value }))}
            />
            <FieldError message={errors.resource} />
          </div>
          <div>
            <Label htmlFor="action">Action</Label>
            <Select
              id="action"
              value={form.action}
              onChange={(e) => setForm((f) => ({ ...f, action: e.target.value }))}
            >
              {ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </Select>
            <FieldError message={errors.action} />
          </div>
        </div>
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            placeholder={`Defaults to ${form.resource || "resource"}:${form.action}`}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Optional"
            value={form.description ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>
      </form>
    </Modal>
  );
}
