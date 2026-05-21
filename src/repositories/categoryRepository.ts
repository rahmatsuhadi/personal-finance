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
    return await db.categories.delete(id);
  },
};
