"use client";

import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";

export default function SignUpPage() {
  return (
    <AuthLayout>
      <div className="mb-8">
        <h2 className="mb-1 text-2xl font-bold text-white">
          Create your account
        </h2>
        <p className="text-sm text-zinc-500">
          Get started with Zign in under a minute.
        </p>
      </div>

      {/* Demo nudge */}
      <div className="mb-6 rounded-xl border border-white/5 bg-white/2 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-300">
              Just exploring?
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              Try a pre-loaded demo account instead.
            </p>
          </div>
          <Link
            href="/sign-in"
            className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-xs font-medium text-zinc-300 transition-all hover:bg-white/10 hover:text-white"
          >
            Demo
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <SignUp
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
