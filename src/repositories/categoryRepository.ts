import { db, type Category } from "@/db/db";

export const categoryRepository = {
  /**
   * Get all active (non-deleted) categories
   */
  async getAll() {
    return db.categories.filter(c => !c.isDeleted).toArray();
  },

  /**
   * Add a new category with UUID and dirty flag
   */
  async add(category: Omit<Category, "id" | "serverId" | "updatedAt" | "isDirty" | "isDeleted">) {
    const newCat: Category = {
      ...category,
      id: crypto.randomUUID(),
      updatedAt: Date.now(),
      isDirty: false, // Sync disabled
      isDeleted: false,
    };
    await db.categories.add(newCat);
    return newCat.id;
  },

  /**
   * Update a category — marks as dirty
   */
  async update(id: string, changes: Partial<Omit<Category, "id">>) {
    return db.categories.update(id, {
      ...changes,
      updatedAt: Date.now(),
      isDirty: false, // Sync disabled
    });
  },

  /**
   * Soft-delete category (and update budgets referencing it)
   */
  async remove(id: string) {
    await db.transaction("rw", db.categories, db.budgets, async () => {
      const affectedBudgets = await db.budgets.filter(b => !b.isDeleted && b.categoryIds.includes(id)).toArray();
      for (const b of affectedBudgets) {
        const newIds = b.categoryIds.filter((cId) => cId !== id);
        if (newIds.length === 0) {
          await db.budgets.update(b.id, {
            isDeleted: true,
            isDirty: false, // Sync disabled
            updatedAt: Date.now(),
          });
        } else {
          await db.budgets.update(b.id, {
            categoryIds: newIds,
            isDirty: false, // Sync disabled
            updatedAt: Date.now(),
          });
        }
      }
      await db.categories.update(id, {
        isDeleted: true,
        isDirty: false, // Sync disabled
        updatedAt: Date.now(),
      });
    });
  },

  /**
   * Get all dirty (unsynced) categories
   */
  async getDirty(): Promise<Category[]> {
    return db.categories.filter(c => c.isDirty).toArray();
  },

  /**
   * Bulk upsert categories from server
   */
  async bulkUpsertFromServer(categories: Category[]): Promise<void> {
    await db.categories.bulkPut(categories);
  },
};
