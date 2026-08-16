import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { movementsApi } from "../api/movements";
import { productsApi } from "../api/products";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Badge, statusVariant } from "../components/ui/Badge";
import { Table, THead, Th, TBody, Tr, Td } from "../components/ui/Table";
import { Pagination } from "../components/ui/Pagination";
import { TableSkeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { formatDateTime, formatNumber, cn, isOutgoingMovement } from "../lib/format";
import { useMemo } from "react";

const PAGE_SIZE = 20;

export function MovementsPage() {
  const [page, setPage] = useState(1);

  const movementsQuery = useQuery({
    queryKey: ["movements", { page }],
    queryFn: () => movementsApi.list({ page, limit: PAGE_SIZE, sort: "-createdAt" }),
  });

  const productsQuery = useQuery({
    queryKey: ["products", "select"],
    queryFn: () => productsApi.list({ limit: 1000 }),
    staleTime: 5 * 60 * 1000,
  });

  const movements = movementsQuery.data?.movements ?? [];
  const productMap = useMemo(
    () => new Map((productsQuery.data?.products ?? []).map((p) => [p._id, p.productName])),
    [productsQuery.data],
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Stock movements" description="Append-only ledger of every stock change." />

      <Card>
        {movementsQuery.isLoading ? (
          <TableSkeleton
            columns={[
              "Type",
              "Product",
              { label: "Qty change", align: "right" },
              { label: "Before", align: "right" },
              { label: "After", align: "right" },
              "Reference",
              "Date",
            ]}
          />
        ) : movements.length === 0 ? (
          <EmptyState
            title="No movements yet"
            description="Stock activity will appear here as purchases are received and adjustments are made."
          />
        ) : (
          <>
            <Table>
              <THead>
                <Th>Type</Th>
                <Th>Product</Th>
                <Th className="text-right">Qty change</Th>
                <Th className="text-right">Before</Th>
                <Th className="text-right">After</Th>
                <Th>Reference</Th>
                <Th>Date</Th>
              </THead>
              <TBody>
                {movements.map((m) => {
                  const outgoing = isOutgoingMovement(m.type);
                  return (
                    <Tr key={m._id}>
                      <Td>
                        <span className="flex items-center gap-2">
                          <span
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-full",
                              outgoing
                                ? "bg-red-50 text-red-600"
                                : "bg-emerald-50 text-emerald-600",
                            )}
                          >
                            {outgoing ? (
                              <ArrowDownCircle className="h-4 w-4" />
                            ) : (
                              <ArrowUpCircle className="h-4 w-4" />
                            )}
                          </span>
                          <Badge variant={statusVariant(m.type)}>{m.type}</Badge>
                        </span>
                      </Td>
                      <Td className="font-medium text-slate-800">
                        {productMap.get(m.product) ?? m.product.slice(0, 8)}
                      </Td>
                      <Td
                        className={cn(
                          "text-right font-bold",
                          outgoing ? "text-red-600" : "text-emerald-600",
                        )}
                      >
                        {outgoing ? "-" : "+"}
                        {formatNumber(Math.abs(m.quantity))}
                      </Td>
                      <Td className="text-right text-slate-500">
                        {formatNumber(m.quantityBefore)}
                      </Td>
                      <Td className="text-right font-semibold text-slate-800">
                        {formatNumber(m.quantityAfter)}
                      </Td>
                      <Td className="text-slate-500">
                        {m.referenceType ? (
                          <span className="text-xs">
                            {m.referenceType}
                            {m.referenceId ? ` · ${m.referenceId.slice(0, 8)}` : ""}
                          </span>
                        ) : (
                          "—"
                        )}
                      </Td>
                      <Td className="text-slate-500">{formatDateTime(m.createdAt)}</Td>
                    </Tr>
                  );
                })}
              </TBody>
            </Table>
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              totalCount={movementsQuery.data?.totalCount ?? 0}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>
    </div>
  );
}
