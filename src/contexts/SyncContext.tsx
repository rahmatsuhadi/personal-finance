import { createContext, useContext, type ReactNode } from "react";
import { useSync, type SyncStatus } from "@/hooks/useSync";
import { useAuth } from "@/hooks/useAuth";

// ─── Sync Context ─────────────────────────────────────────────────────────────

interface SyncContextType {
  status: SyncStatus;
  lastSyncAt: number | null;
  backup: () => Promise<void>;
  restore: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType>({
  status: "idle",
  lastSyncAt: null,
  backup: async () => {},
  restore: async () => {},
});

function SyncInner({ children, isCloudConnected }: { children: ReactNode; isCloudConnected: boolean }) {
  const sync = useSync(isCloudConnected);

  return (
    <SyncContext.Provider value={sync}>
      {children}
    </SyncContext.Provider>
  );
}

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
