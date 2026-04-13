"use client";

import { Search } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { NotificationBell } from "./notification-bell";

export function Header() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900 md:h-16 md:px-6">
      {/* Logo on mobile, search on desktop */}
      <div className="flex items-center gap-3 md:hidden">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 dark:bg-white">
          <span className="text-xs font-bold text-white dark:text-zinc-900">
            Z
          </span>
        </div>
        <span className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Zign
        </span>
      </div>
      <div className="relative hidden max-w-md flex-1 md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Search jobs, clients..."
          className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-10 pr-4 text-sm text-zinc-700 placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600 dark:focus:bg-zinc-800"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <NotificationBell />

        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-8 w-8",
            },
          }}
        />
      </div>
    </header>
  );
}
