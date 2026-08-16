import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Download, Edit3, Plus, Search, Trash2 } from "lucide-react";
import { productsApi } from "../api/products";
import { categoriesApi } from "../api/categories";
import { unitsApi } from "../api/units";
import { useAuth } from "../auth/AuthContext";
import { hasPermission } from "../lib/permissions";
import { useDebounce } from "../lib/useDebounce";
import { formatCurrency, formatNumber } from "../lib/format";
import { downloadCsv } from "../lib/csv";
import { optimisticRemove, snapshotQueries, restoreQueries } from "../lib/queryCache";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Form";
import { Badge, statusVariant } from "../components/ui/Badge";
import { Table, THead, Th, TBody, Tr, Td } from "../components/ui/Table";
import { Pagination } from "../components/ui/Pagination";
import { TableSkeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useToast } from "../components/ui/Toast";
import { errorMessage } from "../lib/api";
import { ProductFormModal } from "../components/forms/ProductFormModal";
import type { Product } from "../types";

const PAGE_SIZE = 15;

export function ProductsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 350);

  // Sync with the topbar global search (`/products?search=...`).
  useEffect(() => {
    setSearch(searchParams.get("search") ?? "");
    setPage(1);
  }, [searchParams]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);

  const canCreate = hasPermission(user, "products:create");
  const canUpdate = hasPermission(user, "products:update");
  const canDelete = hasPermission(user, "products:delete");

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.list({ limit: 100 }),
    staleTime: 5 * 60 * 1000,
  });
  const unitsQuery = useQuery({
    queryKey: ["units"],
    queryFn: () => unitsApi.list({ limit: 100 }),
    staleTime: 5 * 60 * 1000,
  });

  const productsQuery = useQuery({
    queryKey: ["products", { page, search: debouncedSearch, category, status }],
    queryFn: () =>
      productsApi.list({
        page,
        limit: PAGE_SIZE,
        sort: "-createdAt",
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(category ? { category } : {}),
        ...(status ? { status } : {}),
      }),
  });

  const products = productsQuery.data?.products ?? [];
  const categories = categoriesQuery.data?.categories ?? [];
  const units = unitsQuery.data?.units ?? [];

  const categoryMap = new Map(categories.map((c) => [c._id, c.name]));
  const unitMap = new Map(units.map((u) => [u._id, u.name]));

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.remove(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["products"] });
      const snapshot = snapshotQueries(queryClient, "products");
      optimisticRemove<Product>(queryClient, "products", id);
      return { snapshot };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.snapshot) restoreQueries(queryClient, ctx.snapshot);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await deleteMutation.mutateAsync(deleting._id);
      toast("success", "Product deleted.");
      setDeleting(null);
    } catch (err) {
      toast("error", errorMessage(err, "Could not delete product."));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExport = async () => {
    setExportingCsv(true);
    try {
      const res = await productsApi.list({
        limit: 10000,
        sort: "-createdAt",
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(category ? { category } : {}),
        ...(status ? { status } : {}),
      });
      const rows = res.products.map((p) => [
        p.productName,
        p.sku,
        p.barcode ?? "",
        categoryMap.get(p.category) ?? "",
        unitMap.get(p.unit) ?? "",
        p.currentStock,
        p.costPrice,
        p.sellingPrice,
        p.stockValue,
        p.reorderLevel,
        p.status,
      ]);
      downloadCsv(
        `products-${new Date().toISOString().slice(0, 10)}.csv`,
        [
          "Name",
          "SKU",
          "Barcode",
          "Category",
          "Unit",
          "Stock",
          "Cost price",
          "Selling price",
          "Stock value",
          "Reorder level",
          "Status",
        ],
        rows,
      );
      toast("success", `Exported ${rows.length} product${rows.length === 1 ? "" : "s"} to CSV.`);
    } catch (err) {
      toast("error", errorMessage(err, "Could not export products."));
    } finally {
      setExportingCsv(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage your catalog and monitor stock levels."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport} loading={exportingCsv}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            {canCreate ? (
              <Button
                onClick={() => {
                  setEditing(null);
                  setModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4" /> Add product
              </Button>
            ) : undefined}
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search products…"
            value={search}
            onChange={(e) => {
              const value = e.target.value;
              setSearch(value);
              setPage(1);
              setSearchParams(value ? { search: value } : {}, { replace: true });
            }}
            className="pl-9"
          />
        </div>
        <Select
          className="w-full sm:w-44"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select
          className="w-full sm:w-40"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="discontinued">Discontinued</option>
        </Select>
      </div>

      <Card>
        {productsQuery.isLoading ? (
          <TableSkeleton
            columns={[
              "Product",
              "Category",
              { label: "Stock", align: "right" },
              { label: "Cost", align: "right" },
              { label: "Selling", align: "right" },
              { label: "Stock value", align: "right" },
              "Status",
              ...(canUpdate || canDelete ? [{ label: "Actions", align: "right" as const }] : []),
            ]}
          />
        ) : products.length === 0 ? (
          <EmptyState
            title="No products found"
            description="Try adjusting your filters or create a new product."
            action={
              canCreate ? (
                <Button
                  onClick={() => {
                    setEditing(null);
                    setModalOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" /> Add product
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <Table>
              <THead>
                <Th>Product</Th>
                <Th>Category</Th>
                <Th className="text-right">Stock</Th>
                <Th className="text-right">Cost</Th>
                <Th className="text-right">Selling</Th>
                <Th className="text-right">Stock value</Th>
                <Th>Status</Th>
                {(canUpdate || canDelete) && <Th className="text-right">Actions</Th>}
              </THead>
              <TBody>
                {products.map((p) => (
                  <Tr key={p._id}>
                    <Td>
                      <p className="font-semibold text-slate-800">{p.productName}</p>
                      <p className="font-mono text-xs text-slate-400">{p.sku}</p>
                    </Td>
                    <Td>
                      <p className="text-slate-600">{categoryMap.get(p.category) ?? "—"}</p>
                      <p className="text-xs text-slate-400">{unitMap.get(p.unit) ?? "—"}</p>
                    </Td>
                    <Td className="text-right">
                      <span
                        className={
                          p.isOutOfStock
                            ? "font-bold text-red-600"
                            : p.isLowStock
                              ? "font-bold text-amber-600"
                              : "font-semibold text-slate-800"
                        }
                      >
                        {formatNumber(p.currentStock)}
                      </span>
                      <p className="text-xs text-slate-400">reorder {p.reorderLevel}</p>
                    </Td>
                    <Td className="text-right text-slate-600">{formatCurrency(p.costPrice)}</Td>
                    <Td className="text-right text-slate-600">{formatCurrency(p.sellingPrice)}</Td>
                    <Td className="text-right font-medium text-slate-800">
                      {formatCurrency(p.stockValue)}
                    </Td>
                    <Td>
                      <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
                    </Td>
                    {(canUpdate || canDelete) && (
                      <Td className="text-right">
                        <div className="flex justify-end gap-1">
                          {canUpdate && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Edit"
                              onClick={() => {
                                setEditing(p);
                                setModalOpen(true);
                              }}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Delete"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => setDeleting(p)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </Td>
                    )}
                  </Tr>
                ))}
              </TBody>
            </Table>
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              totalCount={productsQuery.data?.totalCount ?? 0}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>

      <ProductFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        product={editing}
        categories={categories}
        units={units}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete product"
        message={`"${deleting?.productName}" will be soft-deleted. This hides it from the catalog and inventory.`}
      />
    </div>
  );
}
