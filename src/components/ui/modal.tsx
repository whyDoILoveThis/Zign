"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Modal({
  open,
  onClose,
  children,
  title,
  description,
  size = "md",
}: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        className={cn(
          "relative z-10 mx-4 w-full rounded-2xl border border-zinc-200 bg-white shadow-2xl",
          "dark:border-zinc-700 dark:bg-zinc-900",
          "animate-in fade-in zoom-in-95 duration-200",
          "max-h-[90vh] overflow-y-auto",
          {
            sm: "max-w-sm",
            md: "max-w-lg",
            lg: "max-w-2xl",
            xl: "max-w-4xl",
          }[size],
        )}
      >
        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between border-b border-zinc-200 p-6 dark:border-zinc-800">
            <div>
              {title && (
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        {/* Body */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
