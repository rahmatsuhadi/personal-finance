import { db, type Budget } from "@/db/db";

export const budgetRepository = {
  /**
   * Get all active (non-deleted) budgets
   */
  async getAllBudgets(): Promise<Budget[]> {
    return db.budgets.filter(b => !b.isDeleted).toArray();
  },

  async getBudgetById(id: string): Promise<Budget | undefined> {
    return db.budgets.get(id);
  },

  async getBudgetByName(name: string): Promise<Budget | undefined> {
    return db.budgets.filter(b => !b.isDeleted && b.name === name).first();
  },

  /**
   * Add a new budget with UUID and dirty flag
   */
  async addBudget(budget: Omit<Budget, "id" | "serverId" | "updatedAt" | "isDirty" | "isDeleted">) {
    const existing = await this.getBudgetByName(budget.name);
    if (existing) {
      throw new Error("Anggaran dengan nama ini sudah ada.");
    }
    const newBudget: Budget = {
      ...budget,
      id: crypto.randomUUID(),
      updatedAt: Date.now(),
      isDirty: true,
      isDeleted: false,
    };
    await db.budgets.add(newBudget);
    return newBudget.id;
  },

  /**
   * Update a budget — marks as dirty
   */
  async updateBudget(id: string, data: Partial<Omit<Budget, "id">>): Promise<number> {
    return db.budgets.update(id, {
      ...data,
      updatedAt: Date.now(),
      isDirty: true,
    });
  },

  /**
   * Soft-delete a budget
   */
  async deleteBudget(id: string): Promise<void> {
    await db.budgets.update(id, {
      isDeleted: true,
      isDirty: true,
      updatedAt: Date.now(),
    });
  },

  /**
   * Get all dirty (unsynced) budgets
   */
  async getDirty(): Promise<Budget[]> {
    return db.budgets.filter(b => b.isDirty).toArray();
  },

  /**
   * Bulk upsert budgets from server
   */
  async bulkUpsertFromServer(budgets: Budget[]): Promise<void> {
    await db.budgets.bulkPut(budgets);
  },
};
