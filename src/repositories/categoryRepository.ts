import { db, type Category } from "@/db/db";

export const categoryRepository = {
  async getAll() {
    return await db.categories.toArray();
  },

  async add(category: Omit<Category, "id">) {
    return await db.categories.add(category);
  },

  async update(id: number, changes: Partial<Category>) {
    return await db.categories.update(id, changes);
  },

  async remove(id: number) {
    await db.transaction("rw", db.categories, db.budgets, async () => {
      const affectedBudgets = await db.budgets.where("categoryIds").equals(id).toArray();
      for (const b of affectedBudgets) {
        if (!b.id) continue;
        const newIds = b.categoryIds.filter((cId) => cId !== id);
        if (newIds.length === 0) {
          await db.budgets.delete(b.id);
        } else {
          await db.budgets.update(b.id, { categoryIds: newIds });
        }
      }
      await db.categories.delete(id);
    });
  },
};
