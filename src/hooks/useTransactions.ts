import { useState, useEffect, useCallback } from "react";
import { liveQuery } from "dexie";
import { db, type Transaction } from "@/db/db";
import { transactionRepository } from "@/repositories/transactionRepository";
import { format, subDays, startOfWeek, startOfMonth, startOfYear } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export type FilterType = "all" | "income" | "expense";
export type FilterPeriod = "day" | "week" | "month" | "year";

// ─── Date label helper ────────────────────────────────────────────────────────

export function getDateLabel(dateStr: string): string {
  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
  if (dateStr === today) return "Hari Ini";
  if (dateStr === yesterday) return "Kemarin";
  const [y, m, d] = dateStr.split("-").map(Number);
  return format(new Date(y, m - 1, d), "d MMMM yyyy", { locale: idLocale });
}

export function groupTransactionsByDate(
  transactions: Transaction[]
): { label: string; date: string; items: Transaction[] }[] {
  const map = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    if (!map.has(tx.date)) map.set(tx.date, []);
    map.get(tx.date)!.push(tx);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({ label: getDateLabel(date), date, items }));
}

// ─── Balance helpers ──────────────────────────────────────────────────────────

/** Apply balance changes for a transaction being ADDED */
async function applyBalanceAdd(tx: Omit<Transaction, "id" | "serverId" | "updatedAt" | "isDirty" | "isDeleted">) {
  if (tx.type === "income" && tx.walletId) {
    const w = await db.wallets.get(tx.walletId);
    if (w) await db.wallets.update(tx.walletId, { balance: (w.balance ?? 0) + tx.amount });
  } else if (tx.type === "expense" && tx.walletId) {
    const w = await db.wallets.get(tx.walletId);
    if (w) await db.wallets.update(tx.walletId, { balance: (w.balance ?? 0) - tx.amount });
  } else if (tx.type === "transfer" && tx.fromWalletId && tx.toWalletId) {
    const fee = tx.transferFee ?? 0;
    const from = await db.wallets.get(tx.fromWalletId);
    const to = await db.wallets.get(tx.toWalletId);
    if (from) await db.wallets.update(tx.fromWalletId, { balance: (from.balance ?? 0) - tx.amount - fee });
    if (to) await db.wallets.update(tx.toWalletId, { balance: (to.balance ?? 0) + tx.amount });
  }
}

/** Reverse balance changes for a transaction being REMOVED */
async function reverseBalance(tx: Transaction) {
  if (tx.type === "income" && tx.walletId) {
    const w = await db.wallets.get(tx.walletId);
    if (w) await db.wallets.update(tx.walletId, { balance: (w.balance ?? 0) - tx.amount });
  } else if (tx.type === "expense" && tx.walletId) {
    const w = await db.wallets.get(tx.walletId);
    if (w) await db.wallets.update(tx.walletId, { balance: (w.balance ?? 0) + tx.amount });
  } else if (tx.type === "transfer" && tx.fromWalletId && tx.toWalletId) {
    const fee = tx.transferFee ?? 0;
    const from = await db.wallets.get(tx.fromWalletId);
    const to = await db.wallets.get(tx.toWalletId);
    if (from) await db.wallets.update(tx.fromWalletId, { balance: (from.balance ?? 0) + tx.amount + fee });
    if (to) await db.wallets.update(tx.toWalletId, { balance: (to.balance ?? 0) - tx.amount });
  }
}

// ─── useTransactions Hook ─────────────────────────────────────────────────────

export function useTransactions(
  filterType: FilterType = "all",
  filterPeriod: FilterPeriod = "month"
) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const sub = liveQuery(async () => {
      const today = new Date();
      const toDate = format(today, "yyyy-MM-dd");
      let fromDate: string;

      switch (filterPeriod) {
        case "day":
          fromDate = toDate;
          break;
        case "week":
          fromDate = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
          break;
        case "month":
          fromDate = format(startOfMonth(today), "yyyy-MM-dd");
          break;
        case "year":
          fromDate = format(startOfYear(today), "yyyy-MM-dd");
          break;
      }

      const results = await db.transactions
        .where("date")
        .between(fromDate, toDate, true, true)
        .filter(t => !t.isDeleted)
        .reverse()
        .toArray();

      return filterType === "all"
        ? results
        : results.filter((t) => t.type === filterType);
    }).subscribe({
      next: (data) => setTransactions(data),
      error: (e) => console.error("[useTransactions]", e),
    });

    return () => sub.unsubscribe();
  }, [filterType, filterPeriod]);

  const grouped = groupTransactionsByDate(transactions);

  // ── Add ────────────────────────────────────────────────────────────────────
  const addTransaction = useCallback(async (tx: Omit<Transaction, "id" | "serverId" | "updatedAt" | "isDirty" | "isDeleted">) => {
    const id = await transactionRepository.add(tx);
    await applyBalanceAdd(tx);
    return id;
  }, []);

  // ── Update ─────────────────────────────────────────────────────────────────
  // Strategy: reverse old balance, apply new balance, then update record
  const updateTransaction = useCallback(
    async (id: string, newData: Omit<Transaction, "id" | "serverId" | "updatedAt" | "isDirty" | "isDeleted">) => {
      const old = await db.transactions.get(id);
      if (old) {
        // 1. Reverse old balance effect
        await reverseBalance(old);
      }
      // 2. Persist new data
      await transactionRepository.update(id, newData);
      // 3. Apply new balance effect
      await applyBalanceAdd(newData);
    },
    []
  );

  // ── Remove ─────────────────────────────────────────────────────────────────
  // Reverse balance before soft-deleting
  const removeTransaction = useCallback(async (id: string) => {
    const tx = await db.transactions.get(id);
    if (tx) {
      await reverseBalance(tx);
    }
    await transactionRepository.remove(id);
  }, []);

  return {
    transactions,
    grouped,
    addTransaction,
    updateTransaction,
    removeTransaction,
  };
}

// ─── useAllTransactions (untuk stats/calendar) ────────────────────────────────

export function useAllTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const sub = liveQuery(() =>
      db.transactions.filter(t => !t.isDeleted).toArray()
        .then(txs => txs.sort((a, b) => b.date.localeCompare(a.date)))
    ).subscribe({
      next: (data) => setTransactions(data),
      error: (e) => console.error("[useAllTransactions]", e),
    });
    return () => sub.unsubscribe();
  }, []);

  return { transactions };
}
