"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  User,
  Building2,
  Phone,
  ExternalLink,
  MessageSquare,
  Send,
  Paperclip,
} from "lucide-react";
import {
  Button,
  Card,
  CardHeader,
  StatusBadge,
  Textarea,
} from "@/components/ui";
import { PageLoader } from "@/components/ui/spinner";
import { FileUpload } from "@/components/jobs/file-upload";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { JobStatus, AttachmentCategory } from "@/types";

interface JobDetail {
  $id: string;
  title: string;
  description: string | null;
  address: string;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  lat: number | null;
  lng: number | null;
  status: JobStatus;
  scheduled_date: string | null;
  scheduled_time: string | null;
  estimated_duration_minutes: number | null;
  notes: string | null;
  $createdAt: string;
  clients: {
    $id: string;
    name: string;
    contact_name: string | null;
    phone: string | null;
    email: string | null;
    address: string;
  };
  assignments: { $id: string; installer_id: string; assigned_by: string }[];
  notes_list: {
    $id: string;
    author_id: string;
    content: string;
    $createdAt: string;
  }[];
  attachments: {
    $id: string;
    file_name: string;
    file_url: string;
    file_type: string;
    file_size: number;
    category: AttachmentCategory;
    $createdAt: string;
  }[];
}

const statusOptions: { value: JobStatus; label: string }[] = [
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On Hold" },
  { value: "cancelled", label: "Cancelled" },
];

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [sendingNote, setSendingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchJob = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobs/${id}`);
      if (res.ok) {
        const data = await res.json();
        setJob({
          ...data,
          notes_list: data.notes_list || [],
        });
      }
    } catch (err) {
      console.error("Failed to fetch job:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const updateStatus = async (newStatus: JobStatus) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchJob();
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    setSendingNote(true);
    try {
      const res = await fetch(`/api/jobs/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNote }),
      });
      if (res.ok) {
        setNewNote("");
        fetchJob();
      }
    } finally {
      setSendingNote(false);
    }
  };

  const getNavigationUrl = () => {
    if (!job?.lat || !job?.lng) return null;
    return `https://www.google.com/maps/dir/?api=1&destination=${job.lat},${job.lng}`;
  };

  if (loading) return <PageLoader message="Loading job details..." />;
  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-zinc-500">Job not found</p>
        <Link
          href="/dashboard/jobs"
          className="mt-2 text-sm text-zinc-700 underline"
        >
          Back to jobs
        </Link>
      </div>
    );
  }

  const navUrl = getNavigationUrl();

  return (
    <div className="animate-fade-in space-y-6">
      {/* Back + Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Link
            href="/dashboard/jobs"
            className="mt-1 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {job.title}
              </h1>
              <StatusBadge status={job.status} />
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              Created {formatDateTime(job.$createdAt)}
            </p>
          </div>
        </div>

        {/* Status changer */}
        <div className="flex items-center gap-2">
          <select
            value={job.status}
            onChange={(e) => updateStatus(e.target.value as JobStatus)}
            disabled={updatingStatus}
            className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {navUrl && (
            <a href={navUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4" />
                Navigate
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column - Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Description */}
          {job.description && (
            <Card>
              <CardHeader title="Description" />
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                {job.description}
              </p>
            </Card>
          )}

          {/* Location */}
          <Card>
            <CardHeader title="Installation Location" />
            <div className="mt-3 flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-zinc-400" />
              <div className="text-sm">
                <p className="font-medium text-zinc-900 dark:text-zinc-50">
                  {job.address}
                </p>
                <p className="text-zinc-500">
                  {[job.city, job.state, job.postal_code]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            </div>
          </Card>

          {/* Notes */}
          {job.notes && (
            <Card>
              <CardHeader title="Job Notes" />
              <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
                {job.notes}
              </p>
            </Card>
          )}

          {/* Activity / Notes */}
          <Card>
            <CardHeader title="Activity" />
            <div className="mt-4">
              {/* Add note */}
              <div className="flex gap-2">
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note or update..."
                  rows={2}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  onClick={addNote}
                  loading={sendingNote}
                  disabled={!newNote.trim()}
                  className="self-end"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {/* Notes list */}
              {job.notes_list?.length > 0 && (
                <div className="mt-4 space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                  {job.notes_list.map((note) => (
                    <div
                      key={note.$id}
                      className="flex items-start gap-3 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50"
                    >
                      <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-zinc-700 dark:text-zinc-300">
                          {note.content}
                        </p>
                        <p className="mt-1 text-xs text-zinc-400">
                          {formatDateTime(note.$createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
          {/* Attachments */}
          <Card>
            <div className="flex items-center gap-2">
              <Paperclip className="h-5 w-5 text-zinc-400" />
              <CardHeader title="Files & Photos" />
            </div>
            <div className="mt-4">
              <FileUpload
                jobId={job.$id}
                attachments={job.attachments || []}
                onUploadComplete={fetchJob}
              />
            </div>
          </Card>
        </div>

        {/* Right column - Sidebar info */}
        <div className="space-y-6">
          {/* Client */}
          <Card>
            <CardHeader title="Client" />
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
                <Building2 className="h-4 w-4 text-zinc-400" />
                <span className="font-medium">{job.clients?.name}</span>
              </div>
              {job.clients?.contact_name && (
                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <User className="h-4 w-4 text-zinc-400" />
                  {job.clients.contact_name}
                </div>
              )}
              {job.clients?.phone && (
                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <Phone className="h-4 w-4 text-zinc-400" />
                  <a
                    href={`tel:${job.clients.phone}`}
                    className="hover:underline"
                  >
                    {job.clients.phone}
                  </a>
                </div>
              )}
            </div>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader title="Schedule" />
            <div className="mt-3 space-y-2 text-sm">
              {job.scheduled_date ? (
                <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                  <Calendar className="h-4 w-4 text-zinc-400" />
                  {formatDate(job.scheduled_date)}
                </div>
              ) : (
                <p className="text-zinc-400">Not scheduled yet</p>
              )}
              {job.scheduled_time && (
                <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                  <Clock className="h-4 w-4 text-zinc-400" />
                  {job.scheduled_time.slice(0, 5)}
                </div>
              )}
              {job.estimated_duration_minutes && (
                <p className="text-zinc-500">
                  Est. {job.estimated_duration_minutes} minutes
                </p>
              )}
            </div>
          </Card>

          {/* Assigned Installers */}
          <Card>
            <CardHeader title="Assigned Installers" />
            <div className="mt-3">
              {job.assignments?.length > 0 ? (
                <div className="space-y-2">
                  {job.assignments.map((a) => (
                    <div
                      key={a.$id}
                      className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium dark:bg-zinc-700">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <span>{a.installer_id}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-400">No installers assigned</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
