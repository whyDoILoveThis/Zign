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
  {
    name: "Jobs",
    href: "/dashboard/jobs",
    icon: Briefcase,
    staffOnly: true as const,
  },
  { name: "Schedule", href: "/dashboard/schedule", icon: Calendar },
  { name: "Map", href: "/dashboard/map", icon: MapPin },
  {
    name: "Clients",
    href: "/dashboard/clients",
    icon: Building2,
    staffOnly: true as const,
  },
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

  const navigation = allNavigation.filter((item) => {
    if ("adminOnly" in item && item.adminOnly) return role === "admin";
    if ("staffOnly" in item && item.staffOnly)
      return role === "admin" || role === "office";
    return true;
  });

  return (
    <aside
      className={cn(
        "hidden h-screen flex-col border-r border-sidebar-border bg-sidebar-bg backdrop-blur-md transition-all duration-200 md:flex",
        collapsed ? "w-[68px]" : "w-[240px]",
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-b from-teal-400 to-teal-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_2px_6px_rgba(13,148,136,0.35)]">
          <span className="text-sm font-bold text-white">Z</span>
        </div>
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
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
                  ? "bg-teal-500/12 text-teal-700 dark:text-teal-300 shadow-[inset_0_1px_0_rgba(13,148,136,0.1)]"
                  : "text-slate-600 hover:bg-accent-soft hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100",
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
          className="flex w-full items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-accent-soft hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
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
