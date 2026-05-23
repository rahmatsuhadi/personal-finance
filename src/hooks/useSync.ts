import { useState, useEffect, useCallback, useRef } from "react";
import { transactionRepository } from "@/repositories/transactionRepository";
import { walletRepository } from "@/repositories/walletRepository";
import { categoryRepository } from "@/repositories/categoryRepository";
import { budgetRepository } from "@/repositories/budgetRepository";
import type { Transaction, Wallet, Category, Budget } from "@/db/db";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SyncStatus = "idle" | "syncing" | "success" | "error" | "offline";

const LAST_SYNC_KEY = "kanti_last_sync_ts";
const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

// ─── API contract ─────────────────────────────────────────────────────────────

interface SyncRequestBody {
  lastSyncTimestamp: string; // ISO string, or "" for initial sync
  changes: {
    wallets: Wallet[];
    transactions: Transaction[];
    categories: Category[];
    budgets: Budget[];
  };
}

interface SyncResponse {
  success: boolean;
  syncTimestamp: string; // ISO string
  data: {
    wallets: Wallet[];
    transactions: Transaction[];
    categories: Category[];
    budgets: Budget[];
  };
}

// ─── useSync Hook ─────────────────────────────────────────────────────────────
// `isAuthenticated` is passed from SyncContext (sourced from AuthContext)
// to avoid redundant getSession() calls — AuthContext already fetches it once.

export function useSync(isAuthenticated: boolean) {
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(() => {
    const stored = localStorage.getItem(LAST_SYNC_KEY);
    return stored ? Number(stored) : null;
  });
  const syncingRef = useRef(false);

  // ── Core sync function ───────────────────────────────────────────────────

  const sync = useCallback(async () => {
    if (syncingRef.current) return;

    if (!navigator.onLine) {
      setStatus("offline");
      return;
    }

    // Guard: session state already resolved by AuthContext — no extra network call
    if (!isAuthenticated) {
      setStatus("idle");
      return;
    }

    syncingRef.current = true;
    setStatus("syncing");

    try {
      const isInitialSync = lastSyncAt === null;

      // ── Collect all dirty local records ──────────────────────────────────
      const [dirtyTx, dirtyWallets, dirtyCats, dirtyBudgets] = await Promise.all([
        transactionRepository.getDirty(),
        walletRepository.getDirty(),
        categoryRepository.getDirty(),
        budgetRepository.getDirty(),
      ]);

      // ── Single request: push dirty + pull server delta ───────────────────
      const body: SyncRequestBody = {
        lastSyncTimestamp: isInitialSync ? "" : new Date(lastSyncAt).toISOString(),
        changes: {
          wallets: dirtyWallets,
          transactions: dirtyTx,
          categories: dirtyCats,
          budgets: dirtyBudgets,
        },
      };

      const res = await fetch(`${baseURL}/api/sync/`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "Unknown error");
        throw new Error(`[Sync] ${res.status}: ${text}`);
      }

      const result: SyncResponse = await res.json();

      if (!result.success) {
        throw new Error("[Sync] Server returned success: false");
      }

      // ── Mark pushed records as clean ─────────────────────────────────────
      await Promise.all([
        ...dirtyTx.map(t => transactionRepository.markSynced(t.id, t.serverId ?? t.id)),
        ...dirtyWallets.map(w => walletRepository.markSynced(w.id, w.serverId ?? w.id)),
        ...dirtyCats.map(c => categoryRepository.update(c.id, { isDirty: false })),
        ...dirtyBudgets.map(b => budgetRepository.updateBudget(b.id, { isDirty: false })),
      ]);

      // ── Merge server data into Dexie (bulkPut = upsert) ──────────────────
      const { wallets, transactions, categories, budgets } = result.data;

      if (wallets.length > 0) {
        await walletRepository.bulkUpsertFromServer(
          wallets.map(w => ({ ...w, isDirty: false }))
        );
      }
      if (transactions.length > 0) {
        await transactionRepository.bulkUpsertFromServer(
          transactions.map(t => ({ ...t, isDirty: false }))
        );
      }
      if (categories.length > 0) {
        await categoryRepository.bulkUpsertFromServer(
          categories.map(c => ({ ...c, isDirty: false }))
        );
      }
      if (budgets.length > 0) {
        await budgetRepository.bulkUpsertFromServer(
          budgets.map(b => ({ ...b, isDirty: false }))
        );
      }

      // ── Persist sync timestamp ────────────────────────────────────────────
      const newTimestamp = new Date(result.syncTimestamp).getTime();
      localStorage.setItem(LAST_SYNC_KEY, String(newTimestamp));
      setLastSyncAt(newTimestamp);
      setStatus("success");

      console.log(`[Sync] ${isInitialSync ? "Initial" : "Delta"} sync OK. ts: ${result.syncTimestamp}`);
    } catch (err) {
      console.error("[Sync] Failed:", err);
      setStatus("error");
    } finally {
      syncingRef.current = false;
    }
  }, [lastSyncAt, isAuthenticated]);

  // ── Auto-sync on mount (or when auth becomes true) + interval ────────────

  useEffect(() => {
    if (!isAuthenticated) return;

    sync();

    const interval = setInterval(sync, SYNC_INTERVAL_MS);
    const handleOnline = () => sync();
    window.addEventListener("online", handleOnline);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]); // Re-trigger when user logs in

  return {
    status,
    lastSyncAt,
    syncNow: sync,
  };
}
