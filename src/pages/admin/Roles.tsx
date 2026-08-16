import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Plus, Shield, Trash2 } from "lucide-react";
import { rolesApi } from "../../api/roles";
import { permissionsApi } from "../../api/permissions";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge, statusVariant } from "../../components/ui/Badge";
import { CardGridSkeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
import { errorMessage } from "../../lib/api";
import { RoleFormModal } from "../../components/forms/RoleFormModal";
import type { Role } from "../../types";

export function RolesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState<Role | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const rolesQuery = useQuery({
    queryKey: ["roles"],
    queryFn: () => rolesApi.list(),
  });
  const permissionsQuery = useQuery({
    queryKey: ["permissions"],
    queryFn: () => permissionsApi.list(),
  });

  const roles = rolesQuery.data?.roles ?? [];
  const permissions = permissionsQuery.data?.permissions ?? [];

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await rolesApi.remove(deleting._id);
      toast("success", "Role deleted.");
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setDeleting(null);
    } catch (err) {
      toast("error", errorMessage(err, "Could not delete role."));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles"
        description="Define role-based access for your team."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Create role
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rolesQuery.isLoading ? (
          <CardGridSkeleton />
        ) : roles.length === 0 ? (
          <Card>
            <CardContent>
              <EmptyState
                title="No roles yet"
                description="Run the backend seed script to create default roles, or create one below."
                action={
                  <Button
                    onClick={() => {
                      setEditing(null);
                      setModalOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4" /> Create role
                  </Button>
                }
              />
            </CardContent>
          </Card>
        ) : (
          roles.map((role) => (
            <Card key={role._id} className="flex flex-col">
              <CardContent className="flex-1">
                <div className="flex items-start justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Shield className="h-5 w-5" />
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing(role);
                        setModalOpen(true);
                      }}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => setDeleting(role)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">{role.name}</h3>
                  <Badge variant={statusVariant(role.isActive ? "active" : "inactive")}>
                    {role.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-slate-500">{role.description || "—"}</p>
              </CardContent>
              <div className="border-t border-slate-100 px-5 py-3">
                <p className="text-xs font-medium text-slate-500">
                  {role.permissions.length} permission{role.permissions.length === 1 ? "" : "s"}
                </p>
              </div>
            </Card>
          ))
        )}
      </div>

      <RoleFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        role={editing}
        permissions={permissions}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete role"
        message={`Role "${deleting?.name}" will be deleted. Users assigned to it may lose access.`}
      />
    </div>
  );
}
