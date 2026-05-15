import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  Settings,
  PenLine,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/documents", label: "Dokumen", icon: FileText },
  { to: "/clients", label: "Klien", icon: Users },
  { to: "/products", label: "Produk & Jasa", icon: Package },
  { to: "/signatures", label: "Tanda Tangan", icon: PenLine },
  { to: "/settings", label: "Pengaturan", icon: Settings },
];

export function Sidebar() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const setCollapsed = useAppStore((s) => s.setSidebarCollapsed);

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r bg-card transition-all duration-200",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <div className="flex h-14 items-center justify-between border-b px-3">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm">
              d
            </div>
            <span className="font-semibold tracking-tight">doxpro</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-md p-1.5 hover:bg-accent transition-colors"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const link = (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  collapsed && "justify-center px-2",
                )
              }
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
          if (!collapsed) return link;
          return (
            <Tooltip key={item.to}>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      <div className="border-t p-3">
        {!collapsed && (
          <div className="text-xs text-muted-foreground">
            <p className="font-medium">doxpro v0.1.0</p>
            <p>Lokal-first</p>
          </div>
        )}
      </div>
    </aside>
  );
}
