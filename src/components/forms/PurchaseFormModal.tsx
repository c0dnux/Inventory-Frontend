import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, ShoppingCart, Trash2 } from "lucide-react";
import { purchasesApi, type PurchasePayload } from "../../api/purchases";
import { Button } from "../ui/Button";
import { Input, Select, Label, FieldError } from "../ui/Form";
import { Modal } from "../ui/Modal";
import { useToast } from "../ui/Toast";
import { errorMessage } from "../../lib/api";
import { formatCurrency } from "../../lib/format";
import type { Product, Supplier } from "../../types";

interface LineItem {
  product: string;
  quantity: number;
  unitCost: number;
}

export function PurchaseFormModal({
  open,
  onClose,
  products,
  suppliers,
}: {
  open: boolean;
  onClose: () => void;
  products: Product[];
  suppliers: Supplier[];
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [supplier, setSupplier] = useState("");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ product: "", quantity: 1, unitCost: 0 }]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setSupplier("");
      setNote("");
      setItems([{ product: "", quantity: 1, unitCost: 0 }]);
      setErrors({});
    }
  }, [open]);

  const total = useMemo(
    () => items.reduce((sum, it) => sum + (it.quantity || 0) * (it.unitCost || 0), 0),
    [items],
  );

  const updateItem = (index: number, patch: Partial<LineItem>) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!supplier) next.supplier = "Select a supplier";
    const validItems = items.filter((it) => it.product && it.quantity > 0);
    if (validItems.length === 0) {
      next.items = "Add at least one line item with a product and quantity";
    }
    if (items.some((it) => it.product && (!it.quantity || it.quantity <= 0))) {
      next.items = "Every line needs a quantity of at least 1";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload: PurchasePayload = {
        supplier,
        note: note || undefined,
        items: items
          .filter((it) => it.product && it.quantity > 0)
          .map((it) => ({
            product: it.product,
            quantity: it.quantity,
            unitCost: it.unitCost || 0,
          })),
      };
      await purchasesApi.create(payload);
      toast("success", "Purchase order created.");
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      onClose();
    } catch (err) {
      toast("error", errorMessage(err, "Could not create purchase order."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create purchase order"
      subtitle="Reference number is generated automatically."
      size="lg"
      footer={
        <>
          <div className="mr-auto flex items-center gap-2 text-sm">
            <span className="text-slate-500">Total:</span>
            <span className="text-lg font-bold text-slate-900">{formatCurrency(total)}</span>
          </div>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="purchase-form" loading={submitting}>
            <ShoppingCart className="h-4 w-4" /> Create order
          </Button>
        </>
      }
    >
      <form id="purchase-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="supplier">Supplier</Label>
            <Select id="supplier" value={supplier} onChange={(e) => setSupplier(e.target.value)}>
              <option value="">Select supplier…</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </Select>
            <FieldError message={errors.supplier} />
          </div>
          <div>
            <Label htmlFor="note">Note</Label>
            <Input
              id="note"
              placeholder="Optional note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <Label className="mb-0">Line items</Label>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                setItems((prev) => [...prev, { product: "", quantity: 1, unitCost: 0 }])
              }
            >
              <Plus className="h-3.5 w-3.5" /> Add line
            </Button>
          </div>
          <p className="mb-2 text-xs text-slate-400">
            For each item, enter the <span className="font-medium text-slate-500">quantity</span> to
            order and the <span className="font-medium text-slate-500">unit cost</span> — the price
            paid per single unit. Line total = quantity × unit cost.
          </p>

          <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
            <div className="hidden grid-cols-12 gap-2 px-1 sm:grid">
              <div className="col-span-6 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Product
              </div>
              <div className="col-span-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Qty
              </div>
              <div className="col-span-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Unit cost
              </div>
              <div className="col-span-1 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                Total
              </div>
              <div className="col-span-1" />
            </div>
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 items-end gap-2">
                <div className="col-span-12 sm:col-span-6">
                  <Select
                    value={item.product}
                    onChange={(e) => updateItem(index, { product: e.target.value })}
                  >
                    <option value="">Select product…</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.productName} — {p.sku}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <Input
                    type="number"
                    min={1}
                    placeholder="Qty"
                    aria-label="Quantity"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Unit cost"
                    aria-label="Unit cost"
                    title="Unit cost = price paid per single unit"
                    value={item.unitCost}
                    onChange={(e) => updateItem(index, { unitCost: Number(e.target.value) })}
                  />
                </div>
                <div className="col-span-3 sm:col-span-1 text-right text-sm font-semibold text-slate-700">
                  {formatCurrency((item.quantity || 0) * (item.unitCost || 0))}
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:bg-red-50"
                    disabled={items.length === 1}
                    onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <FieldError message={errors.items} />
          </div>
        </div>
      </form>
    </Modal>
  );
}
