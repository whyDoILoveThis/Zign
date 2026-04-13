"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, CheckCheck, Briefcase, ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Notification } from "@/types";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=20");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // silently fail
    }
  }, []);

  // Initial fetch + polling every 30s
  useEffect(() => {
    const timeout = setTimeout(fetchNotifications, 0);
    const interval = setInterval(fetchNotifications, 30000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const markAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n.$id === id ? { ...n, read: "true" } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    setLoading(true);
    await fetch("/api/notifications/read-all", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: "true" })));
    setUnreadCount(0);
    setLoading(false);
  };

  const handleNotificationClick = async (n: Notification) => {
    if (n.read === "false") {
      markAsRead(n.$id);
    }
    if (n.link) {
      setOpen(false);
      router.push(n.link);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "job_assigned":
        return <Briefcase className="h-4 w-4" />;
      case "job_status_changed":
        return <ArrowUpRight className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-[9999] mt-2 w-80 overflow-hidden rounded-xl border border-card-border bg-white shadow-[0_8px_32px_rgba(13,148,136,0.08)] sm:w-96 dark:bg-[#0c1820] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-card-border px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={loading}
                className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700 disabled:opacity-50 dark:text-teal-400"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell className="mx-auto mb-2 h-8 w-8 text-zinc-300 dark:text-zinc-600" />
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No notifications yet
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.$id}
                  onClick={() => handleNotificationClick(n)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${
                    n.read === "false"
                      ? "bg-blue-50/50 dark:bg-blue-950/20"
                      : ""
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      n.read === "false"
                        ? "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    {getIcon(n.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-sm leading-snug ${
                          n.read === "false"
                            ? "font-semibold text-zinc-900 dark:text-zinc-100"
                            : "font-medium text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        {n.title}
                      </p>
                      {n.read === "false" && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                      {n.message}
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                      {formatTime(n.$createdAt)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
