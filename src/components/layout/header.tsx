"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { NotificationBell } from "./notification-bell";
import { HeaderSearch } from "./header-search";

export function Header() {
  const { isLoaded } = useUser();

  return (
    <header className="relative z-[100] flex h-14 shrink-0 items-center justify-between border-b border-header-border bg-header-bg px-4 backdrop-blur-md md:h-16 md:px-6">
      {/* Logo on mobile, search on desktop */}
      <div className="flex items-center gap-3 md:hidden">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-b from-teal-400 to-teal-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_2px_6px_rgba(13,148,136,0.35)]">
          <span className="text-xs font-bold text-white">Z</span>
        </div>
        <span className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Zign
        </span>
      </div>
      <HeaderSearch />

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
