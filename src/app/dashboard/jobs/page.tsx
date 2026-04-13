"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Briefcase,
  MapPin,
  Calendar,
  Clock,
  Filter,
  ChevronRight,
  User,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { Button, Card, StatusBadge, EmptyState } from "@/components/ui";
import { Spinner } from "@/components/ui/spinner";
import { JobModal } from "@/components/jobs/job-modal";
import { formatDate } from "@/lib/utils";
import { useProfile } from "@/components/providers/profile-provider";
import type { JobStatus } from "@/types";

interface JobRow {
  $id: string;
  title: string;
  address: string;
  city: string | null;
  state: string | null;
  status: JobStatus;
  scheduled_date: string | null;
  scheduled_time: string | null;
  estimated_duration_minutes: number | null;
  clients: {
    $id: string;
    name: string;
    contact_name: string | null;
    phone: string | null;
  };
  job_assignments: {
    $id: string;
    installer_id: string;
    installer?: {
      $id: string;
      first_name: string;
      last_name: string;
      email: string;
      phone: string | null;
      role: string;
    } | null;
  }[];
  attachments: {
    $id: string;
    file_name: string;
    file_url: string;
    file_type: string;
    category: string;
  }[];
}

const statusFilters: { value: string; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On Hold" },
  { value: "cancelled", label: "Cancelled" },
];

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const { role } = useProfile();
  const canCreate = role === "admin" || role === "office";

  const fetchJobs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/jobs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Jobs
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {jobs.length} job{jobs.length !== 1 ? "s" : ""} total
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            New Job
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-zinc-300 bg-white pl-10 pr-4 text-sm focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:ring-zinc-400/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-zinc-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900"
          >
            {statusFilters.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Job list */}
      {loading ? (
        <div className="mt-12 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Briefcase}
            title="No jobs found"
            description={
              search || statusFilter
                ? "Try adjusting your filters"
                : "Create your first job to get started with scheduling."
            }
            action={
              !search && !statusFilter ? (
                <Button onClick={() => setModalOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Create Job
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {jobs.map((job) => (
            <Link
              key={job.$id}
              href={`/dashboard/jobs/${job.$id}`}
              className="block"
            >
              <Card
                padding={false}
                className="group cursor-pointer transition-all hover:border-zinc-300 hover:shadow-md dark:hover:border-zinc-600"
              >
                <div className="flex items-center gap-4 p-5">
                  {/* Left: Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="truncate font-semibold text-zinc-900 dark:text-zinc-50">
                        {job.title}
                      </h3>
                      <StatusBadge status={job.status} />
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">
                        {job.clients?.name}
                      </span>

                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {[job.address, job.city, job.state]
                          .filter(Boolean)
                          .join(", ")}
                      </span>

                      {job.scheduled_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(job.scheduled_date)}
                        </span>
                      )}

                      {job.scheduled_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {job.scheduled_time?.slice(0, 5)}
                        </span>
                      )}

                      {job.job_assignments?.length > 0 && (
                        <span className="flex items-center gap-1 text-xs">
                          <User className="h-3.5 w-3.5" />
                          {job.job_assignments
                            .map((a) =>
                              a.installer
                                ? `${a.installer.first_name} ${a.installer.last_name}`
                                : "Unassigned",
                            )
                            .join(", ")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Arrow */}
                  <ChevronRight className="h-5 w-5 shrink-0 text-zinc-300 transition-colors group-hover:text-zinc-500 dark:text-zinc-600 dark:group-hover:text-zinc-400" />
                </div>

                {job.attachments?.length > 0 &&
                  (() => {
                    const photos = job.attachments.filter((a) =>
                      a.file_type.startsWith("image/"),
                    );
                    const docs = job.attachments.filter(
                      (a) => !a.file_type.startsWith("image/"),
                    );
                    return (
                      <div className="border-t border-zinc-100 px-5 py-3 dark:border-zinc-800">
                        <div className="flex flex-wrap items-center gap-3">
                          {photos.length > 0 && (
                            <div className="flex items-center gap-2">
                              {photos.slice(0, 5).map((photo) => (
                                <div
                                  key={photo.$id}
                                  className="relative h-10 w-10 overflow-hidden rounded-md border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={photo.file_url}
                                    alt={photo.file_name}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              ))}
                              {photos.length > 5 && (
                                <span className="text-xs text-zinc-400">
                                  +{photos.length - 5}
                                </span>
                              )}
                            </div>
                          )}
                          {docs.length > 0 && (
                            <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                              <FileText className="h-3.5 w-3.5" />
                              <span>
                                {docs.length} document
                                {docs.length !== 1 ? "s" : ""}
                              </span>
                            </div>
                          )}
                          {photos.length > 0 && docs.length === 0 && (
                            <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                              <ImageIcon className="h-3.5 w-3.5" />
                              <span>
                                {photos.length} photo
                                {photos.length !== 1 ? "s" : ""}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Create modal */}
      <JobModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchJobs}
      />
    </div>
  );
}
