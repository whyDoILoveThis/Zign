import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "flex h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm",
            "transition-colors duration-150",
            "placeholder:text-zinc-400",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "dark:bg-zinc-900 dark:placeholder:text-zinc-500",
            error
              ? "border-red-500 focus-visible:ring-red-500"
              : "border-zinc-300 focus-visible:ring-zinc-900 dark:border-zinc-700 dark:focus-visible:ring-zinc-400",
            className,
          )}
          {...props}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {hint && !error && <p className="text-sm text-zinc-500">{hint}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input };
