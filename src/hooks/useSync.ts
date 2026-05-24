import { useState, useCallback, useRef } from "react";
import { db } from "@/db/db";
import { CONFIG } from "@/config";

export type SyncStatus = "idle" | "syncing" | "success" | "error" | "offline";

const LAST_SYNC_KEY = "kanti_last_sync_ts";
const baseURL = CONFIG.API_URL;

export function useSync(isAuthenticated: boolean) {
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(() => {
    const stored = localStorage.getItem(LAST_SYNC_KEY);
    return stored ? Number(stored) : null;
  });
  const syncingRef = useRef(false);

  /**
   * BACKUP: Manual Push ALL data to server
   */
  const backup = useCallback(async () => {
    if (!CONFIG.SYNC_ENABLED) {
      console.log("[Sync] Backup is disabled.");
      return;
    }
    if (syncingRef.current || !isAuthenticated) return;
    if (!navigator.onLine) { setStatus("offline"); return; }

    syncingRef.current = true;
    setStatus("syncing");

    try {
      // Get EVERYTHING (even non-dirty) to ensure full backup
      const [txs, wallets, cats, budgets] = await Promise.all([
        db.transactions.toArray(),
        db.wallets.toArray(),
        db.categories.toArray(),
        db.budgets.toArray(),
      ]);

      const res = await fetch(`${baseURL}/api/sync/backup`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          changes: { wallets, transactions: txs, categories: cats, budgets }
        }),
      });

      if (!res.ok) throw new Error(`[Backup] Server error: ${res.status}`);
      const result = await res.json();
      if (!result.success) throw new Error("[Backup] Failed on server");

      // Mark everything as clean after successful backup
      await Promise.all([
        db.transactions.where("isDirty").equals(1).modify({ isDirty: false }),
        db.wallets.where("isDirty").equals(1).modify({ isDirty: false }),
        db.categories.where("isDirty").equals(1).modify({ isDirty: false }),
        db.budgets.where("isDirty").equals(1).modify({ isDirty: false }),
      ]);

      const now = Date.now();
      localStorage.setItem(LAST_SYNC_KEY, String(now));
      setLastSyncAt(now);
      setStatus("success");
      console.log("[Backup] Full backup completed successfully");
    } catch (err) {
      console.error("[Backup] Error:", err);
      setStatus("error");
    } finally {
      syncingRef.current = false;
    }
  }, [isAuthenticated]);

  /**
   * RESTORE: Manual Pull ALL data from server
   */
  const restore = useCallback(async () => {
    if (!CONFIG.SYNC_ENABLED) {
      console.log("[Sync] Restore is disabled.");
      return;
    }
    if (syncingRef.current || !isAuthenticated) return;
    if (!navigator.onLine) { setStatus("offline"); return; }

    syncingRef.current = true;
    setStatus("syncing");

    try {
      const res = await fetch(`${baseURL}/api/sync/restore`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) throw new Error(`[Restore] Server error: ${res.status}`);
      const result = await res.json();
      if (!result.success) throw new Error("[Restore] Failed on server");

      const { wallets, transactions, categories, budgets } = result.data;

      // Overwrite local data with server data
      await db.transaction("rw", [db.wallets, db.transactions, db.categories, db.budgets], async () => {
        if (categories.length > 0) await db.categories.bulkPut(categories.map((c: any) => ({ ...c, isDirty: false })));
        if (wallets.length > 0) await db.wallets.bulkPut(wallets.map((w: any) => ({ ...w, isDirty: false })));
        if (transactions.length > 0) await db.transactions.bulkPut(transactions.map((t: any) => ({ ...t, isDirty: false })));
        if (budgets.length > 0) await db.budgets.bulkPut(budgets.map((b: any) => ({ ...b, isDirty: false })));
      });

      const now = Date.now();
      localStorage.setItem(LAST_SYNC_KEY, String(now));
      setLastSyncAt(now);
      setStatus("success");
      console.log("[Restore] Data restored from server successfully");
    } catch (err) {
      console.error("[Restore] Error:", err);
      setStatus("error");
    } finally {
      syncingRef.current = false;
    }
  }, [isAuthenticated]);

  return {
    status,
    lastSyncAt,
    backup,
    restore,
  };
}
