import { NavLink } from "react-router-dom";
import {
  Bell,
  History,
  KeyRound,
  LayoutDashboard,
  Package,
  Ruler,
  ScrollText,
  Settings2,
  Shield,
  ShoppingCart,
  SlidersHorizontal,
  Tags,
  Truck,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../../lib/format";
import { brand } from "../../config/branding";
import { useAuth } from "../../auth/AuthContext";
import { hasPermission } from "../../lib/permissions";
import { useSidebar } from "../../context/SidebarContext";

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  show?: boolean;
}

function Logo({ showText }: { showText: boolean }) {
  return (
    <NavLink
      to="/"
      className={cn("flex items-center gap-3 py-2", showText ? "justify-start" : "justify-center")}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white">
        {brand.logoMark}
      </span>
      {showText && (
        <span className="leading-tight">
          <span className="block text-sm font-bold text-slate-900 dark:text-white">
            {brand.name}
          </span>
          <span className="block text-[11px] font-medium text-slate-400">{brand.tagline}</span>
        </span>
      )}
    </NavLink>
  );
}

function NavItemLink({
  item,
  showText,
  onNavigate,
}: {
  item: NavItem;
  showText: boolean;
  onNavigate?: () => void;
}) {
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      end={item.to === "/"}
      title={showText ? undefined : item.label}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
          showText ? "justify-start" : "justify-center",
          isActive
            ? "bg-brand-50 text-brand-500 dark:bg-brand-500/[0.12] dark:text-brand-400"
            : "text-slate-700 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-gray-300",
        )
      }
    >
      <item.icon className="h-6 w-6 shrink-0 text-slate-500 group-hover:text-slate-700 dark:text-gray-400 dark:group-hover:text-gray-300" />
      {showText && item.label}
    </NavLink>
  );
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();

  const showText = isExpanded || isHovered || isMobileOpen;

  const menu: NavItem[] = [
    { label: "Dashboard", to: "/", icon: LayoutDashboard },
    { label: "Products", to: "/products", icon: Package },
    { label: "Purchases", to: "/purchases", icon: ShoppingCart },
    {
      label: "Suppliers",
      to: "/suppliers",
      icon: Truck,
      show: hasPermission(user, "suppliers:manage"),
    },
    { label: "Stock Adjustments", to: "/adjustments", icon: SlidersHorizontal },
    { label: "Stock Movements", to: "/movements", icon: History },
    { label: "Categories", to: "/categories", icon: Tags },
    { label: "Units", to: "/units", icon: Ruler },
    { label: "Notifications", to: "/notifications", icon: Bell },
  ];

  const admin: NavItem[] = [
    {
      label: "Roles",
      to: "/admin/roles",
      icon: Shield,
      show: hasPermission(user, "roles:manage"),
    },
    {
      label: "Permissions",
      to: "/admin/permissions",
      icon: KeyRound,
      show: hasPermission(user, "permissions:manage"),
    },
    {
      label: "Audit Logs",
      to: "/admin/audits",
      icon: ScrollText,
      show: hasPermission(user, "audits:read"),
    },
    {
      label: "Profile",
      to: "/profile",
      icon: UserRound,
    },
  ];

  const visibleMenu = menu.filter((i) => i.show !== false);
  const visibleAdmin = admin.filter((i) => i.show !== false);

  return (
    <aside
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-gray-200 bg-white px-5 text-slate-900 transition-all duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-900 dark:text-white",
        isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]",
        isMobileOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0",
      )}
    >
      <div className={cn("flex py-7", showText ? "justify-start" : "justify-center")}>
        <Logo showText={showText} />
      </div>

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto pb-6 no-scrollbar">
        <div>
          <h2
            className={cn(
              "mb-3 flex text-xs font-medium uppercase leading-5 tracking-wide text-slate-400 dark:text-gray-400",
              showText ? "justify-start" : "justify-center",
            )}
          >
            {showText ? "Menu" : <Settings2 className="h-5 w-5" />}
          </h2>
          <ul className="flex flex-col gap-1">
            {visibleMenu.map((item) => (
              <li key={item.to}>
                <NavItemLink item={item} showText={showText} onNavigate={onNavigate} />
              </li>
            ))}
          </ul>
        </div>

        {visibleAdmin.length > 0 && (
          <div>
            <h2
              className={cn(
                "mb-3 flex text-xs font-medium uppercase leading-5 tracking-wide text-slate-400 dark:text-gray-400",
                showText ? "justify-start" : "justify-center",
              )}
            >
              {showText ? "System" : <Settings2 className="h-5 w-5" />}
            </h2>
            <ul className="flex flex-col gap-1">
              {visibleAdmin.map((item) => (
                <li key={item.to}>
                  <NavItemLink item={item} showText={showText} onNavigate={onNavigate} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>
    </aside>
  );
}
