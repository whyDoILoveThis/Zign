"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Shield,
  Briefcase,
  Wrench,
  Mail,
  Phone,
  ChevronDown,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

interface TeamMember {
  $id: string;
  clerk_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone: string | null;
  avatar_url: string | null;
  $createdAt: string;
}

const roleConfig: Record<
  UserRole,
  { label: string; icon: typeof Shield; color: string }
> = {
  admin: {
    label: "Admin",
    icon: Shield,
    color: "text-red-600 bg-red-50 dark:bg-red-950/30",
  },
  office: {
    label: "Office",
    icon: Briefcase,
    color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30",
  },
  installer: {
    label: "Installer",
    icon: Wrench,
    color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30",
  },
};

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  const fetchTeam = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, teamRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/team"),
      ]);

      if (profileRes.ok) {
        const profile = await profileRes.json();
        setCurrentUserRole(profile.role);
      }

      if (teamRes.ok) {
        const data = await teamRes.json();
        setMembers(data);
      } else if (teamRes.status === 403) {
        setError("You don't have permission to view team members");
      } else {
        setError("Failed to load team members");
      }
    } catch (err) {
      console.error("Failed to fetch team:", err);
      setError("Failed to load team members");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const updateRole = async (profileId: string, newRole: UserRole) => {
    setUpdatingRole(profileId);
    try {
      const res = await fetch("/api/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, role: newRole }),
      });

      if (res.ok) {
        setMembers((prev) =>
          prev.map((m) => (m.$id === profileId ? { ...m, role: newRole } : m)),
        );
        setEditingRole(null);
      }
    } catch (err) {
      console.error("Failed to update role:", err);
    } finally {
      setUpdatingRole(null);
    }
  };

  const admins = members.filter((m) => m.role === "admin");
  const office = members.filter((m) => m.role === "office");
  const installers = members.filter((m) => m.role === "installer");

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Team
        </h1>
        <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 py-16 dark:border-zinc-700">
          <AlertCircle className="h-8 w-8 text-zinc-400" />
          <p className="mt-3 text-zinc-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Team
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {members.length} team member{members.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchTeam}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <Card className="text-center">
          <Shield className="mx-auto h-6 w-6 text-red-500" />
          <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {admins.length}
          </p>
          <p className="text-xs text-zinc-500">Admins</p>
        </Card>
        <Card className="text-center">
          <Briefcase className="mx-auto h-6 w-6 text-blue-500" />
          <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {office.length}
          </p>
          <p className="text-xs text-zinc-500">Office Staff</p>
        </Card>
        <Card className="text-center">
          <Wrench className="mx-auto h-6 w-6 text-amber-500" />
          <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {installers.length}
          </p>
          <p className="text-xs text-zinc-500">Installers</p>
        </Card>
      </div>

      {members.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Users}
            title="No team members yet"
            description="Team members are added automatically when they sign up via Clerk"
          />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {members.map((member) => {
            const config = roleConfig[member.role];
            const Icon = config.icon;

            return (
              <Card key={member.$id} padding={false}>
                <div className="flex items-center gap-4 p-4">
                  {/* Avatar */}
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {member.first_name?.[0]}
                    {member.last_name?.[0]}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                        {member.first_name} {member.last_name}
                      </h3>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                          config.color,
                        )}
                      >
                        <Icon className="h-3 w-3" />
                        {config.label}
                      </span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {member.email}
                      </span>
                      {member.phone && (
                        <a
                          href={`tel:${member.phone}`}
                          className="flex items-center gap-1 text-blue-600 dark:text-blue-400"
                        >
                          <Phone className="h-3 w-3" />
                          {member.phone}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Role editor (admin only) */}
                  {currentUserRole === "admin" && (
                    <div className="relative">
                      <button
                        onClick={() =>
                          setEditingRole(
                            editingRole === member.$id ? null : member.$id,
                          )
                        }
                        className="flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      >
                        Change Role
                        <ChevronDown className="h-3 w-3" />
                      </button>

                      {editingRole === member.$id && (
                        <div className="absolute right-0 top-full z-10 mt-1 w-36 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                          {(["admin", "office", "installer"] as UserRole[]).map(
                            (role) => {
                              const rc = roleConfig[role];
                              return (
                                <button
                                  key={role}
                                  onClick={() => updateRole(member.$id, role)}
                                  disabled={updatingRole === member.$id}
                                  className={cn(
                                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800",
                                    member.role === role && "font-medium",
                                  )}
                                >
                                  <rc.icon className="h-3.5 w-3.5" />
                                  {rc.label}
                                  {member.role === role && (
                                    <span className="ml-auto text-xs text-zinc-400">
                                      current
                                    </span>
                                  )}
                                </button>
                              );
                            },
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
