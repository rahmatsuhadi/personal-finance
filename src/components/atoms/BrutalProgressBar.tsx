import { cn } from "@/lib/utils";

interface BrutalProgressBarProps {
  percentage: number;
  status: "safe" | "warning" | "critical";
  className?: string;
}

export function BrutalProgressBar({ percentage, status, className }: BrutalProgressBarProps) {
  const boundedPercentage = Math.min(100, Math.max(0, percentage));
  
  let colorClass = "bg-brutal-lime";
  if (status === "warning") colorClass = "bg-brutal-yellow";
  else if (status === "critical") colorClass = "bg-brutal-rose";

  return (
    <div className={cn("w-full h-4 border-2 border-brutal-black bg-brutal-white flex", className)}>
      {boundedPercentage > 0 && (
        <div 
          className={cn("h-full", colorClass, boundedPercentage < 100 && "border-r-2 border-brutal-black")} 
          style={{ width: `${boundedPercentage}%` }}
        />
      )}
    </div>
  );
}
