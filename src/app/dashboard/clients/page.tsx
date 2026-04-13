"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Building2,
  Phone,
  Mail,
  MapPin,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button, Card, EmptyState, Input } from "@/components/ui";
import { Spinner } from "@/components/ui/spinner";
import { ClientModal } from "@/components/clients/client-modal";
import type { Client } from "@/types";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/clients?${params}`);
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (err) {
      console.error("Failed to fetch clients:", err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this client?")) return;
    const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchClients();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to delete client");
    }
    setMenuOpen(null);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setModalOpen(true);
    setMenuOpen(null);
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Clients
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {clients.length} client{clients.length !== 1 ? "s" : ""} in your
            directory
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingClient(null);
            setModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Add Client
        </Button>
      </div>

      {/* Search */}
      <div className="mt-6 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-zinc-300 bg-white pl-10 pr-4 text-sm focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:ring-zinc-400/20"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="mt-12 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : clients.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Building2}
            title="No clients yet"
            description="Add your first client to start creating jobs and scheduling installations."
            action={
              <Button
                onClick={() => {
                  setEditingClient(null);
                  setModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Add Client
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Card key={client.$id} className="relative group">
              {/* Menu */}
              <div className="absolute right-4 top-4">
                <button
                  onClick={() =>
                    setMenuOpen(menuOpen === client.$id ? null : client.$id)
                  }
                  className="rounded-lg p-1.5 text-zinc-400 opacity-0 transition-opacity hover:bg-zinc-100 hover:text-zinc-600 group-hover:opacity-100 dark:hover:bg-zinc-800"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                {menuOpen === client.$id && (
                  <div className="absolute right-0 mt-1 w-36 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                    <button
                      onClick={() => handleEdit(client)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(client.$id)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {client.name}
                  </h3>
                  {client.contact_name && (
                    <p className="text-sm text-zinc-500">
                      {client.contact_name}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{client.address}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      {client.phone}
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <ClientModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingClient(null);
        }}
        onSuccess={fetchClients}
        initialData={
          editingClient
            ? {
                $id: editingClient.$id,
                name: editingClient.name,
                contact_name: editingClient.contact_name || "",
                email: editingClient.email || "",
                phone: editingClient.phone || "",
                address: editingClient.address,
                city: editingClient.city || "",
                state: editingClient.state || "",
                postal_code: editingClient.postal_code || "",
                notes: editingClient.notes || "",
              }
            : undefined
        }
      />
    </div>
  );
}
