"use client";

import { useEffect, useRef, useState } from "react";
import { Spinner } from "@/components/ui/spinner";

interface MapJob {
  $id: string;
  title: string;
  lat: number | null;
  lng: number | null;
  status: string;
  address: string;
  city: string | null;
  state: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  clients: { name: string };
}

interface TomTomMapProps {
  jobs: MapJob[];
  selectedJobId: string | null;
  onJobSelect: (jobId: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: "#3b82f6",
  in_progress: "#f59e0b",
  completed: "#10b981",
  on_hold: "#a1a1aa",
  cancelled: "#ef4444",
};

export function TomTomMap({
  jobs,
  selectedJobId,
  onJobSelect,
}: TomTomMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const markersRef = useRef<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      if (!mapRef.current) return;

      try {
        // Fetch API key from server
        const res = await fetch("/api/maps/config");
        if (!res.ok) {
          setError("Failed to load map configuration");
          setLoading(false);
          return;
        }
        const { apiKey } = await res.json();

        if (cancelled) return;

        // Dynamic import — TomTom SDK accesses window/document
        const { TomTomConfig } = await import("@tomtom-org/maps-sdk/core");
        const { TomTomMap: TTMap } = await import("@tomtom-org/maps-sdk/map");
        // Import maplibre CSS
        await import("maplibre-gl/dist/maplibre-gl.css");

        if (cancelled) return;

        TomTomConfig.instance.put({ apiKey });

        // Calculate center from jobs or default to US center
        const jobsWithCoords = jobs.filter((j) => j.lat && j.lng);
        let center: [number, number] = [-98.5, 39.8]; // US center
        let zoom = 4;

        if (jobsWithCoords.length === 1) {
          center = [jobsWithCoords[0].lng!, jobsWithCoords[0].lat!];
          zoom = 13;
        } else if (jobsWithCoords.length > 1) {
          const lngs = jobsWithCoords.map((j) => j.lng!);
          const lats = jobsWithCoords.map((j) => j.lat!);
          center = [
            (Math.min(...lngs) + Math.max(...lngs)) / 2,
            (Math.min(...lats) + Math.max(...lats)) / 2,
          ];
          const lngSpan = Math.max(...lngs) - Math.min(...lngs);
          const latSpan = Math.max(...lats) - Math.min(...lats);
          const span = Math.max(lngSpan, latSpan);
          if (span < 0.1) zoom = 13;
          else if (span < 1) zoom = 10;
          else if (span < 5) zoom = 7;
          else zoom = 5;
        }

        const map = new TTMap({
          mapLibre: {
            container: mapRef.current!,
            center,
            zoom,
          },
        });

        mapInstanceRef.current = map;

        // Wait for map to load before adding markers
        const mapLibre = map.mapLibreMap;
        mapLibre.on("load", () => {
          if (cancelled) return;
          setLoading(false);
          addMarkers(jobs, mapLibre, onJobSelect);
        });
      } catch (err) {
        console.error("Map init error:", err);
        if (!cancelled) {
          setError("Failed to initialize map");
          setLoading(false);
        }
      }
    }

    initMap();

    return () => {
      cancelled = true;
      // Clean up markers
      markersRef.current.forEach((m: unknown) => {
        if (m && typeof m === "object" && "remove" in m) {
          (m as { remove: () => void }).remove();
        }
      });
      markersRef.current = [];
      // Clean up map
      if (mapInstanceRef.current) {
        const map = mapInstanceRef.current as {
          dispose?: () => void;
          mapLibreMap?: { remove: () => void };
        };
        if (map.dispose) map.dispose();
        else if (map.mapLibreMap) map.mapLibreMap.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers when jobs or selection changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current as { mapLibreMap: unknown };
    const mapLibre = map.mapLibreMap;
    if (!mapLibre) return;

    // Clear existing markers
    markersRef.current.forEach((m: unknown) => {
      if (m && typeof m === "object" && "remove" in m) {
        (m as { remove: () => void }).remove();
      }
    });
    markersRef.current = [];

    addMarkers(jobs, mapLibre, onJobSelect);
  }, [jobs, selectedJobId, onJobSelect]);

