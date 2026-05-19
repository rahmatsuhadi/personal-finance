import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

// ─── Brutal Badge Atom ────────────────────────────────────────────────────────

interface BrutalBadgeProps {
  children: ReactNode;
  variant?: "default" | "income" | "expense" | "transfer" | "currency";
  className?: string;
}

export function BrutalBadge({
  children,
  variant = "default",
  className,
}: BrutalBadgeProps) {
  const variants = {
    default: "bg-brutal-black text-white",
    income: "bg-brutal-emerald text-brutal-black",
    expense: "bg-brutal-rose text-white",
    transfer: "bg-brutal-cyan text-brutal-black",
    currency: "bg-brutal-yellow text-brutal-black",
  };

  return (
    <span
      className={cn(
        "inline-block border-2 border-brutal-black px-2 py-0.5",
        "text-xs font-bold uppercase tracking-wider",
        "shadow-brutal-sm",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
