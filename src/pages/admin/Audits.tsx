import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScrollText } from "lucide-react";
import { auditsApi } from "../../api/audits";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Table, THead, Th, TBody, Tr, Td } from "../../components/ui/Table";
import { Pagination } from "../../components/ui/Pagination";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { Input } from "../../components/ui/Form";
import { formatDateTime } from "../../lib/format";
import { useDebounce } from "../../lib/useDebounce";

const PAGE_SIZE = 20;

const actionTone = (action: string) =>
  action === "login" || action === "create" || action === "purchase_create"
    ? "success"
    : action === "delete" || action === "purchase_cancel" || action === "logout"
      ? "danger"
      : action.includes("stock")
        ? "info"
        : "neutral";

export function AuditsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 350);

  const auditsQuery = useQuery({
    queryKey: ["audits", { page, search: debouncedSearch }],
    queryFn: () =>
      auditsApi.list({
        page,
        limit: PAGE_SIZE,
        sort: "-createdAt",
        ...(debouncedSearch ? { resource: debouncedSearch } : {}),
      }),
  });

  const audits = auditsQuery.data?.audits ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit logs"
        description="Immutable trail of actions taken across the system."
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-64">
          <Input
            placeholder="Filter by resource…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <Card>
        {auditsQuery.isLoading ? (
          <TableSkeleton columns={["Action", "Resource", "Resource ID", "Note", "IP", "Date"]} />
        ) : audits.length === 0 ? (
          <EmptyState
            title="No audit entries"
            description="Actions like logins, product changes and purchases appear here."
          />
        ) : (
          <>
            <Table>
              <THead>
                <Th>Action</Th>
                <Th>Resource</Th>
                <Th>Resource ID</Th>
                <Th>Note</Th>
                <Th>IP</Th>
                <Th>Date</Th>
              </THead>
              <TBody>
                {audits.map((a) => (
                  <Tr key={a._id}>
                    <Td>
                      <span className="flex items-center gap-2">
                        <ScrollText className="h-4 w-4 text-slate-400" />
                        <Badge variant={actionTone(a.action)}>{a.action.replace(/_/g, " ")}</Badge>
                      </span>
                    </Td>
                    <Td className="font-medium text-slate-800">{a.resource}</Td>
                    <Td>
                      <span className="font-mono text-xs text-slate-400">
                        {a.resourceId ? a.resourceId.slice(0, 12) : "—"}
                      </span>
                    </Td>
                    <Td className="max-w-xs">
                      <p className="truncate text-slate-600">{a.note || "—"}</p>
                    </Td>
                    <Td className="font-mono text-xs text-slate-500">{a.ipAddress || "—"}</Td>
                    <Td className="whitespace-nowrap text-slate-500">
                      {formatDateTime(a.createdAt)}
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              totalCount={auditsQuery.data?.totalCount ?? 0}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>
    </div>
  );
}
