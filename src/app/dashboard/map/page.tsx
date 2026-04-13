"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  MapPin,
  Navigation,
  List,
  Clock,
  Building2,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { Button, Card, StatusBadge } from "@/components/ui";
import { Spinner } from "@/components/ui/spinner";
import { TomTomMap } from "@/components/map/tomtom-map";
import { cn } from "@/lib/utils";
import type { JobStatus } from "@/types";

interface MapJob {
  $id: string;
  title: string;
  address: string;
  city: string | null;
  state: string | null;
  lat: number | null;
  lng: number | null;
  status: JobStatus;
  scheduled_date: string | null;
  scheduled_time: string | null;
  clients: { name: string };
}

interface RouteInfo {
  distanceText: string;
  durationText: string;
  navigationUrl: string;
}

export default function MapPage() {
  const [jobs, setJobs] = useState<MapJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<MapJob | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [calculatingRoute, setCalculatingRoute] = useState(false);
  const [showList, setShowList] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>(
    "scheduled,in_progress",
  );

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/jobs");
      if (res.ok) {
        const data = await res.json();
        setJobs(data.filter((j: MapJob) => j.lat && j.lng));
      }
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const filteredJobs = jobs.filter((j) => {
    if (!statusFilter) return true;
    return statusFilter.split(",").includes(j.status);
  });

  const calculateRoute = async (job: MapJob) => {
    if (!job.lat || !job.lng) return;
    setCalculatingRoute(true);
    setRouteInfo(null);

    try {
      // Try to get user's location for routing
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
          });
        },
      );

      const res = await fetch("/api/maps/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          waypoints: [
            {
              coordinates: {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              },
              label: "Current Location",
            },
            {
              coordinates: { lat: job.lat, lng: job.lng },
              label: job.title,
            },
          ],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setRouteInfo(data);
      }
    } catch {
      // Fallback: just provide Google Maps navigation link
      setRouteInfo({
        distanceText: "—",
        durationText: "—",
        navigationUrl: `https://www.google.com/maps/dir/?api=1&destination=${job.lat},${job.lng}`,
      });
    } finally {
      setCalculatingRoute(false);
    }
  };

  const handleJobSelect = (job: MapJob) => {
    setSelectedJob(job);
    setRouteInfo(null);
  };

  const getStatusColor = (status: JobStatus) => {
    return {
      scheduled: "bg-blue-500",
      in_progress: "bg-amber-500",
      completed: "bg-emerald-500",
      on_hold: "bg-zinc-400",
      cancelled: "bg-red-500",
    }[status];
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Map View
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {filteredJobs.length} job{filteredJobs.length !== 1 ? "s" : ""} with
            locations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="scheduled,in_progress">Active Jobs</option>
            <option value="scheduled">Scheduled Only</option>
            <option value="in_progress">In Progress Only</option>
            <option value="">All Jobs</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowList(!showList)}
          >
            <List className="h-4 w-4" />
            {showList ? "Hide" : "Show"} List
          </Button>
          <Button variant="outline" size="sm" onClick={fetchJobs}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Map area */}
        <Card padding={false} className="relative overflow-hidden">
          {loading ? (
            <div className="flex h-[600px] items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="flex h-[600px] flex-col items-center justify-center text-center">
              <MapPin className="h-12 w-12 text-zinc-300" />
              <p className="mt-4 text-zinc-500">No jobs with locations found</p>
              <p className="text-sm text-zinc-400">
                Jobs need an address to appear on the map
              </p>
            </div>
          ) : (
            <TomTomMap
              jobs={filteredJobs}
              selectedJobId={selectedJob?.$id || null}
              onJobSelect={(jobId) => {
                const job = filteredJobs.find((j) => j.$id === jobId);
                if (job) handleJobSelect(job);
              }}
            />
          )}
        </Card>

        {/* Side panel */}
        {showList && (
          <div className="space-y-4">
            {/* Selected job details */}
            {selectedJob && (
              <Card className="border-blue-200 dark:border-blue-900">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                        {selectedJob.title}
                      </h3>
                      <p className="text-sm text-zinc-500">
                        {selectedJob.clients?.name}
                      </p>
                    </div>
                    <StatusBadge status={selectedJob.status} />
                  </div>

                  <div className="space-y-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" />
                      {[
                        selectedJob.address,
                        selectedJob.city,
                        selectedJob.state,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                    {selectedJob.scheduled_time && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5" />
                        {selectedJob.scheduled_time.slice(0, 5)}
                      </div>
                    )}
                  </div>

                  {/* Route info */}
                  {routeInfo && (
                    <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950/30">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-medium text-blue-700 dark:text-blue-300">
                          {routeInfo.distanceText}
                        </span>
                        <span className="text-blue-600 dark:text-blue-400">
                          {routeInfo.durationText}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => calculateRoute(selectedJob)}
                      loading={calculatingRoute}
                      className="flex-1"
                    >
                      <Navigation className="h-4 w-4" />
                      Get Route
                    </Button>
                    {(routeInfo?.navigationUrl || selectedJob.lat) && (
                      <a
                        href={
                          routeInfo?.navigationUrl ||
                          `https://www.google.com/maps/dir/?api=1&destination=${selectedJob.lat},${selectedJob.lng}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1"
                      >
                        <Button size="sm" className="w-full">
                          <ExternalLink className="h-4 w-4" />
                          Navigate
                        </Button>
                      </a>
                    )}
                    <Link
                      href={`/dashboard/jobs/${selectedJob.$id}`}
                      className="flex-1"
                    >
                      <Button size="sm" variant="ghost" className="w-full">
                        View Job
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            )}

            {/* Job list */}
            <Card padding={false}>
              <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                  Job Locations
                </h3>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {filteredJobs.map((job) => (
                  <button
                    key={job.$id}
                    onClick={() => handleJobSelect(job)}
                    className={cn(
                      "flex w-full items-center gap-3 border-b border-zinc-100 p-3 text-left transition-colors last:border-0 dark:border-zinc-800",
                      selectedJob?.$id === job.$id
                        ? "bg-blue-50 dark:bg-blue-950/20"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
                    )}
                  >
                    <div
                      className={cn(
                        "h-2.5 w-2.5 shrink-0 rounded-full",
                        getStatusColor(job.status),
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {job.title}
                      </p>
                      <p className="flex items-center gap-1 truncate text-xs text-zinc-500">
                        <Building2 className="h-3 w-3" />
                        {job.clients?.name}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