  function addMarkers(
    jobList: MapJob[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mapLibre: any,
    onSelect: (id: string) => void,
  ) {
    // Inject popup styles once — force z-index above all markers + modern card look
    if (!document.getElementById("zign-popup-styles")) {
      const style = document.createElement("style");
      style.id = "zign-popup-styles";
      style.textContent = `
        .maplibregl-popup {
          z-index: 9999 !important;
        }
        .maplibregl-popup-content {
          padding: 0 !important;
          border-radius: 16px !important;
          box-shadow: 0 25px 60px -10px rgba(0,0,0,0.18), 0 10px 24px -8px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.04) !important;
          border: none !important;
          overflow: hidden !important;
        }
        .maplibregl-popup-close-button {
          font-size: 16px !important;
          color: #a1a1aa !important;
          right: 10px !important;
          top: 10px !important;
          width: 24px !important;
          height: 24px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          border-radius: 8px !important;
          transition: all 0.15s ease !important;
          z-index: 1 !important;
          background: rgba(0,0,0,0.04) !important;
        }
        .maplibregl-popup-close-button:hover {
          background: rgba(0,0,0,0.08) !important;
          color: #18181b !important;
        }
        .maplibregl-popup-tip {
          border-top-color: white !important;
        }
        .zign-popup-link {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
          padding: 9px 16px;
          background: linear-gradient(135deg, #18181b 0%, #27272a 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 12.5px;
          font-weight: 600;
          letter-spacing: 0.2px;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .zign-popup-link:hover {
          background: linear-gradient(135deg, #27272a 0%, #3f3f46 100%);
          box-shadow: 0 4px 14px rgba(0,0,0,0.12);
        }
      `;
      document.head.appendChild(style);
    }

    import("maplibre-gl").then(({ Marker, Popup }) => {
      const newMarkers: unknown[] = [];

      const STATUS_META: Record<string, [string, string]> = {
        scheduled: ["Scheduled", "rgba(59,130,246,0.1)"],
        in_progress: ["In Progress", "rgba(245,158,11,0.1)"],
        completed: ["Completed", "rgba(16,185,129,0.1)"],
        on_hold: ["On Hold", "rgba(161,161,170,0.1)"],
        cancelled: ["Cancelled", "rgba(239,68,68,0.1)"],
      };

      jobList
        .filter((j) => j.lat && j.lng)
        .forEach((job) => {
          const color = STATUS_COLORS[job.status] || "#3b82f6";
          const isSelected = job.$id === selectedJobId;

          const el = document.createElement("div");
          el.className = "tomtom-marker";
          el.style.cssText = `
            width: 32px;
            height: 32px;
            background: ${color};
            border: 3px solid ${isSelected ? "#facc15" : "white"};
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: ${isSelected ? "10" : "1"};
          `;
          el.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 6-9 13-9 13s-9-7-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;

          el.addEventListener("click", () => {
            onSelect(job.$id);
          });

          const esc = (s: string) =>
            s
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;");
          const [statusLabel, statusBg] = STATUS_META[job.status] || [
            job.status,
            "rgba(0,0,0,0.05)",
          ];
          const location = [job.address, job.city, job.state]
            .filter(Boolean)
            .join(", ");
          const dateStr = job.scheduled_date
            ? new Date(job.scheduled_date + "T00:00:00").toLocaleDateString(
                "en-US",
                { month: "short", day: "numeric", year: "numeric" },
              )
            : null;
          const timeStr = job.scheduled_time
            ? job.scheduled_time.slice(0, 5)
            : null;
          const schedule = [dateStr, timeStr].filter(Boolean).join(" at ");

          const popup = new Popup({
            offset: 24,
            closeButton: true,
            closeOnClick: false,
            maxWidth: "300px",
          }).setHTML(
            `<div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; padding: 18px 18px 16px;">
              <div style="margin-bottom: 12px;">
                <span style="
                  display: inline-flex; align-items: center; gap: 5px;
                  padding: 4px 10px; background: ${statusBg}; color: ${color};
                  border-radius: 20px; font-size: 11px; font-weight: 600; letter-spacing: 0.3px;
                ">
                  <span style="width: 6px; height: 6px; border-radius: 50%; background: ${color};"></span>
                  ${esc(statusLabel)}
                </span>
              </div>
              <div style="font-size: 15px; font-weight: 700; color: #09090b; line-height: 1.3; margin-bottom: 12px;">
                ${esc(job.title)}
              </div>
              <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">
                ${
                  job.clients?.name
                    ? `
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span style="display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; background: #f4f4f5; border-radius: 8px; flex-shrink: 0;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#71717a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>
                  </span>
                  <span style="font-size: 13px; color: #3f3f46; font-weight: 500;">${esc(job.clients.name)}</span>
                </div>`
                    : ""
                }
                ${
                  location
                    ? `
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span style="display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; background: #f4f4f5; border-radius: 8px; flex-shrink: 0;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#71717a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 6-9 13-9 13s-9-7-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  </span>
                  <span style="font-size: 12.5px; color: #71717a; line-height: 1.4;">${esc(location)}</span>
                </div>`
                    : ""
                }
                ${
                  schedule
                    ? `
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span style="display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; background: #f4f4f5; border-radius: 8px; flex-shrink: 0;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#71717a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </span>
                  <span style="font-size: 12.5px; color: #71717a;">${esc(schedule)}</span>
                </div>`
                    : ""
                }
              </div>
              <a href="/dashboard/jobs/${job.$id}" class="zign-popup-link">
                View Job
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </a>
            </div>`,
          );

          const marker = new Marker({ element: el })
            .setLngLat([job.lng!, job.lat!])
            .addTo(mapLibre);

          // Show popup on hover, not click
          el.addEventListener("mouseenter", () => {
            if (!popup.isOpen()) {
              popup.setLngLat([job.lng!, job.lat!]).addTo(mapLibre);
            }
          });
          el.addEventListener("mouseleave", () => {
            setTimeout(() => {
              const popupEl = popup.getElement();
              if (popupEl && !popupEl.matches(":hover")) {
                popup.remove();
              } else if (popupEl) {
                popupEl.addEventListener("mouseleave", () => popup.remove(), {
                  once: true,
                });
              }
            }, 100);
          });

          newMarkers.push(marker);
        });

      markersRef.current = newMarkers;
    });
  }

  // Fly to selected job
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedJobId) return;
    const job = jobs.find((j) => j.$id === selectedJobId);
    if (!job?.lat || !job?.lng) return;

    const map = mapInstanceRef.current as {
      mapLibreMap: { flyTo: (opts: unknown) => void };
    };
    map.mapLibreMap.flyTo({
      center: [job.lng, job.lat],
      zoom: 14,
      duration: 1000,
    });
  }, [selectedJobId, jobs]);

  if (error) {
    return (
      <div className="flex h-[600px] flex-col items-center justify-center text-center">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative h-[600px]">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800">
          <Spinner size="lg" />
        </div>
      )}
      <div ref={mapRef} className="h-full w-full" />
    </div>
  );
}
