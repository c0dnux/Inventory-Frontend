import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Plus, Trash2 } from "lucide-react";
import { suppliersApi } from "../api/suppliers";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Form";
import { Badge, statusVariant } from "../components/ui/Badge";
import { Table, THead, Th, TBody, Tr, Td } from "../components/ui/Table";
import { Pagination } from "../components/ui/Pagination";
import { TableSkeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useToast } from "../components/ui/Toast";
import { errorMessage } from "../lib/api";
import { SupplierFormModal } from "../components/forms/SupplierFormModal";
import type { Supplier } from "../types";

const PAGE_SIZE = 15;

export function SuppliersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState<Supplier | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const suppliersQuery = useQuery({
    queryKey: ["suppliers", { page, search }],
    queryFn: () =>
      suppliersApi.list({
        page,
        limit: PAGE_SIZE,
        sort: "-createdAt",
        ...(search ? { name: search } : {}),
      }),
  });

  const suppliers = suppliersQuery.data?.suppliers ?? [];

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await suppliersApi.remove(deleting._id);
      toast("success", "Supplier deleted.");
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setDeleting(null);
    } catch (err) {
      toast("error", errorMessage(err, "Could not delete supplier."));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suppliers"
        description="Manage the suppliers you purchase from."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add supplier
          </Button>
        }
      />

      <div className="w-full sm:w-72">
        <Input
          placeholder="Search suppliers…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <Card>
        {suppliersQuery.isLoading ? (
          <TableSkeleton
            columns={[
              "Name",
              "Contact",
              "Location",
              "Status",
              { label: "Actions", align: "right" },
            ]}
          />
        ) : suppliers.length === 0 ? (
          <EmptyState
            title="No suppliers yet"
            description="Add your first supplier to start creating purchase orders."
            action={
              <Button
                onClick={() => {
                  setEditing(null);
                  setModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4" /> Add supplier
              </Button>
            }
          />
        ) : (
          <>
            <Table>
              <THead>
                <Th>Name</Th>
                <Th>Contact</Th>
                <Th>Location</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </THead>
              <TBody>
                {suppliers.map((s) => (
                  <Tr key={s._id}>
                    <Td>
                      <p className="font-semibold text-slate-800">{s.name}</p>
                      <p className="text-xs text-slate-400">
                        {[s.address?.city, s.address?.country].filter(Boolean).join(", ") || "—"}
                      </p>
                    </Td>
                    <Td>
                      <p className="text-slate-600">{s.contactPerson || "—"}</p>
                      <p className="text-xs text-slate-400">{s.email || s.phone || "—"}</p>
                    </Td>
                    <Td className="text-slate-500">{s.phone || "—"}</Td>
                    <Td>
                      <Badge variant={statusVariant(s.isActive ? "active" : "inactive")}>
                        {s.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditing(s);
                            setModalOpen(true);
                          }}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => setDeleting(s)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              totalCount={suppliersQuery.data?.totalCount ?? 0}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>

      <SupplierFormModal open={modalOpen} onClose={() => setModalOpen(false)} supplier={editing} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete supplier"
        message={`"${deleting?.name}" will be deleted.`}
      />
    </div>
  );
}
