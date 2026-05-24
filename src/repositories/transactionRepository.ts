import { db, type Transaction } from "@/db/db";

// ─── Transaction Repository ───────────────────────────────────────────────────
// Pure async functions — NO React hooks or JSX allowed here.

export const transactionRepository = {
  /**
   * Get all active transactions, sorted newest first
   */
  async getAll(): Promise<Transaction[]> {
    return db.transactions
      .filter(t => !t.isDeleted)
      .toArray()
      .then(txs => txs.sort((a, b) => b.date.localeCompare(a.date)));
  },

  /**
   * Get transactions filtered by date range (excludes soft-deleted)
   */
  async getByDateRange(from: string, to: string): Promise<Transaction[]> {
    return db.transactions
      .where("date")
      .between(from, to, true, true)
      .filter(t => !t.isDeleted)
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
   * Add a new transaction with UUID and dirty flag
   */
  async add(transaction: Omit<Transaction, "id" | "serverId" | "updatedAt" | "isDirty" | "isDeleted">) {
    const newTx: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
      updatedAt: Date.now(),
      isDirty: false, // Sync disabled
      isDeleted: false,
    };
    await db.transactions.add(newTx);
    return newTx.id;
  },

  /**
   * Update a transaction — marks as dirty
   */
  async update(id: string, changes: Partial<Omit<Transaction, "id">>): Promise<number> {
    return db.transactions.update(id, {
      ...changes,
      updatedAt: Date.now(),
      isDirty: false, // Sync disabled
    });
  },

  /**
   * Soft-delete a transaction
   */
  async remove(id: string): Promise<void> {
    await db.transactions.update(id, {
      isDeleted: true,
      isDirty: false, // Sync disabled
      updatedAt: Date.now(),
    });
  },

  /**
   * Hard delete (used internally after successful server sync)
   */
  async hardDelete(id: string): Promise<void> {
    await db.transactions.delete(id);
  },

  /**
   * Mark transaction as synced
   */
  async markSynced(id: string, serverId: string): Promise<void> {
    await db.transactions.update(id, { isDirty: false, serverId });
  },

  /**
   * Get all dirty (unsynced) transactions
   */
  async getDirty(): Promise<Transaction[]> {
    return db.transactions.filter(t => t.isDirty).toArray();
  },

  /**
   * Bulk upsert transactions from server (initial/delta sync)
   */
  async bulkUpsertFromServer(transactions: Transaction[]): Promise<void> {
    await db.transactions.bulkPut(transactions);
  },
};
