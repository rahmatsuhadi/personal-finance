import { useState, useEffect, useCallback } from "react";
import { liveQuery } from "dexie";
import { categoryRepository } from "@/repositories/categoryRepository";
import type { Category } from "@/db/db";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const sub = liveQuery(() => categoryRepository.getAll()).subscribe({
      next: (data) => setCategories(data),
      error: (e) => console.error("[useCategories]", e),
    });
    return () => sub.unsubscribe();
  }, []);

  const incomeCategories = categories.filter((c) => c.type === "income");
  const expenseCategories = categories.filter((c) => c.type === "expense");

  const addCategory = useCallback(async (category: Omit<Category, "id" | "serverId" | "updatedAt" | "isDirty" | "isDeleted">) => {
    await categoryRepository.add(category);
  }, []);

  const updateCategory = useCallback(
    async (id: string, changes: Partial<Category>) => {
      await categoryRepository.update(id, changes);
    },
    []
  );

  const removeCategory = useCallback(async (id: string) => {
    await categoryRepository.remove(id);
  }, []);

  return {
    categories,
    incomeCategories,
    expenseCategories,
    addCategory,
    updateCategory,
    removeCategory,
  };
}
