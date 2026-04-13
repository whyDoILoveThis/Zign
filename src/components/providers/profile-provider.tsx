"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { UserRole } from "@/types";

interface ProfileContextValue {
  role: UserRole | null;
  loading: boolean;
}

const ProfileContext = createContext<ProfileContextValue>({
  role: null,
  loading: true,
});

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.role) setRole(data.role);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProfileContext.Provider value={{ role, loading }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
