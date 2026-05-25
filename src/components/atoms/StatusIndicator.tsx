import { cn } from "@/lib/utils";

export interface StatusIndicatorProps {
  status: "success" | "warning" | "error" | "info" | "offline" | "idle" | "syncing";
  pulse?: boolean;
  label?: string;
  className?: string;
}

export function StatusIndicator({
  status,
  pulse = false,
  label,
  className,
}: StatusIndicatorProps) {
  const dotColors = {
    success: "bg-brutal-emerald border-brutal-black",
    warning: "bg-brutal-yellow border-brutal-black",
    error: "bg-brutal-rose border-brutal-black",
    info: "bg-brutal-cyan border-brutal-black",
    offline: "bg-brutal-black/30 border-brutal-black/40",
    idle: "bg-brutal-lime/60 border-brutal-black/40",
    syncing: "bg-brutal-yellow border-brutal-black",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "h-2 w-2 border rounded-full shrink-0",
          dotColors[status],
          pulse || status === "syncing" ? "animate-pulse" : ""
        )}
      />
      {label && (
        <span className="text-[10px] font-bold uppercase tracking-wider">
          {label}
        </span>
      )}
    </div>
  );
}
