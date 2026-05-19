import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

// ─── Brutal Button Atom ───────────────────────────────────────────────────────

interface BrutalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "accent" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export const BrutalButton = forwardRef<HTMLButtonElement, BrutalButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClass =
      "inline-flex items-center justify-center font-bold border-2 border-brutal-black transition-all duration-75 select-none brutal-press disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
      primary:
        "bg-brutal-black text-white shadow-brutal-md hover:shadow-brutal-sm",
      accent:
        "bg-brutal-lime text-brutal-black shadow-brutal-md hover:shadow-brutal-sm",
      ghost:
        "bg-transparent text-brutal-black shadow-brutal-md hover:shadow-brutal-sm",
      danger:
        "bg-brutal-rose text-white shadow-brutal-md hover:shadow-brutal-sm",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-5 py-3 text-sm",
      lg: "px-6 py-4 text-base",
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          baseClass,
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

BrutalButton.displayName = "BrutalButton";
