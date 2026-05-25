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
   * Get wallet by ID
   */
  async getById(id: string): Promise<Wallet | undefined> {
    return db.wallets.get(id);
  },

  /**
   * Add a new wallet with UUID
   */
  async add(wallet: Omit<Wallet, "id" | "updatedAt">) {
    const newWallet: Wallet = {
      ...wallet,
      id: crypto.randomUUID(),
      updatedAt: Date.now(),
    };
    await db.wallets.add(newWallet);
    return newWallet.id;
  },

  /**
   * Update a wallet
   */
  async update(id: string, changes: Partial<Omit<Wallet, "id">>): Promise<number> {
    return db.wallets.update(id, {
      ...changes,
      updatedAt: Date.now(),
    });
  },

  /**
   * Hard-delete a wallet
   */
  async remove(id: string): Promise<void> {
    await db.wallets.delete(id);
  },

  /**
   * Calculate total balance across all wallets
   */
  async getTotalBalance(): Promise<number> {
    const wallets = await this.getAll();
    return wallets.reduce((sum, w) => sum + (w.balance ?? 0), 0);
  },
};
