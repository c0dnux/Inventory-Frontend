import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BellRing, CheckCheck } from "lucide-react";
import { notificationsApi } from "../api/notifications";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { ListSkeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { formatDateTime, timeAgo, cn } from "../lib/format";
import { useToast } from "../components/ui/Toast";
import { errorMessage } from "../lib/api";

const notificationVariant = (type: string) =>
  type === "out_of_stock"
    ? "danger"
    : type === "low_stock"
      ? "warning"
      : type === "purchase_received"
        ? "success"
        : type === "purchase_cancelled"
          ? "neutral"
          : "info";

export function NotificationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ["notifications", "all"],
    queryFn: () => notificationsApi.list({ limit: 50 }),
  });

  const notifications = notificationsQuery.data?.notifications ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch (err) {
      toast("error", errorMessage(err, "Could not update notification."));
    }
  };

  const markAll = async () => {
    try {
      await notificationsApi.markAllRead();
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast("success", "All notifications marked as read");
    } catch (err) {
      toast("error", errorMessage(err, "Could not mark notifications as read."));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description={
          unreadCount > 0
            ? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}.`
            : "You're all caught up."
        }
        actions={
          unreadCount > 0 ? (
            <Button variant="outline" onClick={markAll}>
              <CheckCheck className="h-4 w-4" /> Mark all read
            </Button>
          ) : undefined
        }
      />

      <Card>
        {notificationsQuery.isLoading ? (
          <ListSkeleton />
        ) : notifications.length === 0 ? (
          <EmptyState
            title="No notifications"
            description="Stock alerts and purchase updates will show up here."
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {notifications.map((n) => (
              <li
                key={n._id}
                className={cn(
                  "flex items-start gap-4 px-5 py-4 transition",
                  !n.isRead && "bg-brand-50/50 dark:bg-brand-500/10",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                    !n.isRead
                      ? "bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
                      : "bg-slate-100 text-slate-400",
                  )}
                >
                  {!n.isRead ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                    <Badge variant={notificationVariant(n.type)}>{n.type.replace(/_/g, " ")}</Badge>
                    {!n.isRead && (
                      <span className="h-2 w-2 rounded-full bg-brand-600" aria-label="Unread" />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{n.message}</p>
                  <p className="mt-1 text-xs text-slate-400" title={formatDateTime(n.createdAt)}>
                    {timeAgo(n.createdAt)}
                  </p>
                </div>
                {!n.isRead && (
                  <Button variant="ghost" size="sm" onClick={() => markRead(n._id)}>
                    Mark read
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
