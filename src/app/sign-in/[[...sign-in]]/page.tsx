"use client";

import { SignIn, useSignIn, useAuth, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";

const DEMO_ACCOUNTS = [
  {
    label: "Admin",
    role: "admin",
    tag: "Full access",
    description: "Manage jobs, team, clients, and scheduling",
    gradient: "from-emerald-500/20 to-emerald-500/5",
    border: "border-emerald-500/20 hover:border-emerald-500/40",
    iconBg: "bg-emerald-500/10",
    iconText: "text-emerald-400",
  },
  {
    label: "Installer",
    role: "installer",
    tag: "Field view",
    description: "See assigned jobs, update status, add photos",
    gradient: "from-sky-500/20 to-sky-500/5",
    border: "border-sky-500/20 hover:border-sky-500/40",
    iconBg: "bg-sky-500/10",
    iconText: "text-sky-400",
  },
];

export default function SignInPage() {
  const { signIn } = useSignIn();
  const { isSignedIn } = useAuth();
  const { setActive } = useClerk();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // If already signed in, redirect to dashboard to prevent re-render loop
  useEffect(() => {
    if (isSignedIn) {
      router.replace("/dashboard");
    }
  }, [isSignedIn, router]);

  const handleDemoLogin = async (account: (typeof DEMO_ACCOUNTS)[number]) => {
    if (!signIn) return;
    setLoading(account.label);
    setError(null);
    try {
      // Get a sign-in token from the server
      const res = await fetch("/api/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: account.role }),
      });
      if (!res.ok) {
        const body = await res.text();
        console.error("Demo login API error:", res.status, body);
        throw new Error("Failed to get demo token");
      }
      const { ticket } = await res.json();

      await signIn.create({
        strategy: "ticket",
        ticket,
      });

      // In Clerk v7, signIn object is mutated after create()
      if (signIn.status === "complete" && signIn.createdSessionId) {
        await setActive({ session: signIn.createdSessionId });
        window.location.href = "/dashboard";
        return;
      }
    } catch (err) {
      console.error("Demo login error:", err);
      setError("Demo account not available. Please sign in manually.");
    } finally {
      setLoading(null);
    }
  };

  if (isSignedIn) return null;

  return (
    <AuthLayout>
      {/* Demo accounts */}
      <div className="mb-8">
        <h2 className="mb-1 text-2xl font-bold text-white">Welcome back</h2>
        <p className="text-sm text-zinc-500">
          Sign in to your account, or try a demo below.
        </p>
      </div>

      <div className="mb-6 space-y-3">
        <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-600">
          Explore instantly
        </p>
        {DEMO_ACCOUNTS.map((account) => (
          <button
            key={account.label}
            onClick={() => handleDemoLogin(account)}
            disabled={loading !== null}
            className={`group relative flex w-full cursor-pointer items-center gap-4 overflow-hidden rounded-xl border bg-linear-to-r p-4 transition-all disabled:opacity-50 ${account.border} ${account.gradient}`}
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${account.iconBg}`}
            >
              <span className={`text-sm font-bold ${account.iconText}`}>
                {account.label[0]}
              </span>
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">
                  {account.label} Demo
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                  {account.tag}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-zinc-500">
                {account.description}
              </p>
            </div>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-zinc-500 transition-all group-hover:bg-white/10 group-hover:text-white">
              {loading === account.label ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
            </div>
          </button>
        ))}
        {error && <p className="text-center text-xs text-red-400">{error}</p>}
      </div>

      {/* Divider */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/5" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-zinc-950 px-4 text-[11px] font-medium uppercase tracking-widest text-zinc-600">
            or use your account
          </span>
        </div>
      </div>

      {/* Clerk form */}
      <SignIn
        forceRedirectUrl="/dashboard"
        appearance={{
          elements: {
            rootBox: "w-full",
            cardBox: "w-full",
            card: "shadow-none bg-transparent border-0 p-0",
            headerTitle: "text-white",
            headerSubtitle: "text-zinc-400",
            formButtonPrimary:
              "bg-white text-zinc-900 hover:bg-zinc-200 font-semibold rounded-lg",
            formFieldInput:
              "bg-white/5 border-white/10 text-white placeholder:text-zinc-600 rounded-lg",
            formFieldLabel: "text-zinc-400",
            footerAction: "text-zinc-500",
            footerActionLink: "text-emerald-400 hover:text-emerald-300",
          },
        }}
      />
    </AuthLayout>
  );
}
