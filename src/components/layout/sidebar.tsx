"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Briefcase,
  Calendar,
  MapPin,
  Users,
  Settings,
  Building2,
  ChevronLeft,
  ChevronRight,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { useProfile } from "@/components/providers/profile-provider";

const allNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Jobs", href: "/dashboard/jobs", icon: Briefcase },
  { name: "Schedule", href: "/dashboard/schedule", icon: Calendar },
  { name: "Map", href: "/dashboard/map", icon: MapPin },
  { name: "Clients", href: "/dashboard/clients", icon: Building2 },
  {
    name: "Team",
    href: "/dashboard/team",
    icon: Users,
    adminOnly: true as const,
  },
  { name: "My Jobs", href: "/dashboard/installer", icon: Wrench },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { role } = useProfile();

  const navigation = allNavigation.filter(
    (item) => !("adminOnly" in item && item.adminOnly) || role === "admin",
  );

  return (
    <aside
      className={cn(
        "hidden h-screen flex-col border-r border-sidebar-border bg-sidebar-bg transition-all duration-200 md:flex",
        collapsed ? "w-[68px]" : "w-[240px]",
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 dark:bg-white">
          <span className="text-sm font-bold text-white dark:text-zinc-900">
            Z
          </span>
        </div>
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Zign
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
