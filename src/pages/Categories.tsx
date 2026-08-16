import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Plus, Trash2 } from "lucide-react";
import { categoriesApi } from "../api/categories";
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
import { CategoryFormModal } from "../components/forms/CategoryFormModal";
import type { Category } from "../types";

export function CategoriesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.list({ limit: 100, sort: "name" }),
  });

  const categories = categoriesQuery.data?.categories ?? [];

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await categoriesApi.remove(deleting._id);
      toast("success", "Category deleted.");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setDeleting(null);
    } catch (err) {
      toast("error", errorMessage(err, "Could not delete category."));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Organize products into categories."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add category
          </Button>
        }
      />

      <Card>
        {categoriesQuery.isLoading ? (
          <TableSkeleton
            columns={["Name", "Description", "Status", { label: "Actions", align: "right" }]}
          />
        ) : categories.length === 0 ? (
          <EmptyState
            title="No categories yet"
            description="Categories help organize your product catalog."
            action={
              <Button
                onClick={() => {
                  setEditing(null);
                  setModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4" /> Add category
              </Button>
            }
          />
        ) : (
          <Table>
            <THead>
              <Th>Name</Th>
              <Th>Description</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </THead>
            <TBody>
              {categories.map((c) => (
                <Tr key={c._id}>
                  <Td className="font-semibold text-slate-800">{c.name}</Td>
                  <Td className="text-slate-600">{c.description || "—"}</Td>
                  <Td>
                    <Badge variant={statusVariant(c.isActive ? "active" : "inactive")}>
                      {c.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditing(c);
                          setModalOpen(true);
                        }}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => setDeleting(c)}
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

      <CategoryFormModal open={modalOpen} onClose={() => setModalOpen(false)} category={editing} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete category"
        message={`"${deleting?.name}" will be deleted. Products using it are not affected.`}
      />
    </div>
  );
}
