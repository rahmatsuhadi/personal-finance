import { db, type Wallet } from "@/db/db";

// ─── Wallet Repository ────────────────────────────────────────────────────────
// Pure async functions — NO React hooks or JSX allowed here.

export const walletRepository = {
  /**
   * Get all wallets
   */
  async getAll(): Promise<Wallet[]> {
    return db.wallets.toArray();
  },

  /**
   * Add a new wallet
   */
  async add(wallet: Omit<Wallet, "id">): Promise<number> {
    return db.wallets.add(wallet);
  },

  /**
   * Update a wallet by id
   */
  async update(id: number, changes: Partial<Wallet>): Promise<number> {
    return db.wallets.update(id, changes);
  },

  /**
   * Delete a wallet by id
   */
  async remove(id: number): Promise<void> {
    await db.wallets.delete(id);
  },

  /**
   * Calculate total balance across all wallets (IDR equivalent)
   */
  async getTotalBalance(): Promise<number> {
    const wallets = await db.wallets.toArray();
    return wallets.reduce((sum, w) => sum + (w.balance ?? 0), 0);
  },
};
