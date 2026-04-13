"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
} from "lucide-react";
import { Button, Card, StatusBadge } from "@/components/ui";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { JobStatus } from "@/types";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";

interface CalendarJob {
  $id: string;
  title: string;
  address: string;
  city: string | null;
  status: JobStatus;
  scheduled_date: string | null;
  scheduled_time: string | null;
  clients: { name: string };
}

export default function SchedulePage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [jobs, setJobs] = useState<CalendarJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    const start = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const end = format(endOfMonth(currentMonth), "yyyy-MM-dd");

    try {
      const res = await fetch(`/api/jobs?date_from=${start}&date_to=${end}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getJobsForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return jobs.filter((j) => j.scheduled_date === dateStr);
  };

  const selectedDateJobs = selectedDate ? getJobsForDate(selectedDate) : [];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Schedule
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Calendar view of all installations
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Calendar */}
        <Card padding={false}>
          {/* Month navigation */}
          <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <ChevronLeft className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            </button>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <ChevronRight className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="py-2 text-center text-xs font-medium text-zinc-500 dark:text-zinc-400"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          {loading ? (
            <div className="flex h-[480px] items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {days.map((day, i) => {
                const dayJobs = getJobsForDate(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const today = isToday(day);

                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "relative flex min-h-[80px] flex-col border-b border-r border-zinc-100 p-1.5 text-left transition-colors dark:border-zinc-800",
                      !isCurrentMonth && "bg-zinc-50/50 dark:bg-zinc-900/50",
                      isSelected &&
                        "bg-blue-50 ring-2 ring-inset ring-blue-500 dark:bg-blue-950/30",
                      !isSelected &&
                        "hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                        !isCurrentMonth && "text-zinc-300 dark:text-zinc-600",
                        isCurrentMonth && "text-zinc-700 dark:text-zinc-300",
                        today &&
                          "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900",
                      )}
                    >
                      {format(day, "d")}
                    </span>

                    {/* Job dots */}
                    {dayJobs.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {dayJobs.slice(0, 3).map((job) => (
                          <div
                            key={job.$id}
                            className={cn(
                              "truncate rounded px-1 py-0.5 text-[10px] font-medium leading-tight",
                              {
                                scheduled:
                                  "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
                                in_progress:
                                  "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
                                completed:
                                  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
                                on_hold:
                                  "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300",
                                cancelled:
                                  "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
                              }[job.status],
                            )}
                          >
                            {job.title}
                          </div>
                        ))}
                        {dayJobs.length > 3 && (
                          <p className="px-1 text-[10px] text-zinc-400">
                            +{dayJobs.length - 3} more
                          </p>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        {/* Selected day sidebar */}
        <div>
          <Card>
            <div className="flex items-center gap-2 pb-4">
              <CalendarIcon className="h-5 w-5 text-zinc-400" />
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                {selectedDate
                  ? format(selectedDate, "EEEE, MMMM d")
                  : "Select a date"}
              </h3>
            </div>

            {selectedDate ? (
              selectedDateJobs.length > 0 ? (
                <div className="space-y-3">
                  {selectedDateJobs.map((job) => (
                    <Link key={job.$id} href={`/dashboard/jobs/${job.$id}`}>
                      <div className="rounded-lg border border-zinc-200 p-3 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/50">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                            {job.title}
                          </h4>
                          <StatusBadge status={job.status} />
                        </div>
                        <p className="mt-1 text-xs text-zinc-500">
                          {job.clients?.name}
                        </p>
                        <div className="mt-2 flex items-center gap-3 text-xs text-zinc-400">
                          {job.scheduled_time && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {job.scheduled_time.slice(0, 5)}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {job.city || job.address}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-zinc-400">
                  No jobs scheduled for this date
                </p>
              )
            ) : (
              <p className="py-8 text-center text-sm text-zinc-400">
                Click a date to see scheduled jobs
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
