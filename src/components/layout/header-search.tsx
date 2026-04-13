"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Briefcase, Building2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/ui";

interface SearchResult {
  jobs: {
    $id: string;
    title: string;
    address: string;
    status: string;
    client_name: string | null;
  }[];
  clients: { $id: string; name: string; contact_name: string | null }[];
}

export function HeaderSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const router = useRouter();

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      setOpen(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      // Abort previous in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error();
        const data: SearchResult = await res.json();
        setResults(data);
        setOpen(true);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      setLoading(false);
    };
  }, [query]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  const navigate = useCallback(
    (path: string) => {
      setOpen(false);
      setQuery("");
      setResults(null);
      router.push(path);
    },
    [router],
  );

  const hasResults =
    results && (results.jobs.length > 0 || results.clients.length > 0);
  const noResults =
    results && results.jobs.length === 0 && results.clients.length === 0;

  return (
    <div ref={ref} className="relative hidden max-w-md flex-1 md:block">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-teal-500" />
      )}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (results) setOpen(true);
        }}
        placeholder="Search jobs, clients..."
        className="h-9 w-full rounded-lg border border-card-border bg-card-bg pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 backdrop-blur-sm focus:border-teal-400/50 focus:outline-none focus:ring-1 focus:ring-teal-400/30 dark:text-slate-200 dark:placeholder:text-slate-500"
      />

      {open && (
        <div className="absolute left-0 right-0 top-full z-[9999] mt-1.5 overflow-hidden rounded-xl border border-card-border bg-white shadow-[0_8px_32px_rgba(13,148,136,0.1)] dark:bg-[#0c1820] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          {hasResults && (
            <>
              {results.jobs.length > 0 && (
                <div>
                  <div className="px-3 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Jobs
                  </div>
                  {results.jobs.map((job) => (
                    <button
                      key={job.$id}
                      onClick={() => navigate(`/dashboard/jobs/${job.$id}`)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-accent-soft"
                    >
                      <Briefcase className="h-4 w-4 shrink-0 text-teal-500" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                          {job.title}
                        </div>
                        <div className="truncate text-xs text-slate-400 dark:text-slate-500">
                          {job.client_name ? `${job.client_name} · ` : ""}
                          {job.address}
                        </div>
                      </div>
                      <StatusBadge
                        status={
                          job.status as import("@/types/database").JobStatus
                        }
                      />
                    </button>
                  ))}
                </div>
              )}

              {results.clients.length > 0 && (
                <div
                  className={
                    results.jobs.length > 0 ? "border-t border-card-border" : ""
                  }
                >
                  <div className="px-3 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Clients
                  </div>
                  {results.clients.map((client) => (
                    <button
                      key={client.$id}
                      onClick={() =>
                        navigate(`/dashboard/clients/${client.$id}`)
                      }
                      className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-accent-soft"
                    >
                      <Building2 className="h-4 w-4 shrink-0 text-teal-500" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                          {client.name}
                        </div>
                        {client.contact_name && (
                          <div className="truncate text-xs text-slate-400 dark:text-slate-500">
                            {client.contact_name}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {noResults && (
            <div className="px-4 py-6 text-center text-sm text-slate-400 dark:text-slate-500">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
