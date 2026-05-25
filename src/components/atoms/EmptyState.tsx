import { type LucideIcon, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  bgColor?: string;
  className?: string;
  onClick?: () => void;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  bgColor = "bg-brutal-yellow",
  className,
  onClick,
}: EmptyStateProps) {
  const Component = onClick ? "button" : "div";
  return (
    <Component
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 w-full text-center",
        onClick && "brutal-press cursor-pointer hover:bg-brutal-bg/30 transition-colors border-2 border-dashed border-brutal-black bg-brutal-white shadow-brutal-sm",
        className
      )}
    >
      <div className={cn("border-4 border-brutal-black p-6 shadow-brutal-lg mb-4", bgColor)}>
        <Icon size={48} strokeWidth={2.5} className="mx-auto text-brutal-black/80" />
      </div>
      <p className="text-sm font-black uppercase tracking-wider">
        {title}
      </p>
      {description && (
        <p className="text-xs text-brutal-black/50 mt-1 font-medium max-w-xs mx-auto">
          {description}
        </p>
      )}
    </Component>
  );
}
