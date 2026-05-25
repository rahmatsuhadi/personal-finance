import { useState, useEffect } from "react";
import { liveQuery } from "dexie";
import { db, type Budget, type Category } from "@/db/db";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  differenceInCalendarDays,
} from "date-fns";

export interface BudgetProgress {
  budget: Budget;
  categories: Category[];
  spent: number;
  percentage: number;
  remaining: number;
  remainingDays: number;
  safeDailyLimit: number;
  status: "safe" | "warning" | "critical";
}

export function useBudgetProgress() {
  const [progresses, setProgresses] = useState<BudgetProgress[]>([]);

  useEffect(() => {
    const sub = liveQuery(async () => {
      const budgets = await db.budgets.toArray();
      const results: BudgetProgress[] = [];

      for (const budget of budgets) {
        const catIds = budget.categoryIds || [];
        if (catIds.length === 0) continue;

        const categories = await db.categories.where("id").anyOf(catIds).toArray();
        if (categories.length === 0) continue; 

        const now = new Date();
        let startDate: Date;
        let endDate: Date;

        switch (budget.cycle) {
          case "weekly":
            startDate = startOfWeek(now, { weekStartsOn: 1 });
            endDate = endOfWeek(now, { weekStartsOn: 1 });
            break;
          case "monthly":
            startDate = startOfMonth(now);
            endDate = endOfMonth(now);
            break;
          case "yearly":
            startDate = startOfYear(now);
            endDate = endOfYear(now);
            break;
          default:
            startDate = startOfMonth(now);
            endDate = endOfMonth(now);
        }

        // Transactions are stored as YYYY-MM-DD
        const startStr = startDate.toISOString().split("T")[0];
        const endStr = endDate.toISOString().split("T")[0];

        const categoryNames = categories.map(c => c.name);

        // Fetch transactions for these categories
        const txs = await db.transactions
          .where("category")
          .anyOf(categoryNames)
          .toArray();

        // Filter by date range and expense type
        const cycleTxs = txs.filter(
          (tx) => tx.date >= startStr && tx.date <= endStr && tx.type === "expense"
        );

        const spent = cycleTxs.reduce((sum, tx) => sum + tx.amount, 0);
        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 100;
        const remaining = Math.max(0, budget.amount - spent);
        const remainingDays = Math.max(1, differenceInCalendarDays(endDate, now) + 1);
        const safeDailyLimit = remaining / remainingDays;

        let status: "safe" | "warning" | "critical" = "safe";
        if (percentage >= 90) status = "critical";
        else if (percentage >= 70) status = "warning";

        results.push({
          budget,
          categories,
          spent,
          percentage,
          remaining,
          remainingDays,
          safeDailyLimit,
          status,
        });
      }

      // Sort: critical first, then warning, then highest percentage
      results.sort((a, b) => b.percentage - a.percentage);

      return results;
    }).subscribe({
      next: (data) => setProgresses(data),
      error: () => {},
    });

    return () => sub.unsubscribe();
  }, []);

  return { progresses };
}
