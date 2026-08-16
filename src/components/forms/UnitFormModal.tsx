import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { unitsApi, type UnitPayload } from "../../api/units";
import { Button } from "../ui/Button";
import { Input, Select, Label, Textarea, FieldError } from "../ui/Form";
import { Modal } from "../ui/Modal";
import { useToast } from "../ui/Toast";
import { errorMessage } from "../../lib/api";
import type { Unit } from "../../types";

export function UnitFormModal({
  open,
  onClose,
  unit,
}: {
  open: boolean;
  onClose: () => void;
  unit?: Unit | null;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const editing = Boolean(unit);

  const [form, setForm] = useState<UnitPayload>({
    name: "",
    abbreviation: "",
    description: "",
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      name: unit?.name ?? "",
      abbreviation: unit?.abbreviation ?? "",
      description: unit?.description ?? "",
      isActive: unit?.isActive ?? true,
    });
    setErrors({});
  }, [open, unit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Unit name is required";
    if (!form.abbreviation.trim()) next.abbreviation = "Abbreviation is required";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      if (unit) {
        await unitsApi.update(unit._id, form);
        toast("success", "Unit updated.");
      } else {
        await unitsApi.create(form);
        toast("success", "Unit created.");
      }
      queryClient.invalidateQueries({ queryKey: ["units"] });
      onClose();
    } catch (err) {
      toast("error", errorMessage(err, "Could not save unit."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit unit" : "Add unit"}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="unit-form" loading={submitting}>
            {editing ? "Save changes" : "Create unit"}
          </Button>
        </>
      }
    >
      <form id="unit-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">Unit name</Label>
            <Input
              id="name"
              placeholder="e.g. Kilograms"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <FieldError message={errors.name} />
          </div>
          <div>
            <Label htmlFor="abbreviation">Abbreviation</Label>
            <Input
              id="abbreviation"
              placeholder="kg"
              maxLength={6}
              value={form.abbreviation}
              onChange={(e) => setForm((f) => ({ ...f, abbreviation: e.target.value }))}
            />
            <FieldError message={errors.abbreviation} />
          </div>
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
        <div>
          <Label htmlFor="isActive">Status</Label>
          <Select
            id="isActive"
            value={form.isActive ? "true" : "false"}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.value === "true" }))}
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>
        </div>
      </form>
    </Modal>
  );
}
