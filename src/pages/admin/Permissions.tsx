import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Plus, Trash2 } from "lucide-react";
import { permissionsApi } from "../../api/permissions";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Table, THead, Th, TBody, Tr, Td } from "../../components/ui/Table";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
import { errorMessage } from "../../lib/api";
import { PermissionFormModal } from "../../components/forms/PermissionFormModal";
import type { Permission } from "../../types";

export function PermissionsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Permission | null>(null);
  const [deleting, setDeleting] = useState<Permission | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const permissionsQuery = useQuery({
    queryKey: ["permissions"],
    queryFn: () => permissionsApi.list(),
  });

  const permissions = permissionsQuery.data?.permissions ?? [];

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await permissionsApi.remove(deleting._id);
      toast("success", "Permission deleted.");
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setDeleting(null);
    } catch (err) {
      toast("error", errorMessage(err, "Could not delete permission."));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permissions"
        description="Granular resource+action access rules."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add permission
          </Button>
        }
      />

      <Card>
        {permissionsQuery.isLoading ? (
          <TableSkeleton
            columns={[
              "Name",
              "Resource",
              "Action",
              "Description",
              { label: "Actions", align: "right" },
            ]}
          />
        ) : permissions.length === 0 ? (
          <EmptyState
            title="No permissions yet"
            description="Run the backend seed script to create the default permission matrix."
            action={
              <Button
                onClick={() => {
                  setEditing(null);
                  setModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4" /> Add permission
              </Button>
            }
          />
        ) : (
          <Table>
            <THead>
              <Th>Name</Th>
              <Th>Resource</Th>
              <Th>Action</Th>
              <Th>Description</Th>
              <Th className="text-right">Actions</Th>
            </THead>
            <TBody>
              {permissions.map((p) => (
                <Tr key={p._id}>
                  <Td>
                    <span className="flex items-center gap-2 font-semibold text-slate-800">
                      <KeyRound className="h-4 w-4 text-slate-400" />
                      {p.name}
                    </span>
                  </Td>
                  <Td>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">
                      {p.resource}
                    </span>
                  </Td>
                  <Td>
                    <Badge variant="brand">{p.action}</Badge>
                  </Td>
                  <Td className="text-slate-500">{p.description || "—"}</Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditing(p);
                          setModalOpen(true);
                        }}
                      >
                        <KeyRound className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => setDeleting(p)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <PermissionFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        permission={editing}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete permission"
        message={`"${deleting?.name}" will be deleted from all roles that use it.`}
      />
    </div>
  );
}
