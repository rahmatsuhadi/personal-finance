import { cn } from "@/lib/utils";

export interface SummaryCardProps {
  label: string;
  value: string;
  bgColor: string;
  className?: string;
}

export function SummaryCard({
  label,
  value,
  bgColor,
  className,
}: SummaryCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col border-2 border-brutal-black p-3 shadow-brutal-sm",
        bgColor,
        className
      )}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">
        {label}
      </p>
      <p className="text-sm font-black leading-tight mt-0.5">{value}</p>
    </div>
  );
}
