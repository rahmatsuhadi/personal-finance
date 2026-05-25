import { useState, useEffect } from "react";
import { liveQuery } from "dexie";
import { db, type Transaction } from "@/db/db";
import { format, startOfMonth, startOfYear, endOfMonth, endOfYear } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { type PieSlice } from "@/components/organisms";

const CHART_COLORS = [
  "#c8f135", // lime
  "#00d4ff", // cyan
  "#ffd60a", // yellow
  "#ff4db8", // pink
  "#a855f7", // purple
  "#00c47a", // emerald
  "#ff4d4d", // rose
  "#ff8c00", // orange
  "#3b82f6", // blue
];

export type Period = "month" | "year";

export function useStatisticsData(period: Period) {
  const now = new Date();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Date range based on period
  const fromDate =
    period === "month"
      ? format(startOfMonth(now), "yyyy-MM-dd")
      : format(startOfYear(now), "yyyy-MM-dd");
  const toDate =
    period === "month"
      ? format(endOfMonth(now), "yyyy-MM-dd")
      : format(endOfYear(now), "yyyy-MM-dd");

  const periodLabel =
    period === "month"
      ? format(now, "MMMM yyyy", { locale: idLocale })
      : format(now, "yyyy");

  useEffect(() => {
    const sub = liveQuery(() =>
      db.transactions
        .where("date")
        .between(fromDate, toDate, true, true)
        .toArray()
    ).subscribe({
      next: (data) => {
        setTransactions(data);
      },
      error: () => {},
    });
    return () => sub.unsubscribe();
  }, [fromDate, toDate]);

  // ── Aggregate ───────────────────────────────────────────────────────────────
  const incomeTotal = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expenseTotal = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const netBalance = incomeTotal - expenseTotal;

  // Expense by category
  const categoryMap = new Map<string, number>();
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      categoryMap.set(t.category, (categoryMap.get(t.category) ?? 0) + t.amount);
    });

  const slices: PieSlice[] = Array.from(categoryMap.entries())
    .sort(([, a], [, b]) => b - a)
    .map(([label, value], i) => ({
      label,
      value,
      color: CHART_COLORS[i % CHART_COLORS.length],
      percentage: expenseTotal > 0 ? (value / expenseTotal) * 100 : 0,
    }));

  return {
    transactions,
    fromDate,
    toDate,
    periodLabel,
    incomeTotal,
    expenseTotal,
    netBalance,
    slices,
  };
}
