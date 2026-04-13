"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  MapPin,
  Clock,
  Phone,
  Navigation,
  ChevronRight,
  CheckCircle2,
  PlayCircle,
  PauseCircle,
  MessageSquarePlus,
  Calendar,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Wrench,
} from "lucide-react";
import { Button, Card, StatusBadge, Textarea } from "@/components/ui";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, formatDate } from "@/lib/utils";
import type { JobStatus } from "@/types";

interface InstallerJob {
  $id: string;
  title: string;
  description: string | null;
  address: string;
  city: string | null;
  state: string | null;
  lat: number | null;
  lng: number | null;
  status: JobStatus;
  scheduled_date: string | null;
  scheduled_time: string | null;
  estimated_duration_minutes: number | null;
  notes: string | null;
  clients: {
    $id: string;
    name: string;
    contact_name: string | null;
    phone: string | null;
  };
}

interface InstallerProfile {
  $id: string;
  first_name: string;
  last_name: string;
  role: string;
}

type TabKey = "today" | "upcoming" | "completed";

export default function InstallerPage() {
  const [profile, setProfile] = useState<InstallerProfile | null>(null);
  const [jobs, setJobs] = useState<InstallerJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("today");
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, jobsRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/jobs"),
      ]);

      if (profileRes.ok) {
        const p = await profileRes.json();
        setProfile(p);

        if (jobsRes.ok) {
          const allJobs = await jobsRes.json();
          // Filter to jobs assigned to this installer
          const myJobs = allJobs.filter(
            (
              j: InstallerJob & {
                job_assignments?: { installer_id: string }[];
              },
            ) => j.job_assignments?.some((a) => a.installer_id === p.$id),
          );
          setJobs(myJobs);
        }
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const today = new Date().toISOString().split("T")[0];

  const todayJobs = jobs.filter(
    (j) =>
      j.scheduled_date === today &&
      j.status !== "completed" &&
      j.status !== "cancelled",
  );
  const upcomingJobs = jobs.filter(
    (j) =>
      j.scheduled_date &&
      j.scheduled_date > today &&
      j.status !== "completed" &&
      j.status !== "cancelled",
  );
  const completedJobs = jobs.filter((j) => j.status === "completed");

  const tabJobs: Record<TabKey, InstallerJob[]> = {
    today: todayJobs,
    upcoming: upcomingJobs,
    completed: completedJobs.slice(0, 20),
  };

  const updateJobStatus = async (jobId: string, newStatus: JobStatus) => {
    setUpdatingStatus(jobId);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setJobs((prev) =>
          prev.map((j) => (j.$id === jobId ? { ...j, status: newStatus } : j)),
        );
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const addNote = async (jobId: string) => {
    if (!noteText.trim()) return;
    setSubmittingNote(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: noteText.trim() }),
      });
      if (res.ok) {
        setNoteText("");
        // Could show a success toast here
      }
    } catch (err) {
      console.error("Failed to add note:", err);
    } finally {
      setSubmittingNote(false);
    }
  };

  const getNavUrl = (job: InstallerJob) => {
    if (job.lat && job.lng) {
      return `https://www.google.com/maps/dir/?api=1&destination=${job.lat},${job.lng}`;
    }
    const addr = [job.address, job.city, job.state].filter(Boolean).join(", ");
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}`;
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in mx-auto max-w-2xl">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Hey, {profile?.first_name || "Installer"} 👋
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {todayJobs.length === 0
            ? "No jobs scheduled for today"
            : `You have ${todayJobs.length} job${todayJobs.length !== 1 ? "s" : ""} today`}
        </p>
      </div>

      {/* Quick stats */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <Card className="text-center">
          <p className="text-2xl font-bold text-blue-600">{todayJobs.length}</p>
          <p className="text-xs text-zinc-500">Today</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-amber-600">
            {upcomingJobs.length}
          </p>
          <p className="text-xs text-zinc-500">Upcoming</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-emerald-600">
            {completedJobs.length}
          </p>
          <p className="text-xs text-zinc-500">Completed</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
        {[
          { key: "today" as const, label: "Today", count: todayJobs.length },
          {
            key: "upcoming" as const,
            label: "Upcoming",
            count: upcomingJobs.length,
          },
          {
            key: "completed" as const,
            label: "Done",
            count: completedJobs.length,
          },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex-1 rounded-lg py-2 text-center text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300",
            )}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Job list */}
      <div className="space-y-3">
        {tabJobs[activeTab].length === 0 ? (
          <EmptyState
            icon={activeTab === "completed" ? CheckCircle2 : Calendar}
            title={
              activeTab === "today"
                ? "No jobs today"
                : activeTab === "upcoming"
                  ? "No upcoming jobs"
                  : "No completed jobs yet"
            }
            description={
              activeTab === "today"
                ? "Enjoy your day off!"
                : activeTab === "upcoming"
                  ? "Nothing scheduled ahead"
                  : "Completed jobs will show here"
            }
          />
        ) : (
          tabJobs[activeTab].map((job) => (
            <Card key={job.$id} padding={false} className="overflow-hidden">
              {/* Job header - always visible */}
              <button
                onClick={() =>
                  setExpandedJob(expandedJob === job.$id ? null : job.$id)
                }
                className="flex w-full items-center gap-3 p-4 text-left"
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    job.status === "in_progress"
                      ? "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
                      : job.status === "completed"
                        ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                        : "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
                  )}
                >
                  <Wrench className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-semibold text-zinc-900 dark:text-zinc-50">
                      {job.title}
                    </h3>
                    <StatusBadge status={job.status} />
                  </div>
                  <p className="truncate text-sm text-zinc-500">
                    {job.clients?.name}
                    {job.scheduled_time &&
                      ` • ${job.scheduled_time.slice(0, 5)}`}
                  </p>
                </div>
                <ChevronRight
                  className={cn(
                    "h-5 w-5 shrink-0 text-zinc-400 transition-transform",
                    expandedJob === job.$id && "rotate-90",
                  )}
                />
              </button>

              {/* Expanded job details */}
              {expandedJob === job.$id && (
                <div className="border-t border-zinc-100 dark:border-zinc-800">
                  {/* Info section */}
                  <div className="space-y-2 p-4">
                    {/* Address */}
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                      <span className="text-zinc-700 dark:text-zinc-300">
                        {[job.address, job.city, job.state]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </div>

                    {/* Schedule */}
                    {job.scheduled_date && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 shrink-0 text-zinc-400" />
                        <span className="text-zinc-700 dark:text-zinc-300">
                          {formatDate(job.scheduled_date)}
                          {job.scheduled_time &&
                            ` at ${job.scheduled_time.slice(0, 5)}`}
                          {job.estimated_duration_minutes &&
                            ` (${
                              job.estimated_duration_minutes >= 60
                                ? `${(job.estimated_duration_minutes / 60).toFixed(job.estimated_duration_minutes % 60 === 0 ? 0 : 1)}h`
                                : `${job.estimated_duration_minutes}m`
                            })`}
                        </span>
                      </div>
                    )}

                    {/* Client contact */}
                    {job.clients?.phone && (
                      <a
                        href={`tel:${job.clients.phone}`}
                        className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400"
                      >
                        <Phone className="h-4 w-4 shrink-0" />
                        {job.clients.contact_name || job.clients.name} —{" "}
                        {job.clients.phone}
                      </a>
                    )}

                    {/* Description */}
                    {job.description && (
                      <p className="mt-2 rounded-lg bg-zinc-50 p-3 text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        {job.description}
                      </p>
                    )}
                  </div>

                  {/* Quick actions */}
                  <div className="border-t border-zinc-100 p-4 dark:border-zinc-800">
                    {/* Status actions */}
                    <div className="mb-3 flex gap-2">
                      {job.status === "scheduled" && (
                        <Button
                          size="sm"
                          onClick={() =>
                            updateJobStatus(job.$id, "in_progress")
                          }
                          loading={updatingStatus === job.$id}
                          className="flex-1"
                        >
                          <PlayCircle className="h-4 w-4" />
                          Start Job
                        </Button>
                      )}
                      {job.status === "in_progress" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() =>
                              updateJobStatus(job.$id, "completed")
                            }
                            loading={updatingStatus === job.$id}
                            className="flex-1"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Complete
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateJobStatus(job.$id, "on_hold")}
                            loading={updatingStatus === job.$id}
                          >
                            <PauseCircle className="h-4 w-4" />
                            Hold
                          </Button>
                        </>
                      )}
                      {job.status === "on_hold" && (
                        <Button
                          size="sm"
                          onClick={() =>
                            updateJobStatus(job.$id, "in_progress")
                          }
                          loading={updatingStatus === job.$id}
                          className="flex-1"
                        >
                          <PlayCircle className="h-4 w-4" />
                          Resume
                        </Button>
                      )}
                    </div>

                    {/* Navigate + View */}
                    <div className="flex gap-2">
                      <a
                        href={getNavUrl(job)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1"
                      >
                        <Button size="sm" variant="outline" className="w-full">
                          <Navigation className="h-4 w-4" />
                          Navigate
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </a>
                      <Link
                        href={`/dashboard/jobs/${job.$id}`}
                        className="flex-1"
                      >
                        <Button size="sm" variant="ghost" className="w-full">
                          Details
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Add note section */}
                  <div className="border-t border-zinc-100 p-4 dark:border-zinc-800">
                    <div className="flex items-start gap-2">
                      <Textarea
                        placeholder="Add a quick note..."
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        rows={2}
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addNote(job.$id)}
                        loading={submittingNote}
                        disabled={!noteText.trim()}
                      >
                        <MessageSquarePlus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Refresh */}
      <div className="mt-6 text-center">
        <Button variant="ghost" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>
    </div>
  );
}
