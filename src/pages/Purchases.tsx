import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PackageCheck, Plus, Eye, XCircle } from "lucide-react";
import { purchasesApi } from "../api/purchases";
import { productsApi } from "../api/products";
import { suppliersApi } from "../api/suppliers";
import { useAuth } from "../auth/AuthContext";
import { hasPermission } from "../lib/permissions";
import { useDebounce } from "../lib/useDebounce";
import { formatCurrency, formatDate } from "../lib/format";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select, Label, Textarea } from "../components/ui/Form";
import { Modal } from "../components/ui/Modal";
import { Badge, statusVariant } from "../components/ui/Badge";
import { Table, THead, Th, TBody, Tr, Td } from "../components/ui/Table";
import { Pagination } from "../components/ui/Pagination";
import { TableSkeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { useToast } from "../components/ui/Toast";
import { errorMessage } from "../lib/api";
import { PurchaseFormModal } from "../components/forms/PurchaseFormModal";
import type { Purchase } from "../types";

const PAGE_SIZE = 15;

export function PurchasesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 350);

  const [modalOpen, setModalOpen] = useState(false);
  const [viewing, setViewing] = useState<Purchase | null>(null);
  const [receiving, setReceiving] = useState<Purchase | null>(null);
  const [receiveLoading, setReceiveLoading] = useState(false);
  const [cancelling, setCancelling] = useState<Purchase | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  const canCreate = hasPermission(user, "purchases:create");
  const canCancel = hasPermission(user, "purchases:cancel");

  const productsQuery = useQuery({
    queryKey: ["products", "select"],
    queryFn: () => productsApi.list({ limit: 1000 }),
    staleTime: 5 * 60 * 1000,
  });
  const suppliersQuery = useQuery({
    queryKey: ["suppliers", "select"],
    queryFn: () => suppliersApi.list({ limit: 100 }),
    staleTime: 5 * 60 * 1000,
  });

  const purchasesQuery = useQuery({
    queryKey: ["purchases", { page, search: debouncedSearch, status }],
    queryFn: () =>
      purchasesApi.list({
        page,
        limit: PAGE_SIZE,
        sort: "-createdAt",
        ...(debouncedSearch ? { referenceNo: debouncedSearch } : {}),
        ...(status ? { status } : {}),
      }),
  });

  const purchases = purchasesQuery.data?.purchases ?? [];
  const suppliers = suppliersQuery.data?.suppliers ?? [];
  const supplierMap = new Map(suppliers.map((s) => [s._id, s.name]));
  const productMap = new Map((productsQuery.data?.products ?? []).map((p) => [p._id, p]));

  const handleReceive = async () => {
    if (!receiving) return;
    setReceiveLoading(true);
    try {
      await purchasesApi.receive(receiving._id);
      toast("success", `Purchase ${receiving.referenceNo} received. Stock updated.`);
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["movements"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      setReceiving(null);
    } catch (err) {
      toast("error", errorMessage(err, "Could not receive purchase order."));
    } finally {
      setReceiveLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelling) return;
    if (!cancelReason.trim()) {
      toast("error", "A cancel reason is required.");
      return;
    }
    setCancelLoading(true);
    try {
      await purchasesApi.cancel(cancelling._id, cancelReason.trim());
      toast("success", `Purchase ${cancelling.referenceNo} cancelled.`);
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      setCancelling(null);
      setCancelReason("");
    } catch (err) {
      toast("error", errorMessage(err, "Could not cancel purchase order."));
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase orders"
        description="Create, receive and manage purchase orders."
        actions={
          canCreate ? (
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" /> New purchase order
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-64">
          <Input
            placeholder="Search reference…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          className="w-full sm:w-40"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="received">Received</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </div>

      <Card>
        {purchasesQuery.isLoading ? (
          <TableSkeleton
            columns={[
              "Reference",
              "Supplier",
              { label: "Items", align: "right" },
              { label: "Total", align: "right" },
              "Date",
              "Status",
              { label: "Actions", align: "right" },
            ]}
          />
        ) : purchases.length === 0 ? (
          <EmptyState
            title="No purchase orders"
            description="Create your first purchase order to get started."
            action={
              canCreate ? (
                <Button onClick={() => setModalOpen(true)}>
                  <Plus className="h-4 w-4" /> New purchase order
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <Table>
              <THead>
                <Th>Reference</Th>
                <Th>Supplier</Th>
                <Th className="text-right">Items</Th>
                <Th className="text-right">Total</Th>
                <Th>Date</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </THead>
              <TBody>
                {purchases.map((p) => (
                  <Tr key={p._id}>
                    <Td>
                      <span className="font-mono text-sm font-semibold text-slate-800">
                        {p.referenceNo}
                      </span>
                    </Td>
                    <Td className="text-slate-600">{supplierMap.get(p.supplier) ?? "—"}</Td>
                    <Td className="text-right text-slate-600">{p.items.length}</Td>
                    <Td className="text-right font-semibold text-slate-800">
                      {formatCurrency(p.totalAmount)}
                    </Td>
                    <Td className="text-slate-500">{formatDate(p.createdAt)}</Td>
                    <Td>
                      <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
                    </Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="View details"
                          onClick={() => setViewing(p)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {p.status === "pending" && canCreate && (
                          <Button variant="success" size="sm" onClick={() => setReceiving(p)}>
                            <PackageCheck className="h-3.5 w-3.5" /> Receive
                          </Button>
                        )}
                        {p.status === "pending" && canCancel && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => setCancelling(p)}
                          >
                            <XCircle className="h-3.5 w-3.5" /> Cancel
                          </Button>
                        )}
                      </div>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              totalCount={purchasesQuery.data?.totalCount ?? 0}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>

      <PurchaseFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        products={productsQuery.data?.products ?? []}
        suppliers={suppliers}
      />

      {/* Purchase details */}
      <Modal
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title={`Purchase ${viewing?.referenceNo}`}
        subtitle={`${supplierMap.get(viewing?.supplier ?? "") ?? "Unknown supplier"} · ${formatDate(
          viewing?.purchaseDate ?? viewing?.createdAt,
        )}`}
        size="lg"
        footer={
          <>
            <div className="mr-auto flex items-center gap-2 text-sm">
              <span className="text-slate-500">Total:</span>
              <span className="text-lg font-bold text-slate-900">
                {formatCurrency(viewing?.totalAmount)}
              </span>
            </div>
            <Button variant="outline" onClick={() => setViewing(null)}>
              Close
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant(viewing?.status ?? "pending")}>{viewing?.status}</Badge>
            {viewing?.note && <p className="text-sm text-slate-500">Note: {viewing.note}</p>}
          </div>
          {viewing?.cancelReason && (
            <div className="rounded-lg border border-error-100 bg-error-50 px-4 py-3 text-sm text-error-700">
              <span className="font-semibold">Cancelled:</span> {viewing.cancelReason}
            </div>
          )}
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-right">Unit cost</th>
                  <th className="px-3 py-2 text-right">Line total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {viewing?.items.map((it) => (
                  <tr key={it._id}>
                    <td className="px-3 py-2">
                      <span className="font-medium text-slate-800">
                        {productMap.get(it.product)?.productName ?? "Unknown product"}
                      </span>
                      {productMap.get(it.product)?.sku && (
                        <span className="ml-1.5 font-mono text-xs text-slate-400">
                          {productMap.get(it.product)?.sku}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-600">{it.quantity}</td>
                    <td className="px-3 py-2 text-right text-slate-600">
                      {formatCurrency(it.unitCost)}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-800">
                      {formatCurrency(it.totalCost ?? it.quantity * it.unitCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* Receive confirmation */}
      <Modal
        open={Boolean(receiving)}
        onClose={() => setReceiving(null)}
        title="Receive purchase order"
        subtitle={receiving?.referenceNo}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setReceiving(null)} disabled={receiveLoading}>
              Cancel
            </Button>
            <Button variant="success" onClick={handleReceive} loading={receiveLoading}>
              Confirm receive
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Receiving this order adds stock for all{" "}
          <span className="font-semibold">{receiving?.items.length}</span> line items to the
          warehouse and updates their cost prices. Total amount:{" "}
          <span className="font-semibold text-slate-900">
            {formatCurrency(receiving?.totalAmount)}
          </span>
          .
        </p>
      </Modal>

      {/* Cancel confirmation */}
      <Modal
        open={Boolean(cancelling)}
        onClose={() => {
          setCancelling(null);
          setCancelReason("");
        }}
        title="Cancel purchase order"
        subtitle={cancelling?.referenceNo}
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setCancelling(null);
                setCancelReason("");
              }}
              disabled={cancelLoading}
            >
              Back
            </Button>
            <Button variant="danger" onClick={handleCancel} loading={cancelLoading}>
              Cancel order
            </Button>
          </>
        }
      >
        <Label htmlFor="cancelReason">Reason for cancellation</Label>
        <Textarea
          id="cancelReason"
          placeholder="Explain why this order is being cancelled"
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
        />
      </Modal>
    </div>
  );
}
