import { useSyncContext } from "@/contexts/SyncContext";
import { useAuth } from "@/hooks/useAuth";
import { ConfirmModal } from "../atoms/ConfirmModal";
import { useState } from "react";
import { Cloud, CloudOff, Download, Upload } from "lucide-react";
import { BrutalButton } from "../atoms/BrutalButton";


export default function CloudSyncActionCard() {

    const { isCloudConnected, cloudUser, loginWithGoogle, logoutCloud } = useAuth()
    const { status: syncStatus, lastSyncAt, backup, restore } = useSyncContext();
    const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);


    async function handleRestoreConfirm() {
        await restore();
        setRestoreConfirmOpen(false);
    }

    return (
        <>
            <ConfirmModal
                open={restoreConfirmOpen}
                title="Restore Data"
                message="Restore akan menimpa data lokal Anda dengan data terakhir yang ada di cloud. Lanjutkan?"
                confirmLabel="Ya, Restore"
                cancelLabel="Batal"
                variant="warning"
                onConfirm={handleRestoreConfirm}
                onCancel={() => setRestoreConfirmOpen(false)}
            />

            <div className="p-4 border-t-2 border-brutal-black">
                <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-3">
                    Backup & Restore Cloud
                </p>
                <div className="border-2 border-brutal-black bg-brutal-white p-4 shadow-brutal-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`flex h-10 w-10 items-center justify-center border-2 border-brutal-black ${isCloudConnected ? "bg-brutal-lime" : "bg-brutal-black/10"}`}>
                            {isCloudConnected ? (
                                <Cloud size={18} strokeWidth={2.5} />
                            ) : (
                                <CloudOff size={18} strokeWidth={2.5} className="opacity-50" />
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold uppercase">
                                {isCloudConnected ? "Status: Terhubung" : "Cloud Tidak Aktif"}
                            </p>
                            <p className="text-xs text-brutal-black/60 truncate">
                                {isCloudConnected && cloudUser ? cloudUser.email : "Login Google untuk backup data"}
                            </p>
                        </div>
                    </div>

                    {isCloudConnected ? (
                        <div className="flex flex-col gap-3">
                            {lastSyncAt && (
                                <p className="text-[10px] font-bold uppercase tracking-wider text-brutal-black/50">
                                    Aktivitas terakhir: {new Date(lastSyncAt).toLocaleString("id-ID")}
                                </p>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                                <BrutalButton
                                    id="backup-now-btn"
                                    variant="primary"
                                    size="sm"
                                    onClick={backup}
                                    disabled={syncStatus === "syncing"}
                                    className="flex items-center justify-center gap-2"
                                >
                                    <Upload size={14} strokeWidth={2.5} className={syncStatus === "syncing" ? "animate-pulse" : ""} />
                                    Backup
                                </BrutalButton>

                                <BrutalButton
                                    id="restore-now-btn"
                                    variant="accent"
                                    size="sm"
                                    onClick={() => setRestoreConfirmOpen(true)}
                                    disabled={syncStatus === "syncing"}
                                    className="flex items-center justify-center gap-2"
                                >
                                    <Download size={14} strokeWidth={2.5} className={syncStatus === "syncing" ? "animate-pulse" : ""} />
                                    Restore
                                </BrutalButton>
                            </div>

                            <BrutalButton
                                variant="ghost"
                                onClick={logoutCloud}
                                className="mt-1"
                            >
                                Logout Cloud
                            </BrutalButton>
                        </div>
                    ) : (
                        <BrutalButton
                            id="settings-google-login-btn"
                            variant="accent"
                            size="sm"
                            fullWidth
                            onClick={loginWithGoogle}
                            className="flex items-center justify-center gap-2"
                        >
                            <Cloud size={14} strokeWidth={2.5} />
                            Login dengan Google
                        </BrutalButton>
                    )}
                </div>
            </div>
        </>

    );
}