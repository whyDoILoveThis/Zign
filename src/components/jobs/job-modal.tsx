"use client";

import { useState, useEffect } from "react";
import { Button, Input, Textarea, Select, Modal } from "@/components/ui";
import type { Client, Profile } from "@/types";

interface JobFormData {
  title: string;
  description: string;
  client_id: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  scheduled_date: string;
  scheduled_time: string;
  estimated_duration_minutes: string;
  notes: string;
  installer_ids: string[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Partial<JobFormData> & { $id?: string };
}

export function JobModal({ open, onClose, onSuccess, initialData }: Props) {
  const isEditing = !!initialData?.$id;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [installers, setInstallers] = useState<Profile[]>([]);
  const [form, setForm] = useState<JobFormData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    client_id: initialData?.client_id || "",
    address: initialData?.address || "",
    city: initialData?.city || "",
    state: initialData?.state || "",
    postal_code: initialData?.postal_code || "",
    scheduled_date: initialData?.scheduled_date || "",
    scheduled_time: initialData?.scheduled_time || "",
    estimated_duration_minutes: initialData?.estimated_duration_minutes || "",
    notes: initialData?.notes || "",
    installer_ids: initialData?.installer_ids || [],
  });

  useEffect(() => {
    if (open) {
      fetch("/api/clients")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setClients(data);
        })
        .catch(() => {});
      fetch("/api/installers")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setInstallers(data);
        })
        .catch(() => {});
    }
  }, [open]);

  // When a client is selected, auto-fill the address
  const handleClientChange = (clientId: string) => {
    setForm((prev) => ({ ...prev, client_id: clientId }));
    const client = clients.find((c) => c.$id === clientId);
    if (client && !form.address) {
      setForm((prev) => ({
        ...prev,
        address: client.address,
        city: client.city || "",
        state: client.state || "",
        postal_code: client.postal_code || "",
      }));
    }
  };

  const updateField = (field: keyof JobFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const url = isEditing ? `/api/jobs/${initialData!.$id}` : "/api/jobs";
      const method = isEditing ? "PATCH" : "POST";

      const payload = {
        ...form,
        estimated_duration_minutes: form.estimated_duration_minutes
          ? parseInt(form.estimated_duration_minutes)
          : null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save job");
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit Job" : "Create New Job"}
      description={
        isEditing
          ? "Update job details"
          : "Schedule a new sign installation job"
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400">
            {error}
          </div>
        )}

        <Input
          id="job-title"
          label="Job Title"
          required
          value={form.title}
          onChange={(e) => updateField("title", e.target.value)}
          placeholder="Channel letter installation — Acme Foods"
        />

        <Select
          id="job-client"
          label="Client"
          required
          value={form.client_id}
          onChange={(e) => handleClientChange(e.target.value)}
          placeholder="Select a client"
          options={clients.map((c) => ({ value: c.$id, label: c.name }))}
        />

        <Textarea
          id="job-description"
          label="Description"
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
          placeholder="Describe the installation work..."
          rows={3}
        />

        {/* Address */}
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Installation Address
          </p>
          <div className="space-y-3">
            <Input
              id="job-address"
              label="Street Address"
              required
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              placeholder="456 Commerce Blvd"
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <Input
                id="job-city"
                label="City"
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
                placeholder="Denver"
              />
              <Input
                id="job-state"
                label="State"
                value={form.state}
                onChange={(e) => updateField("state", e.target.value)}
                placeholder="CO"
              />
              <Input
                id="job-zip"
                label="Postal Code"
                value={form.postal_code}
                onChange={(e) => updateField("postal_code", e.target.value)}
                placeholder="80202"
              />
            </div>
          </div>
        </div>

        {/* Scheduling */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            id="job-date"
            label="Scheduled Date"
            type="date"
            value={form.scheduled_date}
            onChange={(e) => updateField("scheduled_date", e.target.value)}
          />
          <Input
            id="job-time"
            label="Start Time"
            type="time"
            value={form.scheduled_time}
            onChange={(e) => updateField("scheduled_time", e.target.value)}
          />
          <Input
            id="job-duration"
            label="Est. Duration (min)"
            type="number"
            value={form.estimated_duration_minutes}
            onChange={(e) =>
              updateField("estimated_duration_minutes", e.target.value)
            }
            placeholder="120"
          />
        </div>

        <Textarea
          id="job-notes"
          label="Notes"
          value={form.notes}
          onChange={(e) => updateField("notes", e.target.value)}
          placeholder="Special instructions, access codes, etc."
          rows={2}
        />

        {/* Assign Installers */}
        {installers.length > 0 && (
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Assign Installers
            </p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {installers.map((installer) => {
                const checked = form.installer_ids.includes(installer.$id);
                return (
                  <label
                    key={installer.$id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setForm((prev) => ({
                          ...prev,
                          installer_ids: checked
                            ? prev.installer_ids.filter(
                                (id) => id !== installer.$id,
                              )
                            : [...prev.installer_ids, installer.$id],
                        }))
                      }
                      className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 dark:border-zinc-600"
                    />
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      {installer.first_name} {installer.last_name}
                    </span>
                    {installer.email && (
                      <span className="text-xs text-zinc-400">
                        {installer.email}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {isEditing ? "Save Changes" : "Create Job"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
