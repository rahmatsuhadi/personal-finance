import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface FeaturePillProps {
  icon: LucideIcon;
  label: string;
  color: string;
  className?: string;
}

export function FeaturePill({
  icon: Icon,
  label,
  color,
  className,
}: FeaturePillProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 border-2 border-brutal-black px-3 py-2",
        "shadow-brutal-sm",
        color,
        className
      )}
    >
      <Icon size={14} strokeWidth={2.5} />
      <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
    </div>
  );
}
