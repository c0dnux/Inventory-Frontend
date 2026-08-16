import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Plus, Trash2 } from "lucide-react";
import { unitsApi } from "../api/units";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge, statusVariant } from "../components/ui/Badge";
import { Table, THead, Th, TBody, Tr, Td } from "../components/ui/Table";
import { TableSkeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useToast } from "../components/ui/Toast";
import { errorMessage } from "../lib/api";
import { UnitFormModal } from "../components/forms/UnitFormModal";
import type { Unit } from "../types";

export function UnitsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Unit | null>(null);
  const [deleting, setDeleting] = useState<Unit | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const unitsQuery = useQuery({
    queryKey: ["units"],
    queryFn: () => unitsApi.list({ limit: 100, sort: "name" }),
  });

  const units = unitsQuery.data?.units ?? [];

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await unitsApi.remove(deleting._id);
      toast("success", "Unit deleted.");
      queryClient.invalidateQueries({ queryKey: ["units"] });
      setDeleting(null);
    } catch (err) {
      toast("error", errorMessage(err, "Could not delete unit."));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Units of measurement"
        description="Define how products are counted (kg, pcs, litres…)."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add unit
          </Button>
        }
      />

      <Card>
        {unitsQuery.isLoading ? (
          <TableSkeleton
            columns={[
              "Name",
              "Abbreviation",
              "Description",
              "Status",
              { label: "Actions", align: "right" },
            ]}
          />
        ) : units.length === 0 ? (
          <EmptyState
            title="No units yet"
            description="Add units of measurement before creating products."
            action={
              <Button
                onClick={() => {
                  setEditing(null);
                  setModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4" /> Add unit
              </Button>
            }
          />
        ) : (
          <Table>
            <THead>
              <Th>Name</Th>
              <Th>Abbreviation</Th>
              <Th>Description</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </THead>
            <TBody>
              {units.map((u) => (
                <Tr key={u._id}>
                  <Td className="font-semibold text-slate-800">{u.name}</Td>
                  <Td>
                    <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold uppercase text-slate-700">
                      {u.abbreviation}
                    </span>
                  </Td>
                  <Td className="text-slate-600">{u.description || "—"}</Td>
                  <Td>
                    <Badge variant={statusVariant(u.isActive ? "active" : "inactive")}>
                      {u.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditing(u);
                          setModalOpen(true);
                        }}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => setDeleting(u)}
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

      <UnitFormModal open={modalOpen} onClose={() => setModalOpen(false)} unit={editing} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete unit"
        message={`"${deleting?.name}" will be deleted.`}
      />
    </div>
  );
}
