"use client";

import { useEffect, useState } from "react";
import { Button, Input, Textarea, Modal } from "@/components/ui";

interface ClientFormData {
  name: string;
  contact_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  notes: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Partial<ClientFormData> & { $id?: string };
}

export function ClientModal({ open, onClose, onSuccess, initialData }: Props) {
  const isEditing = !!initialData?.$id;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<ClientFormData>({
    name: initialData?.name || "",
    contact_name: initialData?.contact_name || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    address: initialData?.address || "",
    city: initialData?.city || "",
    state: initialData?.state || "",
    postal_code: initialData?.postal_code || "",
    notes: initialData?.notes || "",
  });

  useEffect(() => {
    setForm({
      name: initialData?.name || "",
      contact_name: initialData?.contact_name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      address: initialData?.address || "",
      city: initialData?.city || "",
      state: initialData?.state || "",
      postal_code: initialData?.postal_code || "",
      notes: initialData?.notes || "",
    });
  }, [initialData]);

  const updateField = (field: keyof ClientFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const url = isEditing
        ? `/api/clients/${initialData!.$id}`
        : "/api/clients";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save client");
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
      title={isEditing ? "Edit Client" : "New Client"}
      description={
        isEditing
          ? "Update client information"
          : "Add a new client to your directory"
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="client-name"
            label="Company / Client Name"
            required
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="Acme Signs Co."
          />
          <Input
            id="contact-name"
            label="Contact Person"
            value={form.contact_name}
            onChange={(e) => updateField("contact_name", e.target.value)}
            placeholder="John Smith"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="client-email"
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder="john@acme.com"
          />
          <Input
            id="client-phone"
            label="Phone"
            type="tel"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            placeholder="(555) 123-4567"
          />
        </div>

        <Input
          id="client-address"
          label="Street Address"
          required
          value={form.address}
          onChange={(e) => updateField("address", e.target.value)}
          placeholder="123 Main St"
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            id="client-city"
            label="City"
            value={form.city}
            onChange={(e) => updateField("city", e.target.value)}
            placeholder="Denver"
          />
          <Input
            id="client-state"
            label="State"
            value={form.state}
            onChange={(e) => updateField("state", e.target.value)}
            placeholder="CO"
          />
          <Input
            id="client-zip"
            label="Postal Code"
            value={form.postal_code}
            onChange={(e) => updateField("postal_code", e.target.value)}
            placeholder="80202"
          />
        </div>

        <Textarea
          id="client-notes"
          label="Notes"
          value={form.notes}
          onChange={(e) => updateField("notes", e.target.value)}
          placeholder="Any additional notes..."
          rows={3}
        />

        <div className="flex justify-end gap-3 border-t border-card-border pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {isEditing ? "Save Changes" : "Add Client"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
