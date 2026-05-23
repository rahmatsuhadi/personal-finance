import { useState, useEffect } from "react";
import { liveQuery } from "dexie";
import { db, type Transaction } from "@/db/db";
import { useNavigate } from "react-router-dom";
import { cn, formatIDR } from "@/lib/utils";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addDays,
  subDays,
} from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { ChevronLeft, ChevronRight, X, ArrowDown, ArrowUp, ArrowLeftRight, Inbox, CalendarDays } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────



/** Abbreviated amount: 1.5Jt, 500K, 50K */
function shortAmount(n: number): string {
  if (n === 0) return "";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}Jt`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

function toDateStr(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

// ─── Day summary type ─────────────────────────────────────────────────────────

interface DaySummary {
  income: number;
  expense: number;
  count: number;
}

// ─── Calendar Grid Builder ────────────────────────────────────────────────────

function buildCalendarDays(month: Date): Date[] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

const DAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

// ─── Transaction Drawer ───────────────────────────────────────────────────────

const TYPE_ICON: Record<Transaction["type"], React.ReactNode> = {
  income: <ArrowDown size={18} strokeWidth={2.5} />,
  expense: <ArrowUp size={18} strokeWidth={2.5} />,
  transfer: <ArrowLeftRight size={18} strokeWidth={2.5} />,
};

const TYPE_TEXT_COLOR: Record<Transaction["type"], string> = {
  income: "text-brutal-emerald",
  expense: "text-brutal-rose",
  transfer: "text-brutal-black",
};

interface DayDrawerProps {
  selectedDate: Date;
  transactions: Transaction[];
  onClose: () => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  onTxClick: (tx: Transaction) => void;
}

function DayDrawer({
  selectedDate,
  transactions,
  onClose,
  onPrevDay,
  onNextDay,
  onTxClick,
}: DayDrawerProps) {
  const dateLabel = format(selectedDate, "EEEE, d MMMM yyyy", { locale: idLocale });

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-brutal-black/50" onClick={onClose} />
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 max-h-[70vh] flex flex-col",
          "border-t-4 border-brutal-black bg-brutal-bg",
          "pb-[calc(var(--safe-bottom)+72px)]",
          "animate-in slide-in-from-bottom duration-200"
        )}
      >
        {/* Header */}
        <div className="flex items-center border-b-2 border-brutal-black px-4 py-3 shrink-0">
          <button
            onClick={onPrevDay}
            className="flex h-8 w-8 items-center justify-center border-2 border-brutal-black bg-brutal-white shadow-brutal-sm brutal-press mr-2"
          >
            <ChevronLeft size={14} strokeWidth={2.5} />
          </button>
          <p className="flex-1 text-center text-xs font-black uppercase tracking-wider">
            {dateLabel}
          </p>
          <button
            onClick={onNextDay}
            className="flex h-8 w-8 items-center justify-center border-2 border-brutal-black bg-brutal-white shadow-brutal-sm brutal-press ml-2"
          >
            <ChevronRight size={14} strokeWidth={2.5} />
          </button>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center border-2 border-brutal-black bg-brutal-white shadow-brutal-sm brutal-press ml-2"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>

        {/* Summary strip */}
        {transactions.length > 0 && (
          <div className="flex border-b-2 border-brutal-black divide-x-2 divide-brutal-black shrink-0">
            <div className="flex-1 p-2 text-center bg-brutal-emerald">
              <p className="text-[10px] font-bold uppercase">Masuk</p>
              <p className="text-xs font-black">{formatIDR(income)}</p>
            </div>
            <div className="flex-1 p-2 text-center bg-brutal-rose">
              <p className="text-[10px] font-bold uppercase">Keluar</p>
              <p className="text-xs font-black">{formatIDR(expense)}</p>
            </div>
          </div>
        )}

        {/* Transaction List */}
        <div className="overflow-y-auto flex-1">
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Inbox size={48} strokeWidth={2.5} className="text-brutal-black/40 mb-2" />
              <p className="text-xs font-bold uppercase text-brutal-black/40">
                Tidak ada transaksi hari ini
              </p>
            </div>
          ) : (
            <ul className="divide-y-2 divide-brutal-black">
              {transactions.map((tx) => (
                <li key={tx.id}>
                  <button
                    onClick={() => onTxClick(tx)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left bg-brutal-white brutal-press"
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center text-sm font-black border-2 border-brutal-black",
                        tx.type === "income" && "bg-brutal-emerald",
                        tx.type === "expense" && "bg-brutal-rose",
                        tx.type === "transfer" && "bg-brutal-cyan"
                      )}
                    >
                      {TYPE_ICON[tx.type]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{tx.description}</p>
                      <p className="text-[10px] text-brutal-black/50">{tx.category}</p>
                    </div>
                    <p className={cn("text-sm font-black shrink-0", TYPE_TEXT_COLOR[tx.type])}>
                      {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : ""}
                      {formatIDR(tx.amount)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

// ─── CalendarScreen ───────────────────────────────────────────────────────────

export function CalendarScreen() {
  const navigate = useNavigate();
  const today = new Date();

  const [currentMonth, setCurrentMonth] = useState<Date>(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const fromStr = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const toStr = format(endOfMonth(currentMonth), "yyyy-MM-dd");

    const sub = liveQuery(() =>
      db.transactions
        .where("date")
        .between(fromStr, toStr, true, true)
        .toArray()
    ).subscribe({
      next: (data) => setAllTransactions(data),
      error: () => { },
    });
    return () => sub.unsubscribe();
  }, [currentMonth]);

  // Build summary map per date: dateStr → {income, expense, count}
  const summaryMap = new Map<string, DaySummary>();
  for (const tx of allTransactions) {
    const existing = summaryMap.get(tx.date) ?? { income: 0, expense: 0, count: 0 };
    summaryMap.set(tx.date, {
      income: existing.income + (tx.type === "income" ? tx.amount : 0),
      expense: existing.expense + (tx.type === "expense" ? tx.amount : 0),
      count: existing.count + 1,
    });
  }

  const selectedDayTx = selectedDate
    ? allTransactions.filter((t) => t.date === toDateStr(selectedDate))
    : [];

  const days = buildCalendarDays(currentMonth);

  function handlePrevDay() {
    if (!selectedDate) return;
    const prev = subDays(selectedDate, 1);
    setSelectedDate(prev);
    if (!isSameMonth(prev, currentMonth))
      setCurrentMonth(new Date(prev.getFullYear(), prev.getMonth(), 1));
  }

  function handleNextDay() {
    if (!selectedDate) return;
    const next = addDays(selectedDate, 1);
    setSelectedDate(next);
    if (!isSameMonth(next, currentMonth))
      setCurrentMonth(new Date(next.getFullYear(), next.getMonth(), 1));
  }

  function handleTxClick(tx: Transaction) {
    setSelectedDate(null);
    navigate(`/transaction/${tx.id}`);
  }

  const monthLabel = format(currentMonth, "MMMM yyyy", { locale: idLocale });

  return (
    <div
      className="flex flex-col h-full bg-brutal-bg"
      style={{ paddingTop: "var(--safe-top)" }}
    >
      {/* Header */}
      <div className="border-b-4 border-brutal-black bg-brutal-cyan px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            className="flex h-9 w-9 items-center justify-center border-2 border-brutal-black bg-brutal-white shadow-brutal-sm brutal-press"
          >
            <ChevronLeft size={16} strokeWidth={2.5} />
          </button>
          <h1 className="text-base font-black uppercase tracking-wider">{monthLabel}</h1>
          <button
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            className="flex h-9 w-9 items-center justify-center border-2 border-brutal-black bg-brutal-white shadow-brutal-sm brutal-press"
          >
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
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
        {days.map((day, i) => {
          const dateStr = toDateStr(day);
          const isToday = isSameDay(day, today);
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
          const inMonth = isSameMonth(day, currentMonth);
          const summary = summaryMap.get(dateStr);
          const hasTx = Boolean(summary);

          return (
            <button
              key={i}
              onClick={() => inMonth && setSelectedDate(day)}
              className={cn(
                "relative flex flex-col items-center pt-1.5 pb-1",
                "h-18 border-r-2 border-b-2 border-brutal-black",
                i % 7 === 6 && "border-r-0",
                // Background colors
                isSelected && "bg-brutal-yellow",
                isToday && !isSelected && "bg-brutal-cyan",
                !isToday && !isSelected && inMonth && "bg-brutal-white",
                !inMonth && "bg-brutal-bg opacity-40 cursor-default"
              )}
            >
              {/* Date number */}
              <span className="text-[11px] font-black leading-none mb-1">
                {format(day, "d")}
              </span>

              {/* Summary info — only show for current month dates with transactions */}
              {hasTx && inMonth && summary && (
                <div className="flex flex-col items-center w-full px-0.5 gap-0.5">
                  {/* Income — biru/emerald */}
                  {summary.income > 0 && (
                    <span
                      className={cn(
                        "w-full text-center text-[8px] font-black leading-none px-0.5 py-0.5",
                        "bg-blue-500 text-white border border-blue-700"
                      )}
                    >
                      {shortAmount(summary.income)}
                    </span>
                  )}
                  {/* Expense — merah */}
                  {summary.expense > 0 && (
                    <span
                      className={cn(
                        "w-full text-center text-[8px] font-black leading-none px-0.5 py-0.5",
                        "bg-brutal-rose text-white border border-red-700"
                      )}
                    >
                      {shortAmount(summary.expense)}
                    </span>
                  )}
                  {/* Total count badge */}
                  <span
                    className={cn(
                      "text-[7px] font-black leading-none",
                      isSelected
                        ? "text-brutal-black"
                        : isToday
                          ? "text-brutal-black"
                          : "text-brutal-black/50"
                    )}
                  >
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
      {!selectedDate && (
        <div className="flex flex-col items-center justify-center flex-1 gap-2 p-6">
          <CalendarDays size={48} strokeWidth={2.5} className="text-brutal-black/40 mb-2" />
          <p className="text-xs font-bold uppercase text-brutal-black/40 text-center">
            Ketuk tanggal untuk melihat transaksi
          </p>
        </div>
      )}

      {/* Day Drawer */}
      {selectedDate && (
        <DayDrawer
          selectedDate={selectedDate}
          transactions={selectedDayTx}
          onClose={() => setSelectedDate(null)}
          onPrevDay={handlePrevDay}
          onNextDay={handleNextDay}
          onTxClick={handleTxClick}
        />
      )}
    </div>
  );
}
