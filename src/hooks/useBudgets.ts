import { useState, useEffect } from "react";
import { liveQuery } from "dexie";
import { db, type Budget } from "@/db/db";
import { budgetRepository } from "@/repositories/budgetRepository";

export function useBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);

  useEffect(() => {
    const sub = liveQuery(() => db.budgets.toArray()).subscribe({
      next: (data) => setBudgets(data),
      error: () => { },
    });
    return () => sub.unsubscribe();
  }, []);

  return {
    budgets,
    addBudget: budgetRepository.addBudget.bind(budgetRepository),
    updateBudget: budgetRepository.updateBudget.bind(budgetRepository),
    removeBudget: budgetRepository.deleteBudget.bind(budgetRepository),
  };
}
