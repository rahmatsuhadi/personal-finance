import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

// ─── Brutal Input Atom ────────────────────────────────────────────────────────

interface BrutalInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const BrutalInput = forwardRef<HTMLInputElement, BrutalInputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={id}
            className="text-xs font-bold uppercase tracking-wider text-brutal-black"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "w-full border-2 border-brutal-black bg-brutal-white px-4 py-3",
            "text-brutal-black font-medium placeholder:text-brutal-black/40",
            "shadow-brutal-md outline-none",
            "focus:shadow-brutal-sm focus:translate-x-[2px] focus:translate-y-[2px] transition-all duration-75",
            error && "border-brutal-rose",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs font-bold text-brutal-rose">{error}</p>
        )}
      </div>
    );
  }
);

BrutalInput.displayName = "BrutalInput";
