import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSyncContext } from "@/contexts/SyncContext";

/**
 * Component to handle auto-restore on initial login/mount
 */
export function RestoreInitializer() {
    const { isCloudConnected } = useAuth();
    const { lastSyncAt, restore, status } = useSyncContext();

    useEffect(() => {
        // Jika cloud terhubung tapi belum pernah ada sync/restore sama sekali di device ini
        if (isCloudConnected && lastSyncAt === null && status === "idle") {
            console.log("[Restore] New session detected, performing auto-restore/init...");
            restore().catch(console.error);
        }
    }, [isCloudConnected, lastSyncAt, restore, status]);

    return null;
}
