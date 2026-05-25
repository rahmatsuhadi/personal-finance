import { db, type Budget } from "@/db/db";

export const budgetRepository = {
  /**
   * Get all budgets
   */
  async getAllBudgets(): Promise<Budget[]> {
    return db.budgets.toArray();
  },

  async getBudgetById(id: string): Promise<Budget | undefined> {
    return db.budgets.get(id);
  },

  async getBudgetByName(name: string): Promise<Budget | undefined> {
    return db.budgets.filter(b => b.name === name).first();
  },

  /**
   * Add a new budget with UUID
   */
  async addBudget(budget: Omit<Budget, "id" | "updatedAt">) {
    const existing = await this.getBudgetByName(budget.name);
    if (existing) {
      throw new Error("Anggaran dengan nama ini sudah ada.");
    }
    const newBudget: Budget = {
      ...budget,
      id: crypto.randomUUID(),
      updatedAt: Date.now(),
    };
    await db.budgets.add(newBudget);
    return newBudget.id;
  },

  /**
   * Update a budget
   */
  async updateBudget(id: string, data: Partial<Omit<Budget, "id">>): Promise<number> {
    return db.budgets.update(id, {
      ...data,
      updatedAt: Date.now(),
    });
  },

  /**
   * Hard-delete a budget
   */
  async deleteBudget(id: string): Promise<void> {
    await db.budgets.delete(id);
  },
};
