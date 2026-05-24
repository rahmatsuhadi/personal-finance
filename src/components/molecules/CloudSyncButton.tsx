import { useSyncContext } from "@/contexts/SyncContext";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Cloud, CloudOff, RefreshCw } from "lucide-react";

export default function CloudSyncButton() {
    const { status: syncStatus, backup } = useSyncContext();
    const { isCloudConnected: cloudConnected } = useAuth();


    return (
        <>
            {cloudConnected && (
                <button
                    id="home-sync-btn"
                    onClick={backup}
                    disabled={syncStatus === "syncing"}
                    className={cn(
                        "flex h-10 w-10 items-center justify-center",
                        "border-2 brutal-press",
                        syncStatus === "syncing" && "border-brutal-yellow bg-brutal-yellow/20 animate-pulse",
                        syncStatus === "success" && "border-brutal-lime bg-brutal-lime/20",
                        syncStatus === "error" && "border-brutal-rose bg-brutal-rose/20",
                        syncStatus === "offline" && "border-brutal-black/30 bg-transparent opacity-50",
                        syncStatus === "idle" && "border-brutal-lime/50 bg-transparent",
                    )}
                    aria-label="Status sinkronisasi"
                >
                    {syncStatus === "offline" ? (
                        <CloudOff size={16} strokeWidth={2.5} className="text-brutal-black/50" />
                    ) : syncStatus === "syncing" ? (
                        <RefreshCw size={16} strokeWidth={2.5} className="text-brutal-yellow animate-spin" />
                    ) : syncStatus === "error" ? (
                        <CloudOff size={16} strokeWidth={2.5} className="text-brutal-rose" />
                    ) : (
                        <Cloud size={16} strokeWidth={2.5} className="text-brutal-lime" />
                    )}
                </button>
            )}
        </>
    )
}