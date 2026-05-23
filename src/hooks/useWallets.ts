import { useState, useEffect, useCallback } from "react";
import { liveQuery } from "dexie";
import { db } from "@/db/db";
import { walletRepository } from "@/repositories/walletRepository";
import type { Wallet } from "@/db/db";

// ─── useWallets Hook ──────────────────────────────────────────────────────────

export function useWallets() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [incomeTotal, setIncomeTotal] = useState(0);
  const [expenseTotal, setExpenseTotal] = useState(0);

  useEffect(() => {
    const sub = liveQuery(() => walletRepository.getAll()).subscribe({
      next: (data) => setWallets(data),
      error: (e) => console.error("[useWallets:wallets]", e),
    });
    return () => sub.unsubscribe();
  }, []);

  useEffect(() => {
    const sub = liveQuery(() =>
      db.transactions
        .filter(t => t.type === "income" && !t.isDeleted)
        .toArray()
        .then((txs) => txs.reduce((sum, t) => sum + t.amount, 0))
    ).subscribe({
      next: (v) => setIncomeTotal(v),
      error: () => {},
    });
    return () => sub.unsubscribe();
  }, []);

  useEffect(() => {
    const sub = liveQuery(() =>
      db.transactions
        .filter(t => t.type === "expense" && !t.isDeleted)
        .toArray()
        .then((txs) => txs.reduce((sum, t) => sum + t.amount, 0))
    ).subscribe({
      next: (v) => setExpenseTotal(v),
      error: () => {},
    });
    return () => sub.unsubscribe();
  }, []);

  const totalBalance = wallets.reduce((sum, w) => sum + (w.balance ?? 0), 0);

  const addWallet = useCallback(async (wallet: Omit<Wallet, "id" | "serverId" | "updatedAt" | "isDirty" | "isDeleted">) => {
    await walletRepository.add(wallet);
  }, []);

  const updateWallet = useCallback(
    async (id: string, changes: Partial<Omit<Wallet, "id">>) => {
      await walletRepository.update(id, changes);
    },
    []
  );

  const removeWallet = useCallback(async (id: string) => {
    await walletRepository.remove(id);
  }, []);

  return {
    wallets,
    totalBalance,
    incomeTotal,
    expenseTotal,
    addWallet,
    updateWallet,
    removeWallet,
  };
}
