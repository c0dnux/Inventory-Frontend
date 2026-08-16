import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi, type ProductPayload } from "../../api/products";
import { Button } from "../ui/Button";
import { Input, Select, Label, FieldError } from "../ui/Form";
import { Modal } from "../ui/Modal";
import { useToast } from "../ui/Toast";
import { errorMessage } from "../../lib/api";
import {
  optimisticPatch,
  optimisticUpsert,
  snapshotQueries,
  restoreQueries,
} from "../../lib/queryCache";
import type { Category, Product, Unit } from "../../types";

export function ProductFormModal({
  open,
  onClose,
  product,
  categories,
  units,
}: {
  open: boolean;
  onClose: () => void;
  product?: Product | null;
  categories: Category[];
  units: Unit[];
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const editing = Boolean(product);

  const [form, setForm] = useState<ProductPayload>({
    productName: "",
    description: "",
    category: "",
    unit: "",
    costPrice: 0,
    sellingPrice: 0,
    reorderLevel: 10,
    status: "active",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      productName: product?.productName ?? "",
      description: product?.description ?? "",
      category: product?.category ?? "",
      unit: product?.unit ?? "",
      costPrice: product?.costPrice ?? 0,
      sellingPrice: product?.sellingPrice ?? 0,
      reorderLevel: product?.reorderLevel ?? 10,
      status: product?.status ?? "active",
    });
    setErrors({});
  }, [open, product]);

  const set = <K extends keyof ProductPayload>(key: K, value: ProductPayload[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.productName.trim()) next.productName = "Product name is required";
    if (!form.category) next.category = "Select a category";
    if (!form.unit) next.unit = "Select a unit";
    if (form.costPrice < 0) next.costPrice = "Cannot be negative";
    if (form.sellingPrice < 0) next.sellingPrice = "Cannot be negative";
    if (form.reorderLevel < 0) next.reorderLevel = "Cannot be negative";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ProductPayload }) =>
      productsApi.update(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ["products"] });
      const snapshot = snapshotQueries(queryClient, "products");
      optimisticPatch<Product>(queryClient, "products", (p) =>
        p._id === id ? { ...p, ...payload } : p,
      );
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot) restoreQueries(queryClient, ctx.snapshot);
    },
    onSuccess: (updated) => {
      optimisticUpsert<Product>(queryClient, "products", updated);
      toast("success", "Product updated.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (product) {
        await updateMutation.mutateAsync({ id: product._id, payload: form });
        onClose();
      } else {
        await productsApi.create(form);
        toast("success", "Product created. SKU & barcode generated automatically.");
        queryClient.invalidateQueries({ queryKey: ["products"] });
        onClose();
      }
    } catch (err) {
      toast("error", errorMessage(err, "Could not save product."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit product" : "Add product"}
      subtitle={
        editing ? "Update product details." : "SKU and barcode are generated automatically."
      }
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="product-form" loading={submitting}>
            {editing ? "Save changes" : "Create product"}
          </Button>
        </>
      }
    >
      <form id="product-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="productName">Product name</Label>
          <Input
            id="productName"
            placeholder="e.g. Stainless Steel Bolts"
            value={form.productName}
            onChange={(e) => set("productName", e.target.value)}
          />
          <FieldError message={errors.productName} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              id="category"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
            >
              <option value="">Select category…</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <FieldError message={errors.category} />
          </div>
          <div>
            <Label htmlFor="unit">Unit</Label>
            <Select id="unit" value={form.unit} onChange={(e) => set("unit", e.target.value)}>
              <option value="">Select unit…</option>
              {units.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.abbreviation})
                </option>
              ))}
            </Select>
            <FieldError message={errors.unit} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="costPrice">Cost price</Label>
            <Input
              id="costPrice"
              type="number"
              min={0}
              step="0.01"
              value={form.costPrice}
              onChange={(e) => set("costPrice", Number(e.target.value))}
            />
            <FieldError message={errors.costPrice} />
          </div>
          <div>
            <Label htmlFor="sellingPrice">Selling price</Label>
            <Input
              id="sellingPrice"
              type="number"
              min={0}
              step="0.01"
              value={form.sellingPrice}
              onChange={(e) => set("sellingPrice", Number(e.target.value))}
            />
            <FieldError message={errors.sellingPrice} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="reorderLevel">Reorder level</Label>
            <Input
              id="reorderLevel"
              type="number"
              min={0}
              value={form.reorderLevel}
              onChange={(e) => set("reorderLevel", Number(e.target.value))}
            />
            <FieldError message={errors.reorderLevel} />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              id="status"
              value={form.status}
              onChange={(e) => set("status", e.target.value as ProductPayload["status"])}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="discontinued">Discontinued</option>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            placeholder="Optional short description"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}
