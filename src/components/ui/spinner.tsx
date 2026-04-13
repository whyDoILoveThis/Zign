import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <Loader2
      className={cn(
        "animate-spin text-zinc-400",
        {
          sm: "h-4 w-4",
          md: "h-6 w-6",
          lg: "h-8 w-8",
        }[size],
        className,
      )}
    />
  );
}

interface PageLoaderProps {
  message?: string;
}

export function PageLoader({ message }: PageLoaderProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
      <Spinner size="lg" />
      {message && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{message}</p>
      )}
    </div>
  );
}
