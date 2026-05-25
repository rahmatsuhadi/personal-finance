import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface MetricCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  bgColor: string;
  className?: string;
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  bgColor,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col border-2 border-brutal-black p-3 shadow-brutal-sm",
        bgColor,
        className
      )}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={12} strokeWidth={2.5} />
        <span className="text-[10px] font-bold uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-sm font-black leading-tight">{value}</p>
    </div>
  );
}
