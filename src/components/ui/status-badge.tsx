import { cn } from "@/lib/utils";
import type { JobStatus } from "@/types";

const statusConfig: Record<
  JobStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  scheduled: {
    label: "Scheduled",
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/50",
    dot: "bg-blue-500",
  },
  in_progress: {
    label: "In Progress",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/50",
    dot: "bg-amber-500",
  },
  completed: {
    label: "Completed",
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    dot: "bg-emerald-500",
  },
  on_hold: {
    label: "On Hold",
    color: "text-zinc-700 dark:text-zinc-400",
    bg: "bg-zinc-100 dark:bg-zinc-800",
    dot: "bg-zinc-500",
  },
  cancelled: {
    label: "Cancelled",
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/50",
    dot: "bg-red-500",
  },
};

interface BadgeProps {
  status: JobStatus;
  className?: string;
}

export function StatusBadge({ status, className }: BadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.color,
        config.bg,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}
