import { useState, useEffect } from "react";
import { liveQuery } from "dexie";
import { db, type Transaction } from "@/db/db";
import { useStack } from "@/navigation/StackNavigator";
import { TransactionDetailScreen } from "@/pages/main/TransactionDetailScreen";
import { cn } from "@/lib/utils";
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
import { ChevronLeft, ChevronRight, X } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatIDR(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

function toDateStr(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

// ─── Calendar Grid Builder ────────────────────────────────────────────────────

function buildCalendarDays(month: Date): Date[] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

const DAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

// ─── Transaction Drawer ───────────────────────────────────────────────────────

interface DayDrawerProps {
  selectedDate: Date;
  transactions: Transaction[];
  onClose: () => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  onTxClick: (tx: Transaction) => void;
}

const TYPE_ICON: Record<Transaction["type"], string> = {
  income: "↓",
  expense: "↑",
  transfer: "⇄",
};

const TYPE_COLOR: Record<Transaction["type"], string> = {
  income: "text-brutal-emerald",
  expense: "text-brutal-rose",
  transfer: "text-brutal-black",
};

function DayDrawer({
  selectedDate,
  transactions,
  onClose,
  onPrevDay,
  onNextDay,
  onTxClick,
}: DayDrawerProps) {
  const dateLabel = format(selectedDate, "EEEE, d MMMM yyyy", {
    locale: idLocale,
  });

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-brutal-black/50"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 max-h-[70vh] flex flex-col",
          "border-t-4 border-brutal-black bg-brutal-bg",
          "pb-[calc(var(--safe-bottom)+72px)]",
          "animate-in slide-in-from-bottom duration-200"
        )}
      >
        {/* Drawer Header */}
        <div className="flex items-center border-b-2 border-brutal-black px-4 py-3 flex-shrink-0">
          {/* Prev Day */}
          <button
            onClick={onPrevDay}
            className="flex h-8 w-8 items-center justify-center border-2 border-brutal-black bg-brutal-white shadow-brutal-sm brutal-press mr-2"
          >
            <ChevronLeft size={14} strokeWidth={2.5} />
          </button>

          {/* Date */}
          <p className="flex-1 text-center text-xs font-black uppercase tracking-wider">
            {dateLabel}
          </p>

          {/* Next Day */}
          <button
            onClick={onNextDay}
            className="flex h-8 w-8 items-center justify-center border-2 border-brutal-black bg-brutal-white shadow-brutal-sm brutal-press ml-2"
          >
            <ChevronRight size={14} strokeWidth={2.5} />
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center border-2 border-brutal-black bg-brutal-white shadow-brutal-sm brutal-press ml-2"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>

        {/* Summary mini strip */}
        {transactions.length > 0 && (
          <div className="flex border-b-2 border-brutal-black divide-x-2 divide-brutal-black flex-shrink-0">
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
              <p className="text-3xl">📭</p>
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
                    {/* Type Icon */}
                    <span
                      className={cn(
                        "flex h-8 w-8 flex-shrink-0 items-center justify-center text-sm font-black border-2 border-brutal-black",
                        tx.type === "income" && "bg-brutal-emerald",
                        tx.type === "expense" && "bg-brutal-rose",
                        tx.type === "transfer" && "bg-brutal-cyan"
                      )}
                    >
                      {TYPE_ICON[tx.type]}
                    </span>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{tx.description}</p>
                      <p className="text-[10px] text-brutal-black/50">{tx.category}</p>
                    </div>

                    {/* Amount */}
                    <p className={cn("text-sm font-black flex-shrink-0", TYPE_COLOR[tx.type])}>
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
  const { push } = useStack();
  const today = new Date();

  const [currentMonth, setCurrentMonth] = useState<Date>(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);

  // Load all transactions for the current month
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
      error: () => {},
    });
    return () => sub.unsubscribe();
  }, [currentMonth]);

  // Build set of dates that have transactions
  const txDateSet = new Set(allTransactions.map((t) => t.date));

  // Transactions for selected date
  const selectedDayTx = selectedDate
    ? allTransactions.filter((t) => t.date === toDateStr(selectedDate))
    : [];

  const days = buildCalendarDays(currentMonth);

  function handleDayClick(day: Date) {
    setSelectedDate(day);
  }

  function handlePrevDay() {
    if (!selectedDate) return;
    const prev = subDays(selectedDate, 1);
    setSelectedDate(prev);
    // If crosses month boundary, update month view
    if (!isSameMonth(prev, currentMonth)) {
      setCurrentMonth(new Date(prev.getFullYear(), prev.getMonth(), 1));
    }
  }

  function handleNextDay() {
    if (!selectedDate) return;
    const next = addDays(selectedDate, 1);
    setSelectedDate(next);
    if (!isSameMonth(next, currentMonth)) {
      setCurrentMonth(new Date(next.getFullYear(), next.getMonth(), 1));
    }
  }

  function handleTxClick(tx: Transaction) {
    setSelectedDate(null);
    push(<TransactionDetailScreen transaction={tx} />);
  }

  const monthLabel = format(currentMonth, "MMMM yyyy", { locale: idLocale });

  return (
    <div
      className="flex flex-col h-full bg-brutal-bg"
      style={{ paddingTop: "var(--safe-top)" }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="border-b-4 border-brutal-black bg-brutal-cyan px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            className="flex h-9 w-9 items-center justify-center border-2 border-brutal-black bg-brutal-white shadow-brutal-sm brutal-press"
          >
            <ChevronLeft size={16} strokeWidth={2.5} />
          </button>

          <h1 className="text-base font-black uppercase tracking-wider">
            {monthLabel}
          </h1>

          <button
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            className="flex h-9 w-9 items-center justify-center border-2 border-brutal-black bg-brutal-white shadow-brutal-sm brutal-press"
          >
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* ── Day Labels ──────────────────────────────────────────────────────── */}
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

      {/* ── Calendar Grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-7 border-b-2 border-brutal-black flex-shrink-0">
        {days.map((day, i) => {
          const dateStr = toDateStr(day);
          const isToday = isSameDay(day, today);
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
          const inMonth = isSameMonth(day, currentMonth);
          const hasTx = txDateSet.has(dateStr);

          return (
            <button
              key={i}
              onClick={() => handleDayClick(day)}
              className={cn(
                "relative flex flex-col items-center justify-start pt-1 pb-2",
                "h-14 border-r-2 border-b-2 border-brutal-black brutal-press",
                "last:border-r-0",
                i % 7 === 6 && "border-r-0",
                // Colors
                isSelected && "bg-brutal-yellow",
                isToday && !isSelected && "bg-brutal-cyan",
                !isToday && !isSelected && inMonth && "bg-brutal-white",
                !inMonth && "bg-brutal-bg opacity-40"
              )}
            >
              <span
                className={cn(
                  "text-xs font-black leading-none",
                  isSelected && "text-brutal-black",
                  isToday && !isSelected && "text-brutal-black",
                  !isToday && !isSelected && "text-brutal-black"
                )}
              >
                {format(day, "d")}
              </span>

              {/* Transaction dot */}
              {hasTx && inMonth && (
                <span
                  className={cn(
                    "mt-1 h-1.5 w-1.5 border border-brutal-black",
                    isSelected ? "bg-brutal-black" : "bg-brutal-black"
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Legend ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-4 px-4 py-2 border-b-2 border-brutal-black bg-brutal-bg">
        <div className="flex items-center gap-1.5">
          <div className="h-4 w-4 border-2 border-brutal-black bg-brutal-cyan" />
          <span className="text-[10px] font-bold uppercase">Hari Ini</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-4 w-4 border-2 border-brutal-black bg-brutal-yellow" />
          <span className="text-[10px] font-bold uppercase">Dipilih</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 border border-brutal-black bg-brutal-black" />
          <span className="text-[10px] font-bold uppercase">Ada Transaksi</span>
        </div>
      </div>

      {/* ── Empty state ──────────────────────────────────────────────────────── */}
      {!selectedDate && (
        <div className="flex flex-col items-center justify-center flex-1 gap-2 p-6">
          <p className="text-3xl">📅</p>
          <p className="text-xs font-bold uppercase text-brutal-black/40 text-center">
            Ketuk tanggal untuk melihat transaksi
          </p>
        </div>
      )}

      {/* ── Day Drawer ───────────────────────────────────────────────────────── */}
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
