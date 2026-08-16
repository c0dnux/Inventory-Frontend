import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { suppliersApi, type SupplierPayload } from "../../api/suppliers";
import { Button } from "../ui/Button";
import { Input, Select, Label, FieldError } from "../ui/Form";
import { Modal } from "../ui/Modal";
import { useToast } from "../ui/Toast";
import { errorMessage } from "../../lib/api";
import type { Supplier } from "../../types";

export function SupplierFormModal({
  open,
  onClose,
  supplier,
}: {
  open: boolean;
  onClose: () => void;
  supplier?: Supplier | null;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const editing = Boolean(supplier);

  const [form, setForm] = useState<SupplierPayload>({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: {},
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      name: supplier?.name ?? "",
      contactPerson: supplier?.contactPerson ?? "",
      email: supplier?.email ?? "",
      phone: supplier?.phone ?? "",
      address: supplier?.address ?? {},
      isActive: supplier?.isActive ?? true,
    });
    setErrors({});
  }, [open, supplier]);

  const set = <K extends keyof SupplierPayload>(key: K, value: SupplierPayload[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const setAddress = (key: keyof NonNullable<SupplierPayload["address"]>, value: string) =>
    setForm((f) => ({ ...f, address: { ...(f.address ?? {}), [key]: value } }));

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Supplier name is required";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = "Enter a valid email";
    if (form.phone && !/^\+?[1-9]\d{1,14}$/.test(form.phone))
      next.phone = "Enter a valid phone number";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (supplier) {
        await suppliersApi.update(supplier._id, form);
        toast("success", "Supplier updated.");
      } else {
        await suppliersApi.create(form);
        toast("success", "Supplier created.");
      }
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      onClose();
    } catch (err) {
      toast("error", errorMessage(err, "Could not save supplier."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit supplier" : "Add supplier"}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="supplier-form" loading={submitting}>
            {editing ? "Save changes" : "Create supplier"}
          </Button>
        </>
      }
    >
      <form id="supplier-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Company name</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Acme Supplies Ltd"
          />
          <FieldError message={errors.name} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="contactPerson">Contact person</Label>
            <Input
              id="contactPerson"
              value={form.contactPerson ?? ""}
              onChange={(e) => set("contactPerson", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email ?? ""}
              onChange={(e) => set("email", e.target.value)}
            />
            <FieldError message={errors.email} />
          </div>
        </div>

        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={form.phone ?? ""}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="+234 800 000 0000"
          />
          <FieldError message={errors.phone} />
        </div>

        <div>
          <Label>Address</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="Street"
              value={form.address?.street ?? ""}
              onChange={(e) => setAddress("street", e.target.value)}
            />
            <Input
              placeholder="City"
              value={form.address?.city ?? ""}
              onChange={(e) => setAddress("city", e.target.value)}
            />
            <Input
              placeholder="State / Province"
              value={form.address?.state ?? ""}
              onChange={(e) => setAddress("state", e.target.value)}
            />
            <Input
              placeholder="ZIP / Postal code"
              value={form.address?.zipCode ?? ""}
              onChange={(e) => setAddress("zipCode", e.target.value)}
            />
            <Input
              className="sm:col-span-2"
              placeholder="Country"
              value={form.address?.country ?? ""}
              onChange={(e) => setAddress("country", e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="isActive">Status</Label>
          <Select
            id="isActive"
            value={form.isActive ? "true" : "false"}
            onChange={(e) => set("isActive", e.target.value === "true")}
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>
        </div>
      </form>
    </Modal>
  );
}
