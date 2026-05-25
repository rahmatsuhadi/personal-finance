import { useState, useEffect } from "react";
import { liveQuery } from "dexie";
import { db, type Transaction } from "@/db/db";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
  addDays,
  subDays,
} from "date-fns";

export interface DaySummary {
  income: number;
  expense: number;
  count: number;
}

export function useCalendarData() {
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

  const days = buildCalendarDays(currentMonth);

  function buildCalendarDays(month: Date): Date[] {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }

  const handlePrevMonth = () => setCurrentMonth((m) => subMonths(m, 1));
  const handleNextMonth = () => setCurrentMonth((m) => addMonths(m, 1));

  const handlePrevDay = () => {
    if (!selectedDate) return;
    const prev = subDays(selectedDate, 1);
    setSelectedDate(prev);
    if (!isSameMonth(prev, currentMonth))
      setCurrentMonth(new Date(prev.getFullYear(), prev.getMonth(), 1));
  };

  const handleNextDay = () => {
    if (!selectedDate) return;
    const next = addDays(selectedDate, 1);
    setSelectedDate(next);
    if (!isSameMonth(next, currentMonth))
      setCurrentMonth(new Date(next.getFullYear(), next.getMonth(), 1));
  };

  return {
    today,
    currentMonth,
    setCurrentMonth,
    selectedDate,
    setSelectedDate,
    allTransactions,
    summaryMap,
    days,
    handlePrevMonth,
    handleNextMonth,
    handlePrevDay,
    handleNextDay,
  };
}
