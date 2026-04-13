"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  Calendar,
  MapPin,
  Camera,
  Bell,
  Users,
  CheckCircle2,
} from "lucide-react";

const features = [
  {
    icon: Briefcase,
    title: "Job Management",
    description:
      "Create, assign, and track sign installation jobs from start to finish.",
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description:
      "Visual calendar with drag-and-drop dispatch for your entire crew.",
  },
  {
    icon: MapPin,
    title: "Map & Routing",
    description:
      "See all jobs on a live map. One-tap navigation to every site.",
  },
  {
    icon: Users,
    title: "Team Roles",
    description:
      "Admin, office, and installer views — everyone sees what they need.",
  },
  {
    icon: Camera,
    title: "Photo Documentation",
    description:
      "Before/after photos, permits, and drawings attached to every job.",
  },
  {
    icon: Bell,
    title: "Notifications",
    description: "Alerts when jobs are assigned, updated, or completed.",
  },
];

const stats = [
  { value: "10x", label: "Faster dispatch" },
  { value: "100%", label: "Paperless" },
  { value: "24/7", label: "Field access" },
];

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSignIn = pathname.startsWith("/sign-in");

  return (
    <div className="relative min-h-screen w-full bg-zinc-950 text-white">
      {/* Subtle grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Gradient orbs */}
      <div className="pointer-events-none absolute left-1/4 top-0 h-150 w-150 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[128px]" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-100 w-100 translate-x-1/2 rounded-full bg-sky-500/8 blur-[100px]" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12">
        <Link href="/sign-in" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white">
            <span className="text-sm font-extrabold text-zinc-900">Z</span>
          </div>
          <span className="text-lg font-bold tracking-tight">Zign</span>
        </Link>
        <div className="flex items-center gap-3">
          {isSignIn ? (
            <Link
              href="/sign-up"
              className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-white/70 transition-all hover:border-white/20 hover:text-white"
            >
              Create account
            </Link>
          ) : (
            <Link
              href="/sign-in"
              className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-white/70 transition-all hover:border-white/20 hover:text-white"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>

      <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-12">
        <div className="flex min-h-[calc(100vh-80px)] flex-col lg:flex-row lg:items-stretch lg:gap-20">
          {/* Left — Marketing */}
          <div className="flex flex-col justify-center py-10 lg:sticky lg:top-20 lg:w-1/2 lg:py-20">
            {/* Badge */}
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-emerald-300">
                Operations platform for sign companies
              </span>
            </div>

            {/* Hero */}
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight md:text-5xl lg:text-[3.5rem]">
              Sign operations,{" "}
              <span className="bg-linear-to-r from-emerald-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">
                simplified
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-zinc-400">
              Zign replaces whiteboards and spreadsheets with one beautiful
              system — scheduling, dispatch, maps, photos, and field updates
              from anywhere.
            </p>

            {/* Stats */}
            <div className="mt-8 flex gap-8">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-bold text-white">{s.value}</div>
                  <div className="text-sm text-zinc-500">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Features grid — desktop only */}
            <div className="mt-12 hidden grid-cols-2 gap-4 lg:grid">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="group rounded-xl border border-white/5 bg-white/2 p-4 transition-all hover:border-white/10 hover:bg-white/4"
                >
                  <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-zinc-400 transition-colors group-hover:bg-emerald-500/10 group-hover:text-emerald-400">
                    <f.icon className="h-4.5 w-4.5" />
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-200">
                    {f.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                    {f.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Auth form */}
          <div className="flex w-full flex-col items-center justify-center py-10 lg:w-1/2 lg:py-20">
            <div className="mx-auto w-full max-w-105">{children}</div>
          </div>
        </div>
      </div>

      {/* Mobile features — grid */}
      <div className="relative z-10 px-6 pb-16 lg:hidden">
        <div className="mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-semibold text-zinc-300">
            Everything you need
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-white/5 bg-white/2 p-4"
            >
              <f.icon className="mb-2 h-5 w-5 text-emerald-400" />
              <h3 className="text-sm font-semibold text-zinc-200">{f.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-6 md:px-12">
        <div className="mx-auto flex max-w-7xl items-center justify-between text-xs text-zinc-600">
          <span>
            &copy; {new Date().getFullYear()} Zign. All rights reserved.
          </span>
          <div className="flex gap-4">
            <span>Privacy</span>
            <span>Terms</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
