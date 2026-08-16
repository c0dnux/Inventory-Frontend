import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  CircleDollarSign,
  Package,
} from "lucide-react";
import { productsApi } from "../api/products";
import { movementsApi } from "../api/movements";
import { useAuth } from "../auth/AuthContext";
import { brand } from "../config/branding";
import { PageHeader } from "../components/ui/PageHeader";
import { StatCard } from "../components/ui/StatCard";
import { Card, CardHeader, CardContent } from "../components/ui/Card";
import { Badge, statusVariant } from "../components/ui/Badge";
import { Table, THead, Th, TBody, Tr, Td } from "../components/ui/Table";
import { InlineLoader } from "../components/ui/Loader";
import { EmptyState } from "../components/ui/EmptyState";
import { AreaChart } from "../components/charts/AreaChart";
import { formatCurrency, formatDateTime, cn, isOutgoingMovement } from "../lib/format";

function last14DaysMovements(movements: { createdAt: string; quantity: number }[]) {
  const days: { label: string; value: number }[] = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    const key = day.toDateString();
    const total = movements
      .filter((m) => new Date(m.createdAt).toDateString() === key)
      .reduce((sum, m) => sum + Math.abs(m.quantity), 0);
    days.push({ label: day.toLocaleDateString(undefined, { weekday: "short" }), value: total });
  }
  return days;
}

export function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] ?? "there";

  const dashboardQuery = useQuery({
    queryKey: ["products", "dashboard"],
    queryFn: () => productsApi.dashboard(),
  });

  const movementsQuery = useQuery({
    queryKey: ["movements", "recent"],
    queryFn: () => movementsApi.list({ limit: 300, sort: "-createdAt" }),
  });

  const stats = dashboardQuery.data;
  const movements = movementsQuery.data?.movements ?? [];
  const lowStockProducts = stats?.lowStockProducts ?? [];
  const lowStock = lowStockProducts.filter((p) => p.currentStock > 0);
  const outOfStock = lowStockProducts.filter((p) => p.currentStock === 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hello, ${firstName} 👋`}
        description="Here's what's happening with your inventory today."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
        <StatCard
          label="Total products"
          value={dashboardQuery.isLoading ? "…" : (stats?.totalProducts ?? 0)}
          icon={Package}
          tone="brand"
          hint="Across all categories"
        />
        <StatCard
          label="Stock value"
          value={dashboardQuery.isLoading ? "…" : formatCurrency(stats?.totalStockValue ?? 0)}
          icon={CircleDollarSign}
          tone="success"
          hint={`In ${brand.currency}`}
        />
        <StatCard
          label="Low stock"
          value={dashboardQuery.isLoading ? "…" : (stats?.lowStockItems ?? 0)}
          icon={AlertTriangle}
          tone="warning"
          hint="At or below reorder level"
        />
        <StatCard
          label="Out of stock"
          value={dashboardQuery.isLoading ? "…" : (stats?.outOfStockItems ?? 0)}
          icon={ArrowDownCircle}
          tone="danger"
          hint="Needs replenishment"
        />
      </div>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* Stock activity chart */}
        <Card className="col-span-12 xl:col-span-7">
          <CardHeader
            title="Stock activity"
            subtitle="Units moved per day over the last 14 days"
            actions={
              <Link
                to="/movements"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
              >
                View all
              </Link>
            }
          />
          <CardContent>
            {movementsQuery.isLoading ? (
              <InlineLoader />
            ) : movements.length === 0 ? (
              <EmptyState title="No movements yet" description="Stock activity will appear here." />
            ) : (
              <AreaChart data={last14DaysMovements(movements)} />
            )}
          </CardContent>
        </Card>

        {/* Recent movements */}
        <Card className="col-span-12 xl:col-span-5">
          <CardHeader
            title="Recent movements"
            subtitle="Latest stock activity"
            actions={
              <Link
                to="/movements"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
              >
                View all
              </Link>
            }
          />
          <CardContent className="p-0">
            {movementsQuery.isLoading ? (
              <InlineLoader />
            ) : movements.length === 0 ? (
              <EmptyState title="No movements yet" description="Stock activity will appear here." />
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-gray-800">
                {movements.slice(0, 8).map((m) => {
                  const outgoing = isOutgoingMovement(m.type);
                  return (
                    <li key={m._id} className="flex items-center gap-3 px-5 py-3">
                      <span
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                          outgoing
                            ? "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500"
                            : "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500",
                        )}
                      >
                        {outgoing ? (
                          <ArrowDownCircle className="h-5 w-5" />
                        ) : (
                          <ArrowUpCircle className="h-5 w-5" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800 dark:text-white/90">
                          {m.type}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-gray-400">
                          {formatDateTime(m.createdAt)} · {m.quantityBefore} → {m.quantityAfter}
                        </p>
                      </div>
                      <Badge variant={statusVariant(m.type)}>
                        {outgoing ? "-" : "+"}
                        {Math.abs(m.quantity)}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Low stock */}
        <Card className="col-span-12">
          <CardHeader
            title="Low stock alerts"
            subtitle="Products that need restocking"
            actions={
              <Link
                to="/products"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
              >
                View all products
              </Link>
            }
          />
          <CardContent className="p-0">
            {dashboardQuery.isLoading ? (
              <InlineLoader />
            ) : lowStock.length === 0 && outOfStock.length === 0 ? (
              <EmptyState
                title="All stock levels look healthy"
                description="No products are running low right now."
              />
            ) : (
              <Table>
                <THead>
                  <Th>Product</Th>
                  <Th>SKU</Th>
                  <Th className="text-right">Stock</Th>
                  <Th className="text-right">Reorder level</Th>
                  <Th>Status</Th>
                </THead>
                <TBody>
                  {[...outOfStock, ...lowStock].slice(0, 8).map((p) => (
                    <Tr key={p._id}>
                      <Td>
                        <p className="font-semibold text-slate-800 dark:text-white/90">
                          {p.productName}
                        </p>
                      </Td>
                      <Td>
                        <span className="font-mono text-xs text-slate-500 dark:text-gray-400">
                          {p.sku}
                        </span>
                      </Td>
                      <Td className="text-right">
                        <span
                          className={cn(
                            "font-bold",
                            p.currentStock === 0 ? "text-error-500" : "text-warning-500",
                          )}
                        >
                          {p.currentStock}
                        </span>
                      </Td>
                      <Td className="text-right text-slate-500 dark:text-gray-400">
                        {p.reorderLevel}
                      </Td>
                      <Td>
                        <Badge variant={p.currentStock === 0 ? "danger" : "warning"}>
                          {p.currentStock === 0 ? "Out of stock" : "Low stock"}
                        </Badge>
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
