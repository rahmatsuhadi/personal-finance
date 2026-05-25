import { db, type Transaction } from "@/db/db";

// ─── Transaction Repository ───────────────────────────────────────────────────
// Pure async functions — NO React hooks or JSX allowed here.

export const transactionRepository = {
  /**
   * Get all transactions, sorted newest first
   */
  async getAll(): Promise<Transaction[]> {
    return db.transactions
      .toArray()
      .then(txs => txs.sort((a, b) => b.date.localeCompare(a.date)));
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
   * Get transaction by ID
   */
  async getById(id: string): Promise<Transaction | undefined> {
    return db.transactions.get(id);
  },

  /**
   * Add a new transaction with UUID
   */
  async add(transaction: Omit<Transaction, "id" | "updatedAt">) {
    const newTx: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
      updatedAt: Date.now(),
    };
    await db.transactions.add(newTx);
    return newTx.id;
  },

  /**
   * Update a transaction
   */
  async update(id: string, changes: Partial<Omit<Transaction, "id">>): Promise<number> {
    return db.transactions.update(id, {
      ...changes,
      updatedAt: Date.now(),
    });
  },

  /**
   * Hard-delete a transaction
   */
  async remove(id: string): Promise<void> {
    await db.transactions.delete(id);
  },
};
