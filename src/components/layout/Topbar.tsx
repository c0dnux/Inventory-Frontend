import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronDown, LogOut, Menu, Search, UserRound, X } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { roleName } from "../../lib/permissions";
import { cn } from "../../lib/format";
import { useSidebar } from "../../context/SidebarContext";
import { ThemeToggleButton } from "../common/ThemeToggleButton";
import { NotificationBell } from "./NotificationBell";

export function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("search") ?? "");

  const handleToggle = () => {
    if (window.innerWidth >= 1024) toggleSidebar();
    else toggleMobileSidebar();
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    navigate("/login", { replace: true });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(
      q ? { pathname: "/products", search: `?search=${encodeURIComponent(q)}` } : "/products",
    );
  };

  return (
    <header className="sticky top-0 z-30 flex w-full border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex w-full flex-col items-center justify-between gap-2 lg:flex-row lg:px-6">
        <div className="flex w-full items-center justify-between gap-2 px-3 py-3 sm:gap-4 lg:justify-normal lg:px-0 lg:py-4">
          <button
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
            className="z-30 flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 text-slate-500 transition hover:bg-slate-100 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <form
            onSubmit={handleSearchSubmit}
            className="hidden w-full max-w-[430px] lg:block"
            role="search"
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products, purchases, suppliers..."
                className="h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-4 text-sm text-slate-800 shadow-theme-xs placeholder:text-slate-400 focus:border-brand-300 focus:outline-none focus:ring-[3px] focus:ring-brand-500/10 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>
          </form>
        </div>

        <div className="flex w-full items-center justify-between gap-4 px-5 py-3 shadow-theme-md lg:w-auto lg:justify-end lg:px-0 lg:py-0 lg:shadow-none">
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggleButton />
            <NotificationBell />
          </div>

          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-3 rounded-lg p-1.5 transition hover:bg-slate-100 dark:hover:bg-gray-800"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
                  {(user?.name ?? "?")[0]?.toUpperCase()}
                </span>
              )}
              <span className="hidden text-left leading-tight sm:block">
                <span className="block text-sm font-medium text-slate-800 dark:text-gray-300">
                  {user?.name}
                </span>
                <span className="block text-xs text-slate-400 dark:text-gray-400">
                  {roleName(user)}
                </span>
              </span>
              <ChevronDown
                className={cn(
                  "hidden h-4 w-4 text-slate-400 transition-transform sm:block",
                  menuOpen && "rotate-180",
                )}
              />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 z-40 mt-3 w-[260px] animate-scale-in rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900">
                  <div className="px-3 pb-3 pt-1">
                    <p className="truncate text-sm font-medium text-slate-700 dark:text-gray-300">
                      {user?.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-400 dark:text-gray-400">
                      {user?.email}
                    </p>
                  </div>
                  <div className="border-b border-gray-200 pb-2 dark:border-gray-800">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        navigate("/profile");
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                    >
                      <UserRound className="h-5 w-5 text-slate-400 dark:text-gray-400" />
                      Profile
                    </button>
                  </div>
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-error-600 transition hover:bg-error-50 dark:text-error-400 dark:hover:bg-white/5"
                  >
                    <LogOut className="h-5 w-5" />
                    {loggingOut ? "Signing out…" : "Sign out"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
