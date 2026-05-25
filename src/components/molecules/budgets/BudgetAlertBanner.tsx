import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

export interface BudgetAlertBannerProps {
  budgetLabel: string;
  status: "critical" | "warning";
  percentage: number;
  onClick?: () => void;
  className?: string;
}

export function BudgetAlertBanner({
  budgetLabel,
  status,
  percentage,
  onClick,
  className,
}: BudgetAlertBannerProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full px-4 py-3 flex items-center justify-between brutal-press text-left",
        status === "critical" ? "bg-brutal-rose" : "bg-brutal-yellow",
        className
      )}
    >
      <div className="flex items-center gap-2 text-brutal-black">
        <AlertTriangle size={18} strokeWidth={3} />
        <span className="text-xs font-bold uppercase tracking-wider">
          Anggaran {budgetLabel} {status === "critical" ? "Kritis" : "Hampir Habis"}
        </span>
      </div>
      <span className="text-sm font-black text-brutal-black">
        {percentage.toFixed(0)}%
      </span>
    </button>
  );
}
