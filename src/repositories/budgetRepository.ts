import { db, type Budget } from "@/db/db";

export const budgetRepository = {
  async getAllBudgets(): Promise<Budget[]> {
    return await db.budgets.toArray();
  },

  async getBudgetById(id: number): Promise<Budget | undefined> {
    return await db.budgets.get(id);
  },

  async getBudgetByName(name: string): Promise<Budget | undefined> {
    return await db.budgets.where("name").equals(name).first();
  },

  async addBudget(budget: Omit<Budget, "id">) {
    const existing = await this.getBudgetByName(budget.name);
    if (existing && existing.id) {
      throw new Error("Anggaran dengan nama ini sudah ada.");
    }
    return await db.budgets.add(budget);
  },

  async updateBudget(id: number, data: Partial<Budget>): Promise<number> {
    return await db.budgets.update(id, data);
  },

  async deleteBudget(id: number): Promise<void> {
    return await db.budgets.delete(id);
  },
};
