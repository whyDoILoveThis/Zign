import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center",
        className,
      )}
    >
      <div className="rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-800">
        <Icon className="h-8 w-8 text-zinc-400 dark:text-zinc-500" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
        {title}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
