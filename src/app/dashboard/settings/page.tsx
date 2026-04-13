"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  Map,
  Bell,
  Palette,
  Save,
  ExternalLink,
  CheckCircle2,
  Database,
  Upload,
  Trash2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button, Card, CardHeader, Input } from "@/components/ui";
import { cn } from "@/lib/utils";

type Tab = "company" | "maps" | "notifications" | "appearance" | "demo";

const tabs: { key: Tab; label: string; icon: typeof Building2 }[] = [
  { key: "company", label: "Company", icon: Building2 },
  { key: "maps", label: "Maps & Routing", icon: Map },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "appearance", label: "Appearance", icon: Palette },
  { key: "demo", label: "Demo Data", icon: Database },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("company");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Settings
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            System configuration and preferences
          </p>
        </div>
        <Button onClick={handleSave}>
          {saved ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Saved
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Tab navigation */}
        <nav className="space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
                activeTab === tab.key
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Tab content */}
        <div className="space-y-6">
          {activeTab === "company" && <CompanySettings />}
          {activeTab === "maps" && <MapsSettings />}
          {activeTab === "notifications" && <NotificationSettings />}
          {activeTab === "appearance" && <AppearanceSettings />}
          {activeTab === "demo" && <DemoSettings />}
        </div>
      </div>
    </div>
  );
}

function CompanySettings() {
  return (
    <>
      <Card>
        <CardHeader title="Company Information" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input label="Company Name" defaultValue="Zign" />
          <Input label="Phone" placeholder="(555) 000-0000" />
          <Input
            label="Email"
            placeholder="info@zign.com"
            className="sm:col-span-2"
          />
          <Input
            label="Address"
            placeholder="123 Main St"
            className="sm:col-span-2"
          />
          <Input label="City" placeholder="City" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="State" placeholder="CA" />
            <Input label="ZIP" placeholder="90001" />
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Business Hours" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input label="Start Time" type="time" defaultValue="08:00" />
          <Input label="End Time" type="time" defaultValue="17:00" />
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          Business hours are used for scheduling and calendar defaults
        </p>
      </Card>
    </>
  );
}

