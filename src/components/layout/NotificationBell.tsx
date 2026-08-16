import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { notificationsApi } from "../../api/notifications";
import { useAuth } from "../../auth/AuthContext";
import { timeAgo } from "../../lib/format";
import { cn } from "../../lib/format";
import { useNavigate } from "react-router-dom";
import { useToast } from "../ui/Toast";
import { Spinner } from "../ui/Loader";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["notifications", "recent"],
    queryFn: () => notificationsApi.list({ limit: 8 }, { skipErrorToast: true }),
    refetchInterval: 30000,
    enabled: !!user,
  });

  const notifications = data?.notifications ?? [];
  const unread = notifications.filter((n) => !n.isRead).length;

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast("success", "All notifications marked as read");
    } catch {
      toast("error", "Could not mark notifications as read");
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-error-500 px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="fixed inset-x-3 z-40 mt-3 animate-scale-in overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-lg lg:absolute lg:inset-x-auto lg:right-0 lg:w-[min(22rem,calc(100vw-2rem))] dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <p className="text-sm font-semibold text-slate-900 dark:text-white/90">
                Notifications
              </p>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                >
                  <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner className="text-brand-500" />
                </div>
              ) : notifications.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-slate-500 dark:text-gray-400">
                  You're all caught up.
                </p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n._id}
                    onClick={() => {
                      setOpen(false);
                      navigate("/notifications");
                    }}
                    className={cn(
                      "block w-full border-b border-gray-50 px-4 py-3 text-left transition hover:bg-slate-50 dark:border-gray-800 dark:hover:bg-white/[0.03]",
                      !n.isRead && "bg-brand-50/50 dark:bg-brand-500/[0.08]",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {!n.isRead && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800 dark:text-white/90">
                          {n.title}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-gray-400">
                          {n.message}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-400 dark:text-gray-500">
                          {timeAgo(n.createdAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
