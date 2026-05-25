import { useNavigate } from "react-router-dom";
import { 
  ChevronLeft, 
  ChevronRight, 
  CalendarDays 
} from "lucide-react";
import { format, isSameDay, isSameMonth } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { SmallIconButton } from "@/components/atoms";
import { CalendarDayDrawer } from "@/components/organisms";
import { useCalendarData } from "@/hooks/useCalendarData";
import { type Transaction } from "@/db/db";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shortAmount(n: number): string {
  if (n === 0) return "";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}Jt`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

function toDateStr(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

const DAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

// ─── CalendarScreen ───────────────────────────────────────────────────────────

export function CalendarScreen() {
  const navigate = useNavigate();
  const calendar = useCalendarData();

  const selectedDayTx = calendar.selectedDate
    ? calendar.allTransactions.filter((t) => t.date === toDateStr(calendar.selectedDate!))
    : [];

  const handleTxClick = (tx: Transaction) => {
    calendar.setSelectedDate(null);
    navigate(`/transaction/${tx.id}`);
  };

  const monthLabel = format(calendar.currentMonth, "MMMM yyyy", { locale: idLocale });

  return (
    <div
      className="flex flex-col h-full bg-brutal-bg"
      style={{ paddingTop: "var(--safe-top)" }}
    >
      {/* Header */}
      <div className="border-b-4 border-brutal-black bg-brutal-cyan px-4 py-3">
        <div className="flex items-center justify-between">
          <SmallIconButton
            onClick={calendar.handlePrevMonth}
            icon={ChevronLeft}
            variant="white"
            size="md"
          />
          <h1 className="text-base font-black uppercase tracking-wider">{monthLabel}</h1>
          <SmallIconButton
            onClick={calendar.handleNextMonth}
            icon={ChevronRight}
            variant="white"
            size="md"
          />
        </div>
      </div>

      {/* Day Labels */}
      <div className="grid grid-cols-7 border-b-2 border-brutal-black bg-brutal-black">
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            className="flex items-center justify-center py-1.5 border-r-2 border-brutal-black/30 last:border-r-0"
          >
            <span className="text-[10px] font-black uppercase tracking-wider text-brutal-lime">
              {d}
            </span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 border-b-2 border-brutal-black shrink-0">
        {calendar.days.map((day, i) => {
          const dateStr = toDateStr(day);
          const isToday = isSameDay(day, calendar.today);
          const isSelected = calendar.selectedDate ? isSameDay(day, calendar.selectedDate) : false;
          const inMonth = isSameMonth(day, calendar.currentMonth);
          const summary = calendar.summaryMap.get(dateStr);
          const hasTx = Boolean(summary);

          return (
            <button
              key={i}
              onClick={() => inMonth && calendar.setSelectedDate(day)}
              className={cn(
                "relative flex flex-col items-center pt-1.5 pb-1",
                "h-18 border-r-2 border-b-2 border-brutal-black",
                i % 7 === 6 && "border-r-0",
                isSelected && "bg-brutal-yellow",
                isToday && !isSelected && "bg-brutal-cyan",
                !isToday && !isSelected && inMonth && "bg-brutal-white",
                !inMonth && "bg-brutal-bg opacity-40 cursor-default"
              )}
            >
              <span className="text-[11px] font-black leading-none mb-1">
                {format(day, "d")}
              </span>

              {hasTx && inMonth && summary && (
                <div className="flex flex-col items-center w-full px-0.5 gap-0.5">
                  {summary.income > 0 && (
                    <span className="w-full text-center text-[8px] font-black leading-none px-0.5 py-0.5 bg-blue-500 text-white border border-blue-700">
                      {shortAmount(summary.income)}
                    </span>
                  )}
                  {summary.expense > 0 && (
                    <span className="w-full text-center text-[8px] font-black leading-none px-0.5 py-0.5 bg-brutal-rose text-white border border-red-700">
                      {shortAmount(summary.expense)}
                    </span>
                  )}
                  <span className={cn(
                    "text-[7px] font-black leading-none",
                    (isSelected || isToday) ? "text-brutal-black" : "text-brutal-black/50"
                  )}>
                    {summary.count} tx
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 px-4 py-2 border-b-2 border-brutal-black bg-brutal-bg shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 border border-blue-700 bg-blue-500" />
          <span className="text-[10px] font-bold uppercase">Pemasukan</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 border border-red-700 bg-brutal-rose" />
          <span className="text-[10px] font-bold uppercase">Pengeluaran</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 border-2 border-brutal-black bg-brutal-cyan" />
          <span className="text-[10px] font-bold uppercase">Hari Ini</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 border-2 border-brutal-black bg-brutal-yellow" />
          <span className="text-[10px] font-bold uppercase">Dipilih</span>
        </div>
      </div>

      {/* Empty state */}
      {!calendar.selectedDate && (
        <div className="flex flex-col items-center justify-center flex-1 gap-2 p-6">
          <CalendarDays size={48} strokeWidth={2.5} className="text-brutal-black/40 mb-2" />
          <p className="text-xs font-bold uppercase text-brutal-black/40 text-center">
            Ketuk tanggal untuk melihat transaksi
          </p>
        </div>
      )}

      {/* Day Drawer */}
      {calendar.selectedDate && (
        <CalendarDayDrawer
          selectedDate={calendar.selectedDate}
          transactions={selectedDayTx}
          onClose={() => calendar.setSelectedDate(null)}
          onPrevDay={calendar.handlePrevDay}
          onNextDay={calendar.handleNextDay}
          onTxClick={handleTxClick}
        />
      )}
    </div>
  );
}