function MapsSettings() {
  const [provider, setProvider] = useState("tomtom");

  return (
    <>
      <Card>
        <CardHeader title="Maps Provider" />
        <p className="mt-1 text-sm text-zinc-500">
          Choose which mapping service to use for geocoding and routing
        </p>
        <div className="mt-4 space-y-3">
          {[
            {
              id: "tomtom",
              name: "TomTom",
              desc: "Current provider — geocoding, routing, and navigation",
            },
            {
              id: "google",
              name: "Google Maps",
              desc: "Coming soon — requires Google Maps API key",
            },
            {
              id: "mapbox",
              name: "Mapbox",
              desc: "Coming soon — requires Mapbox access token",
            },
          ].map((p) => (
            <label
              key={p.id}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                provider === p.id
                  ? "border-zinc-900 bg-zinc-50 dark:border-zinc-50 dark:bg-zinc-800"
                  : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700",
              )}
            >
              <input
                type="radio"
                name="provider"
                value={p.id}
                checked={provider === p.id}
                onChange={(e) => setProvider(e.target.value)}
                className="accent-zinc-900 dark:accent-white"
              />
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {p.name}
                </p>
                <p className="text-xs text-zinc-500">{p.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="API Configuration" />
        <p className="mt-1 text-xs text-zinc-500">
          API keys are configured in your environment variables (.env.local) and
          never exposed to the browser
        </p>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
            <div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                TOMTOM_API_KEY
              </p>
              <p className="text-xs text-zinc-500">Server-side only</p>
            </div>
            <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              Configured
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
            <div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                MAPS_PROVIDER
              </p>
              <p className="text-xs text-zinc-500">
                Provider selection (tomtom, google, mapbox)
              </p>
            </div>
            <code className="rounded bg-zinc-200 px-2 py-0.5 text-xs dark:bg-zinc-700">
              tomtom
            </code>
          </div>
        </div>
      </Card>
    </>
  );
}

function NotificationSettings() {
  return (
    <Card>
      <CardHeader title="Notifications" />
      <div className="mt-4 space-y-4">
        {[
          {
            label: "Job status changes",
            desc: "Get notified when a job status is updated",
            checked: true,
          },
          {
            label: "New job assignments",
            desc: "Notifications for newly assigned jobs",
            checked: true,
          },
          {
            label: "Note mentions",
            desc: "When someone mentions you in a job note",
            checked: false,
          },
          {
            label: "Daily schedule summary",
            desc: "Morning email with your day's schedule",
            checked: false,
          },
        ].map((item, i) => (
          <label key={i} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {item.label}
              </p>
              <p className="text-xs text-zinc-500">{item.desc}</p>
            </div>
            <input
              type="checkbox"
              defaultChecked={item.checked}
              className="h-4 w-4 rounded accent-zinc-900 dark:accent-white"
            />
          </label>
        ))}
      </div>
      <p className="mt-4 text-xs text-zinc-400">
        Notification delivery will be enabled in a future update
      </p>
    </Card>
  );
}

function AppearanceSettings() {
  const [theme, setTheme] = useState("system");

  return (
    <Card>
      <CardHeader title="Theme" />
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { id: "light", label: "Light" },
          { id: "dark", label: "Dark" },
          { id: "system", label: "System" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={cn(
              "rounded-lg border p-4 text-center text-sm font-medium transition-colors",
              theme === t.id
                ? "border-zinc-900 bg-zinc-50 text-zinc-900 dark:border-zinc-50 dark:bg-zinc-800 dark:text-zinc-50"
                : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-400",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
    </Card>
  );
}

function DemoSettings() {
  const [seedLoading, setSeedLoading] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleSeed = async () => {
    setSeedLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/demo/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load demo data");
      const c = data.counts;
      setResult({
        type: "success",
        message: `Loaded ${c.profiles} profiles, ${c.clients} clients, ${c.jobs} jobs, ${c.assignments} assignments, ${c.notes} notes, and ${c.attachments} attachments.`,
      });
    } catch (err) {
      setResult({
        type: "error",
        message: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setSeedLoading(false);
    }
  };

  const handleClear = async () => {
    setClearLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/demo/clear", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete demo data");
      const d = data.deleted;
      setResult({
        type: "success",
        message: `Deleted ${d.profiles} profiles, ${d.clients} clients, ${d.jobs} jobs, ${d.assignments} assignments, ${d.notes} notes, and ${d.attachments} attachments.`,
      });
    } catch (err) {
      setResult({
        type: "error",
        message: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setClearLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader title="Demo Data" />
        <p className="mt-1 text-sm text-zinc-500">
          Populate or clear demo data to explore how Zign works with realistic
          sign installation jobs, clients, and team members.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {/* Load Demo Data */}
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Load Demo Data
              </h3>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Creates 5 team members, 5 clients, 8 jobs with assignments, notes,
              and file attachment records.
            </p>
            <Button
              onClick={handleSeed}
              disabled={seedLoading || clearLoading}
              className="mt-4 w-full"
            >
              {seedLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Load Demo Data
                </>
              )}
            </Button>
          </div>

          {/* Delete Demo Data */}
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Delete Demo Data
              </h3>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Removes all demo profiles, clients, jobs, and associated records.
              Your real data is not affected.
            </p>
            <Button
              onClick={handleClear}
              disabled={seedLoading || clearLoading}
              variant="secondary"
              className="mt-4 w-full"
            >
              {clearLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete Demo Data
                </>
              )}
            </Button>
          </div>
        </div>

        {result && (
          <div
            className={cn(
              "mt-4 flex items-start gap-2 rounded-lg p-3 text-sm",
              result.type === "success"
                ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
                : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400",
            )}
          >
            {result.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            {result.message}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="What gets created?" />
        <div className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
          <p>
            <span className="font-medium text-zinc-900 dark:text-zinc-50">
              Team:
            </span>{" "}
            1 admin, 1 office manager, 3 installers
          </p>
          <p>
            <span className="font-medium text-zinc-900 dark:text-zinc-50">
              Clients:
            </span>{" "}
            Metro Mall Group, Sunrise Medical Center, Lone Star Brewing Co.,
            Hill Country Realty, Austin ISD
          </p>
          <p>
            <span className="font-medium text-zinc-900 dark:text-zinc-50">
              Jobs:
            </span>{" "}
            8 jobs across all statuses — completed, in progress, scheduled, and
            on hold
          </p>
          <p>
            <span className="font-medium text-zinc-900 dark:text-zinc-50">
              Details:
            </span>{" "}
            12 assignments, 12 activity notes, and 9 attachment records
          </p>
        </div>
        <p className="mt-3 text-xs text-zinc-400">
          Demo data uses &quot;demo_&quot; prefixed IDs and is safely isolated
          from real data
        </p>
      </Card>
    </>
  );
}
