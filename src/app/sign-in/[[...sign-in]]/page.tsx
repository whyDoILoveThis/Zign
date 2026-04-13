"use client";

import { SignIn, useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";

const DEMO_ACCOUNTS = [
  {
    label: "Admin Demo",
    description: "Full access — manage jobs, team, clients",
    email: process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL || "admin@demo.zign.app",
    password: process.env.NEXT_PUBLIC_DEMO_ADMIN_PASSWORD || "demo-admin-2026",
  },
  {
    label: "Installer Demo",
    description: "Field view — assigned jobs, status updates",
    email: process.env.NEXT_PUBLIC_DEMO_INSTALLER_EMAIL || "installer@demo.zign.app",
    password: process.env.NEXT_PUBLIC_DEMO_INSTALLER_PASSWORD || "demo-installer-2026",
  },
];

export default function SignInPage() {
  const { signIn, setActive } = useSignIn();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDemoLogin = async (account: (typeof DEMO_ACCOUNTS)[number]) => {
    if (!signIn) return;
    setLoading(account.label);
    setError(null);
    try {
      const result = await signIn.create({
        identifier: account.email,
        password: account.password,
      });
      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        router.push("/dashboard");
      }
    } catch {
      setError("Demo account not available. Please sign in manually.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 dark:bg-white">
            <span className="text-lg font-bold text-white dark:text-zinc-900">
              Z
            </span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Sign in to your Zign operations dashboard
          </p>
        </div>

        {/* Demo account buttons */}
        <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Try a demo account
          </p>
          <div className="flex gap-3">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.label}
                onClick={() => handleDemoLogin(account)}
                disabled={loading !== null}
                className="flex flex-1 flex-col items-center gap-1 rounded-lg border border-zinc-200 px-3 py-3 text-center transition-colors hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
              >
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {loading === account.label ? "Signing in..." : account.label}
                </span>
                <span className="text-[11px] leading-tight text-zinc-500 dark:text-zinc-400">
                  {account.description}
                </span>
              </button>
            ))}
          </div>
          {error && (
            <p className="mt-2 text-center text-xs text-red-500">{error}</p>
          )}
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-zinc-50 px-3 text-xs text-zinc-400 dark:bg-zinc-950 dark:text-zinc-500">
              or sign in with your account
            </span>
          </div>
        </div>

        <SignIn
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-none border border-zinc-200 dark:border-zinc-800 rounded-xl",
            },
          }}
        />
      </div>
    </div>
  );
}
