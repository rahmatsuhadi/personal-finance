import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";

// ─── CalendarScreen ───────────────────────────────────────────────────────────
// Placeholder — akan dikembangkan di iterasi berikutnya

export function CalendarScreen() {
  return (
    <div
      className={cn(
        "flex h-full flex-col bg-brutal-bg",
        "pt-[var(--safe-top)]"
      )}
    >
      {/* Header */}
      <div className="border-b-4 border-brutal-black bg-brutal-cyan px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border-2 border-brutal-black bg-brutal-black">
            <Calendar size={20} strokeWidth={2.5} className="text-brutal-cyan" />
          </div>
          <h1 className="text-xl font-black uppercase tracking-tight">Kalender</h1>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <div className="border-4 border-brutal-black bg-brutal-cyan p-8 shadow-brutal-xl text-center">
          <Calendar size={48} strokeWidth={2} className="mx-auto mb-3" />
          <p className="text-lg font-black uppercase tracking-wider">
            Kalender
          </p>
          <p className="text-sm font-medium opacity-70 mt-1">
            Segera hadir!
          </p>
        </div>
      </div>
    </div>
  );
}
