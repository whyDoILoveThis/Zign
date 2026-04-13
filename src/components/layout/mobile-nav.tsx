"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useProfile } from "@/components/providers/profile-provider";
import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Briefcase,
  Calendar,
  MapPin,
  Building2,
  Users,
  Wrench,
  Settings,
  MoreHorizontal,
  X,
} from "lucide-react";

const primaryTabs = [
  { name: "Home", href: "/dashboard", icon: LayoutDashboard },
  { name: "Jobs", href: "/dashboard/jobs", icon: Briefcase, staffOnly: true },
  { name: "Map", href: "/dashboard/map", icon: MapPin },
  { name: "My Jobs", href: "/dashboard/installer", icon: Wrench },
];

const moreItems = [
  { name: "Schedule", href: "/dashboard/schedule", icon: Calendar },
  {
    name: "Clients",
    href: "/dashboard/clients",
    icon: Building2,
    staffOnly: true,
  },
  { name: "Team", href: "/dashboard/team", icon: Users, adminOnly: true },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();
  const { role } = useProfile();
  const [moreOpen, setMoreOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  const filteredMoreItems = moreItems.filter((item) => {
    if (item.adminOnly) return role === "admin";
    if (item.staffOnly) return role === "admin" || role === "office";
    return true;
  });

  // Check if current path is in the "more" section
  const isMoreActive = filteredMoreItems.some(
    (item) =>
      pathname === item.href ||
      (item.href !== "/dashboard" && pathname.startsWith(item.href)),
  );

  // Close on outside tap
  useEffect(() => {
    if (!moreOpen) return;
    const handler = (e: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [moreOpen]);

  return (
    <>
      {/* Backdrop */}
      {moreOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity md:hidden" />
      )}

      {/* More sheet */}
      <div
        ref={sheetRef}
        className={cn(
          "fixed inset-x-0 z-60 transition-all duration-300 ease-out md:hidden",
          moreOpen
            ? "bottom-14 opacity-100"
            : "-bottom-full opacity-0 pointer-events-none",
        )}
      >
        <div className="rounded-t-2xl border border-card-border bg-card-bg px-4 pb-3 pt-3 shadow-lg backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              More
            </span>
            <button
              onClick={() => setMoreOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-accent-soft"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1 pb-3">
            {filteredMoreItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-[11px] font-medium transition-colors",
                    isActive
                      ? "bg-teal-500/10 text-teal-700 dark:text-teal-300"
                      : "text-slate-500 hover:bg-accent-soft dark:text-slate-400",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-header-border bg-header-bg backdrop-blur-lg md:hidden">
        <div className="flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
          {primaryTabs
            .filter((item) => {
              if (item.staffOnly) return role === "admin" || role === "office";
              return true;
            })
            .map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors",
                    isActive
                      ? "text-teal-600 dark:text-teal-400"
                      : "text-slate-400 dark:text-slate-500",
                  )}
                >
                  <item.icon
                    className="h-5 w-5 shrink-0"
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}

          {/* More button */}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors",
              moreOpen || isMoreActive
                ? "text-teal-600 dark:text-teal-400"
                : "text-slate-400 dark:text-slate-500",
            )}
          >
            <MoreHorizontal
              className="h-5 w-5 shrink-0"
              strokeWidth={moreOpen || isMoreActive ? 2.5 : 2}
            />
            <span>More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
