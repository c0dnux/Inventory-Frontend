import { Outlet } from "react-router-dom";
import { SidebarProvider, useSidebar } from "../../context/SidebarContext";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

function LayoutContent() {
  const { isExpanded, isMobileOpen, isHovered, toggleMobileSidebar, closeMobileSidebar } = useSidebar();

  return (
    <div className="min-h-screen xl:flex">
      <div>
        <Sidebar onNavigate={closeMobileSidebar} />
        {isMobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
            onClick={toggleMobileSidebar}
          />
        )}
      </div>
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
        } ${isMobileOpen ? "ml-0" : ""}`}
      >
        <Topbar />
        <main className="mx-auto max-w-[1536px] p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function AppLayout() {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
}
