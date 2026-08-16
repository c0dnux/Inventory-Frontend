import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { adjustmentsApi } from "../api/adjustments";
import { productsApi } from "../api/products";
import { useAuth } from "../auth/AuthContext";
import { hasPermission } from "../lib/permissions";
import { formatDateTime, formatNumber } from "../lib/format";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Table, THead, Th, TBody, Tr, Td } from "../components/ui/Table";
import { Pagination } from "../components/ui/Pagination";
import { TableSkeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { AdjustmentFormModal } from "../components/forms/AdjustmentFormModal";
import { cn } from "../lib/format";
import type { AdjustmentType } from "../types";

const PAGE_SIZE = 15;

const typeMeta: Record<AdjustmentType, { label: string; tone: "success" | "danger" | "info" }> = {
  stock_in: { label: "Stock in", tone: "success" },
  stock_out: { label: "Stock out", tone: "danger" },
  adjustment: { label: "Adjustment", tone: "info" },
};

export function AdjustmentsPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const canAdjust = hasPermission(user, "stock:adjust");

  const productsQuery = useQuery({
    queryKey: ["products", "select"],
    queryFn: () => productsApi.list({ limit: 1000 }),
    staleTime: 5 * 60 * 1000,
  });

  const adjustmentsQuery = useQuery({
    queryKey: ["adjustments", { page }],
    queryFn: () => adjustmentsApi.list({ page, limit: PAGE_SIZE, sort: "-createdAt" }),
  });

  const adjustments = adjustmentsQuery.data?.adjustments ?? [];
  const productMap = useMemo(
    () => new Map((productsQuery.data?.products ?? []).map((p) => [p._id, p.productName])),
    [productsQuery.data],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock adjustments"
        description="Manual corrections to product stock levels."
        actions={
          canAdjust ? (
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" /> New adjustment
            </Button>
          ) : undefined
        }
      />

      <Card>
        {adjustmentsQuery.isLoading ? (
          <TableSkeleton
            columns={[
              "Product",
              "Type",
              { label: "Quantity", align: "right" },
              { label: "Adjusted to", align: "right" },
              { label: "Variance", align: "right" },
              "Reason",
              "Date",
            ]}
          />
        ) : adjustments.length === 0 ? (
          <EmptyState
            title="No adjustments yet"
            description="Recorded adjustments will appear here."
            action={
              canAdjust ? (
                <Button onClick={() => setModalOpen(true)}>
                  <Plus className="h-4 w-4" /> New adjustment
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <Table>
              <THead>
                <Th>Product</Th>
                <Th>Type</Th>
                <Th className="text-right">Quantity</Th>
                <Th className="text-right">Adjusted to</Th>
                <Th className="text-right">Variance</Th>
                <Th>Reason</Th>
                <Th>Date</Th>
              </THead>
              <TBody>
                {adjustments.map((a) => {
                  const meta = typeMeta[a.type];
                  return (
                    <Tr key={a._id}>
                      <Td className="font-medium text-slate-800">
                        {productMap.get(a.product) ?? a.product.slice(0, 8)}
                      </Td>
                      <Td>
                        <Badge variant={meta.tone}>{meta.label}</Badge>
                      </Td>
                      <Td className="text-right text-slate-600">{formatNumber(a.quantity)}</Td>
                      <Td className="text-right font-semibold text-slate-800">
                        {formatNumber(a.adjustedQuantity)}
                      </Td>
                      <Td
                        className={cn(
                          "text-right font-bold",
                          a.variance > 0
                            ? "text-emerald-600"
                            : a.variance < 0
                              ? "text-red-600"
                              : "text-slate-500",
                        )}
                      >
                        {a.variance > 0 ? "+" : ""}
                        {formatNumber(a.variance)}
                      </Td>
                      <Td className="max-w-[180px]">
                        <p className="truncate text-slate-600">{a.reason}</p>
                        {a.note && <p className="truncate text-xs text-slate-400">{a.note}</p>}
                      </Td>
                      <Td className="text-slate-500">{formatDateTime(a.createdAt)}</Td>
                    </Tr>
                  );
                })}
              </TBody>
            </Table>
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              totalCount={adjustmentsQuery.data?.totalCount ?? 0}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>

      <AdjustmentFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        products={productsQuery.data?.products ?? []}
      />
    </div>
  );
}
