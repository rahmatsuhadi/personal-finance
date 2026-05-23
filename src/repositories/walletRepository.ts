import { db, type Wallet } from "@/db/db";

// ─── Wallet Repository ────────────────────────────────────────────────────────
// Pure async functions — NO React hooks or JSX allowed here.

export const walletRepository = {
  /**
   * Get all active (non-deleted) wallets
   */
  async getAll(): Promise<Wallet[]> {
    return db.wallets.filter(w => !w.isDeleted).toArray();
  },

  /**
   * Get wallet by ID (including soft-deleted)
   */
  async getById(id: string): Promise<Wallet | undefined> {
    return db.wallets.get(id);
  },

  /**
   * Add a new wallet with UUID and dirty flag
   */
  async add(wallet: Omit<Wallet, "id" | "serverId" | "updatedAt" | "isDirty" | "isDeleted">) {
    const newWallet: Wallet = {
      ...wallet,
      id: crypto.randomUUID(),
      updatedAt: Date.now(),
      isDirty: true,
      isDeleted: false,
    };
    await db.wallets.add(newWallet);
    return newWallet.id;
  },

  /**
   * Update a wallet — marks as dirty
   */
  async update(id: string, changes: Partial<Omit<Wallet, "id">>): Promise<number> {
    return db.wallets.update(id, {
      ...changes,
      updatedAt: Date.now(),
      isDirty: true,
    });
  },

  /**
   * Soft-delete a wallet
   */
  async remove(id: string): Promise<void> {
    await db.wallets.update(id, {
      isDeleted: true,
      isDirty: true,
      updatedAt: Date.now(),
    });
  },

  /**
   * Hard delete (used internally after successful server sync)
   */
  async hardDelete(id: string): Promise<void> {
    await db.wallets.delete(id);
  },

  /**
   * Calculate total balance across all active wallets
   */
  async getTotalBalance(): Promise<number> {
    const wallets = await this.getAll();
    return wallets.reduce((sum, w) => sum + (w.balance ?? 0), 0);
  },

  /**
   * Mark wallet as synced (clear dirty flag, set serverId)
   */
  async markSynced(id: string, serverId: string): Promise<void> {
    await db.wallets.update(id, { isDirty: false, serverId });
  },

  /**
   * Get all dirty (unsynced) wallets
   */
  async getDirty(): Promise<Wallet[]> {
    return db.wallets.filter(w => w.isDirty).toArray();
  },

  /**
   * Bulk upsert wallets from server (initial/delta sync)
   */
  async bulkUpsertFromServer(wallets: Wallet[]): Promise<void> {
    await db.wallets.bulkPut(wallets);
  },
};
