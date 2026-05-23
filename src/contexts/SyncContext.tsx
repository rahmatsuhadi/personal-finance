import { createContext, useContext, type ReactNode } from "react";
import { useSync, type SyncStatus } from "@/hooks/useSync";
import { useAuth } from "@/hooks/useAuth";

// ─── Sync Context ─────────────────────────────────────────────────────────────

interface SyncContextType {
  status: SyncStatus;
  lastSyncAt: number | null;
  syncNow: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType>({
  status: "idle",
  lastSyncAt: null,
  syncNow: async () => {},
});

// ─── Inner component that actually runs useSync ───────────────────────────────
// Separated so useSync is always called unconditionally (Rules of Hooks).

function SyncInner({ children, isCloudConnected }: { children: ReactNode; isCloudConnected: boolean }) {
  // isCloudConnected comes from AuthContext (already fetched) — no extra getSession() call
  const sync = useSync(isCloudConnected);

  return (
    <SyncContext.Provider value={sync}>
      {children}
    </SyncContext.Provider>
  );
}

// ─── SyncProvider ─────────────────────────────────────────────────────────────

export function SyncProvider({ children }: { children: ReactNode }) {
  const { isCloudConnected } = useAuth();

  return (
    <SyncInner isCloudConnected={isCloudConnected}>
      {children}
    </SyncInner>
  );
}

export function useSyncContext() {
  return useContext(SyncContext);
}
