import { db, type Category } from "@/db/db";

export const categoryRepository = {
  /**
   * Get all categories
   */
  async getAll() {
    return db.categories.toArray();
  },

  /**
   * Add a new category with UUID
   */
  async add(category: Omit<Category, "id" | "updatedAt">) {
    const newCat: Category = {
      ...category,
      id: crypto.randomUUID(),
      updatedAt: Date.now(),
    };
    await db.categories.add(newCat);
    return newCat.id;
  },

  /**
   * Update a category
   */
  async update(id: string, changes: Partial<Omit<Category, "id">>) {
    return db.categories.update(id, {
      ...changes,
      updatedAt: Date.now(),
    });
  },

  /**
   * Hard-delete category (and delete/update budgets referencing it)
   */
  async remove(id: string) {
    await db.transaction("rw", db.categories, db.budgets, async () => {
      const affectedBudgets = await db.budgets.filter(b => b.categoryIds.includes(id)).toArray();
      for (const b of affectedBudgets) {
        const newIds = b.categoryIds.filter((cId) => cId !== id);
        if (newIds.length === 0) {
          await db.budgets.delete(b.id);
        } else {
          await db.budgets.update(b.id, {
            categoryIds: newIds,
            updatedAt: Date.now(),
          });
        }
      }
      await db.categories.delete(id);
    });
  },
};
