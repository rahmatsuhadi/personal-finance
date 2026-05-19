import { type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── AppHeader Atom ───────────────────────────────────────────────────────────
// Used on ALL stack/child screens (not tab screens). Must be placed at top of JSX.
// Has safe-top padding built-in — no need to add it on the parent.

interface AppHeaderProps {
  title: string;
  onBack?: () => void;
  action?: ReactNode;
  /** Override background color class, default is bg-brutal-black */
  bgColor?: string;
  className?: string;
}

export function AppHeader({
  title,
  onBack,
  action,
  bgColor = "bg-brutal-black",
  className,
}: AppHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 border-b-4 border-brutal-black px-4",
        bgColor,
        "pt-[calc(var(--safe-top)+12px)] pb-3",
        className
      )}
    >
      {/* Back Button */}
      {onBack && (
        <button
          onClick={onBack}
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center",
            "border-2 border-brutal-lime bg-transparent",
            "shadow-brutal-sm brutal-press"
          )}
          aria-label="Kembali"
        >
          <ArrowLeft size={18} strokeWidth={2.5} className="text-brutal-lime" />
        </button>
      )}

      {/* Title */}
      <h1 className="flex-1 text-base font-black uppercase tracking-wider truncate text-white">
        {title}
      </h1>

      {/* Optional right action */}
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
