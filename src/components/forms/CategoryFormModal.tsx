import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { categoriesApi, type CategoryPayload } from "../../api/categories";
import { Button } from "../ui/Button";
import { Input, Select, Label, Textarea, FieldError } from "../ui/Form";
import { Modal } from "../ui/Modal";
import { useToast } from "../ui/Toast";
import { errorMessage } from "../../lib/api";
import type { Category } from "../../types";

export function CategoryFormModal({
  open,
  onClose,
  category,
}: {
  open: boolean;
  onClose: () => void;
  category?: Category | null;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const editing = Boolean(category);

  const [form, setForm] = useState<CategoryPayload>({ name: "", description: "", isActive: true });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      name: category?.name ?? "",
      description: category?.description ?? "",
      isActive: category?.isActive ?? true,
    });
    setErrors({});
  }, [open, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrors({ name: "Category name is required" });
      return;
    }
    setSubmitting(true);
    try {
      if (category) {
        await categoriesApi.update(category._id, form);
        toast("success", "Category updated.");
      } else {
        await categoriesApi.create(form);
        toast("success", "Category created.");
      }
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      onClose();
    } catch (err) {
      toast("error", errorMessage(err, "Could not save category."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit category" : "Add category"}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="category-form" loading={submitting}>
            {editing ? "Save changes" : "Create category"}
          </Button>
        </>
      }
    >
      <form id="category-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Category name</Label>
          <Input
            id="name"
            placeholder="e.g. Hardware"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <FieldError message={errors.name} />
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
