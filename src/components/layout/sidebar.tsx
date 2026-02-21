"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileStack,
  Library,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProject } from "@/contexts/project-context";
import { ROLE_PERMISSIONS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    requiredPermission: null,
  },
  {
    label: "Content Queue",
    href: "/content",
    icon: FileStack,
    requiredPermission: "canViewQueue" as const,
  },
  {
    label: "Asset Library",
    href: "/library",
    icon: Library,
    requiredPermission: null,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    requiredPermission: "canManageSettings" as const,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { role, project } = useProject();
  const [collapsed, setCollapsed] = useState(false);

  const filteredItems = navItems.filter((item) => {
    if (!item.requiredPermission) return true;
    if (!role) return false;
    return ROLE_PERMISSIONS[role][item.requiredPermission];
  });

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-card transition-all duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-16 items-center border-b px-4">
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold truncate">Partnership Hub</h2>
            {project && (
              <p className="text-xs text-muted-foreground truncate">
                {project.name}
              </p>
            )}
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {filteredItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
