import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adjustmentsApi } from "../../api/adjustments";
import { Button } from "../ui/Button";
import { Input, Select, Label, Textarea, FieldError } from "../ui/Form";
import { Modal } from "../ui/Modal";
import { useToast } from "../ui/Toast";
import { errorMessage } from "../../lib/api";
import { formatCurrency, formatNumber } from "../../lib/format";
import { optimisticPatch, snapshotQueries, restoreQueries } from "../../lib/queryCache";
import type { AdjustmentType, Product } from "../../types";

export function AdjustmentFormModal({
  open,
  onClose,
  products,
}: {
  open: boolean;
  onClose: () => void;
  products: Product[];
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [productId, setProductId] = useState("");
  const [type, setType] = useState<AdjustmentType>("stock_in");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setProductId("");
      setType("stock_in");
      setQuantity(1);
      setReason("");
      setNote("");
      setErrors({});
    }
  }, [open]);

  const selectedProduct = products.find((p) => p._id === productId);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!productId) next.productId = "Select a product";
    if (!quantity || quantity < 0) next.quantity = "Quantity must be 0 or more";
    if (type === "stock_out" && selectedProduct && quantity > selectedProduct.currentStock)
      next.quantity = `Cannot remove more than current stock (${selectedProduct.currentStock})`;
    if (!reason.trim()) next.reason = "A reason is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const adjustMutation = useMutation({
    mutationFn: (payload: {
      productId: string;
      type: AdjustmentType;
      quantity: number;
      reason: string;
      note?: string;
    }) => adjustmentsApi.adjust(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ["adjustments"] });
      await queryClient.cancelQueries({ queryKey: ["products"] });
      const snapshot = [
        ...snapshotQueries(queryClient, "adjustments"),
        ...snapshotQueries(queryClient, "products"),
      ];
      const product = products.find((p) => p._id === payload.productId);
      if (product) {
        const before = product.currentStock;
        const adjusted =
          payload.type === "stock_in"
            ? before + payload.quantity
            : payload.type === "stock_out"
              ? before - payload.quantity
              : payload.quantity;
        optimisticPatch<Product>(queryClient, "products", (p) =>
          p._id === payload.productId
            ? {
                ...p,
                currentStock: adjusted,
                stockValue: adjusted * p.costPrice,
                isLowStock: adjusted > 0 && adjusted <= p.reorderLevel,
                isOutOfStock: adjusted === 0,
              }
            : p,
        );
      }
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot) restoreQueries(queryClient, ctx.snapshot);
    },
    onSettled: () => {
      // Product stock was patched exactly (same math as the backend); the
      // adjustments/movements/notifications lists are small and refetched.
      queryClient.invalidateQueries({ queryKey: ["adjustments"] });
      queryClient.invalidateQueries({ queryKey: ["movements"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await adjustMutation.mutateAsync({
        productId,
        type,
        quantity,
        reason,
        note: note || undefined,
      });
      toast("success", "Stock adjusted.");
      onClose();
    } catch (err) {
      toast("error", errorMessage(err, "Could not adjust stock."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Adjust stock"
      subtitle="Record a manual stock correction."
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="adjustment-form" loading={submitting}>
            Apply adjustment
          </Button>
        </>
      }
    >
      <form id="adjustment-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="productId">Product</Label>
          <Select id="productId" value={productId} onChange={(e) => setProductId(e.target.value)}>
            <option value="">Select product…</option>
            {products.map((p) => (
              <option key={p._id} value={p._id}>
                {p.productName} — {p.sku} (stock: {p.currentStock})
              </option>
            ))}
          </Select>
          <FieldError message={errors.productId} />
          {selectedProduct && (
            <p className="mt-1.5 text-xs text-slate-500">
              Current stock:{" "}
              <span className="font-semibold text-slate-700">
                {formatNumber(selectedProduct.currentStock)}
              </span>{" "}
              · Stock value: {formatCurrency(selectedProduct.stockValue)}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="type">Adjustment type</Label>
            <Select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as AdjustmentType)}
            >
              <option value="stock_in">Stock in (add)</option>
              <option value="stock_out">Stock out (remove)</option>
              <option value="adjustment">Adjustment (set count)</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="quantity">{type === "adjustment" ? "Counted stock" : "Quantity"}</Label>
            <Input
              id="quantity"
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
            <FieldError message={errors.quantity} />
            {type === "adjustment" && (
              <p className="mt-1 text-xs text-slate-400">
                Enter the actual counted stock. The difference is recorded as variance.
              </p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="reason">Reason</Label>
          <Input
            id="reason"
            placeholder="e.g. Damaged goods, stocktake correction"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <FieldError message={errors.reason} />
        </div>

        <div>
          <Label htmlFor="note">Note</Label>
          <Textarea
            id="note"
            placeholder="Optional extra detail"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}
