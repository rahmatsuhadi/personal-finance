import { db, type Transaction } from "@/db/db";

// ─── Transaction Repository ───────────────────────────────────────────────────
// Pure async functions — NO React hooks or JSX allowed here.

export const transactionRepository = {
  /**
   * Get all transactions, sorted newest first
   */
  async getAll(): Promise<Transaction[]> {
    return db.transactions.orderBy("date").reverse().toArray();
  },

  /**
   * Get transactions filtered by date range
   */
  async getByDateRange(from: string, to: string): Promise<Transaction[]> {
    return db.transactions
      .where("date")
      .between(from, to, true, true)
      .reverse()
      .toArray();
  },

  /**
   * Add a new transaction
   */
  async add(transaction: Omit<Transaction, "id">) {
    return db.transactions.add(transaction);
  },

  /**
   * Update a transaction by id
   */
  async update(
    id: number,
    changes: Partial<Transaction>
  ): Promise<number> {
    return db.transactions.update(id, changes);
  },

  /**
   * Delete a transaction by id
   */
  async remove(id: number): Promise<void> {
    await db.transactions.delete(id);
  },
};
