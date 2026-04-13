"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Briefcase,
  Calendar,
  Clock,
  CheckCircle2,
  ArrowRight,
  MapPin,
  Plus,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { formatDate } from "@/lib/utils";
import type { JobStatus } from "@/types";

interface DashboardJob {
  $id: string;
  title: string;
  status: JobStatus;
  scheduled_date: string | null;
  scheduled_time: string | null;
  address: string;
  city: string | null;
  clients: { name: string };
}

export default function DashboardPage() {
  const [jobs, setJobs] = useState<DashboardJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [today, setToday] = useState("");
  const [weekAgo, setWeekAgo] = useState("");

  useEffect(() => {
    fetch("/api/jobs")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const now = new Date();
        setToday(now.toISOString().split("T")[0]);
        setWeekAgo(
          new Date(now.getTime() - 7 * 86400000).toISOString().split("T")[0],
        );
        setJobs(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalJobs = jobs.length;
  const scheduledToday = jobs.filter((j) => j.scheduled_date === today).length;
  const inProgress = jobs.filter((j) => j.status === "in_progress").length;
  const completedThisWeek = jobs.filter(
    (j) =>
      j.status === "completed" &&
      j.scheduled_date &&
      j.scheduled_date >= weekAgo,
  ).length;

  const recentJobs = [...jobs]
    .sort((a, b) =>
      (b.scheduled_date || "").localeCompare(a.scheduled_date || ""),
    )
    .slice(0, 5);

  const todaysJobs = jobs
    .filter((j) => j.scheduled_date === today)
    .sort((a, b) =>
      (a.scheduled_time || "").localeCompare(b.scheduled_time || ""),
    );

  const upcomingJobs = jobs
    .filter(
      (j) =>
        j.scheduled_date &&
        j.scheduled_date > today &&
        j.status !== "completed" &&
        j.status !== "cancelled",
    )
    .sort((a, b) =>
      (a.scheduled_date || "").localeCompare(b.scheduled_date || ""),
    )
    .slice(0, 5);

  const stats = [
    {
      label: "Total Jobs",
      value: totalJobs,
      icon: Briefcase,
      color:
        "bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.15)]",
    },
    {
      label: "Scheduled Today",
      value: scheduledToday,
      icon: Calendar,
      color:
        "bg-blue-50 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.15)]",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "In Progress",
      value: inProgress,
      icon: Clock,
      color:
        "bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.15)]",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Completed This Week",
      value: completedThisWeek,
      icon: CheckCircle2,
      color:
        "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.15)]",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
  ];

  return (
    <div className="animate-fade-in space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Overview of your operations
          </p>
        </div>
        <Link href="/dashboard/jobs">
          <Button>
            <Plus className="h-4 w-4" />
            New Job
          </Button>
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="flex items-start gap-4">
            <div className={`rounded-xl p-3 ${stat.color}`}>
              <stat.icon
                className={`h-5 w-5 ${stat.iconColor || "text-zinc-600 dark:text-zinc-400"}`}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {stat.label}
              </p>
              <p className="mt-0.5 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {loading ? <Spinner size="sm" /> : stat.value}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Content sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Jobs */}
        <Card>
          <div className="flex items-center justify-between pb-4">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Today&apos;s Jobs
            </h2>
            <Link
              href="/dashboard/schedule"
              className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700"
            >
              Schedule <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : todaysJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-800">
                <Calendar className="h-6 w-6 text-zinc-400" />
              </div>
              <p className="mt-3 text-sm text-zinc-500">
                Nothing scheduled today
              </p>
              <p className="text-xs text-zinc-400">
                Jobs scheduled for today will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {todaysJobs.map((job) => (
                <Link
                  key={job.$id}
                  href={`/dashboard/jobs/${job.$id}`}
                  className="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {job.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <Clock className="h-3 w-3" />
                      {job.scheduled_time
                        ? job.scheduled_time.slice(0, 5)
                        : "No time set"}
                      <span className="text-zinc-300 dark:text-zinc-600">
                        ·
                      </span>
                      {job.clients?.name}
                    </div>
                  </div>
                  <StatusBadge status={job.status} />
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Upcoming Jobs */}
        <Card>
          <div className="flex items-center justify-between pb-4">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Upcoming Jobs
            </h2>
            <Link
              href="/dashboard/jobs"
              className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : upcomingJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-800">
                <Briefcase className="h-6 w-6 text-zinc-400" />
              </div>
              <p className="mt-3 text-sm text-zinc-500">No upcoming jobs</p>
              <p className="text-xs text-zinc-400">
                Future scheduled jobs will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingJobs.map((job) => (
                <Link
                  key={job.$id}
                  href={`/dashboard/jobs/${job.$id}`}
                  className="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {job.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <Calendar className="h-3 w-3" />
                      {job.scheduled_date && formatDate(job.scheduled_date)}
                      {job.scheduled_time &&
                        ` at ${job.scheduled_time.slice(0, 5)}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-zinc-400">
                    <MapPin className="h-3 w-3" />
                    {job.city || "—"}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
