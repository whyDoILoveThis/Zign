"use client";

import { Search } from "lucide-react";
import { UserButton, useUser } from "@clerk/nextjs";
import { NotificationBell } from "./notification-bell";

export function Header() {
  const { isLoaded } = useUser();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-header-border bg-header-bg px-4 backdrop-blur-md md:h-16 md:px-6">
      {/* Logo on mobile, search on desktop */}
      <div className="flex items-center gap-3 md:hidden">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-b from-teal-400 to-teal-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_2px_6px_rgba(13,148,136,0.35)]">
          <span className="text-xs font-bold text-white">Z</span>
        </div>
        <span className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Zign
        </span>
      </div>
      <div className="relative hidden max-w-md flex-1 md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search jobs, clients..."
          className="h-9 w-full rounded-lg border border-card-border bg-card-bg pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 backdrop-blur-sm focus:border-teal-400/50 focus:outline-none focus:ring-1 focus:ring-teal-400/30 dark:text-slate-200 dark:placeholder:text-slate-500"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <NotificationBell />

        {isLoaded ? (
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-8 w-8",
                userButtonPopoverFooter: "hidden",
              },
            }}
          />
        ) : (
          <div className="h-8 w-8 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
        )}
      </div>
    </header>
  );
}
