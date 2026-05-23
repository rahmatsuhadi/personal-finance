import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useWallets } from "@/hooks/useWallets";
import { WalletCard } from "@/components/molecules/WalletCard";
import { WalletFormModal } from "@/components/molecules/WalletFormModal";
import { ConfirmModal } from "@/components/atoms/ConfirmModal";
import { BrutalButton } from "@/components/atoms/BrutalButton";
import { BrutalBadge } from "@/components/atoms/BrutalBadge";
import { User, LogOut, Wallet, Plus, Trash2, Pencil, Tags, Target, Cloud, CloudOff, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Wallet as WalletType } from "@/db/db";
import { useSyncContext } from "@/contexts/SyncContext";

// ─── SettingsScreen ───────────────────────────────────────────────────────────

export function SettingsScreen() {
  const { user, isCloudConnected, cloudUser, loginWithGoogle, logoutCloud, logout } = useAuth();
  const { wallets, addWallet, updateWallet, removeWallet } = useWallets();
  const { status: syncStatus, lastSyncAt, syncNow } = useSyncContext();
  const navigate = useNavigate();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<WalletType | null>(null);
  // Confirm modals
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [deletingWallet, setDeletingWallet] = useState<WalletType | null>(null);

  async function handleLogoutConfirm() {
    await logout();
    setLogoutConfirmOpen(false);
  }

  async function handleDeleteWalletConfirm() {
    if (!deletingWallet?.id) return;
    await removeWallet(deletingWallet.id);
    setDeletingWallet(null);
  }

  async function handleUpdateWallet(data: Omit<WalletType, "id" | "updatedAt" | "isDirty" | "isDeleted">) {
    if (!editingWallet?.id) return;
    await updateWallet(editingWallet.id, data);
    setEditingWallet(null);
  }

  return (
    <div
      className="flex flex-col min-h-full bg-brutal-bg pb-24"
      style={{ paddingTop: "var(--safe-top)" }}
    >
      {/* Header */}
      <div className="border-b-4 border-brutal-black bg-brutal-orange px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border-2 border-brutal-black bg-brutal-black">
            <User size={20} strokeWidth={2.5} className="text-brutal-orange" />
          </div>
          <h1 className="text-xl font-black uppercase tracking-tight">
            Profil & Pengaturan
          </h1>
        </div>
      </div>

      <div className="flex flex-col gap-0 divide-y-2 divide-brutal-black">
        {/* ── Profile Card ─────────────────────────────────────────────────── */}
        <div className="p-4">
          <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-3">
            Profil Pengguna
          </p>
          <div className="border-2 border-brutal-black bg-brutal-white p-4 shadow-brutal-md">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center border-2 border-brutal-black bg-brutal-yellow shadow-brutal-sm">
                <span className="text-2xl font-black">
                  {user?.name?.charAt(0).toUpperCase() ?? "?"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider opacity-60">Nama</p>
                <p className="text-xl font-black truncate">{user?.name}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t-2 border-brutal-black">
              <BrutalButton
                variant="danger"
                size="sm"
                onClick={() => setLogoutConfirmOpen(true)}
                className="flex items-center gap-2"
              >
                <LogOut size={14} strokeWidth={2.5} />
                Logout / Reset Profil
              </BrutalButton>
            </div>
          </div>
        </div>

        {/* ── Wallets Section ───────────────────────────────────────────────── */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wider opacity-60">
              Dompet Saya ({wallets.length})
            </p>
            <BrutalButton
              id="open-add-wallet-btn"
              variant="accent"
              size="sm"
              onClick={() => setAddModalOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Plus size={13} strokeWidth={2.5} />
              Tambah
            </BrutalButton>
          </div>

          {wallets.length === 0 ? (
            <button
              onClick={() => setAddModalOpen(true)}
              className="w-full border-2 border-dashed border-brutal-black bg-brutal-white p-6 flex flex-col items-center gap-2 brutal-press"
            >
              <Wallet size={32} className="opacity-30" />
              <p className="text-sm font-bold uppercase opacity-50">
                Belum ada dompet — Tap untuk tambah
              </p>
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              {wallets.map((wallet) => (
                <div key={wallet.id} className="relative">
                  <WalletCard wallet={wallet} />
                  <div className="absolute top-2 right-2 flex gap-1.5">
                    <button
                      onClick={() => setEditingWallet(wallet)}
                      className="flex h-7 w-7 items-center justify-center border-2 border-brutal-black bg-brutal-lime shadow-brutal-sm brutal-press"
                      aria-label={`Edit dompet ${wallet.name}`}
                    >
                      <Pencil size={12} strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={() => setDeletingWallet(wallet)}
                      className="flex h-7 w-7 items-center justify-center border-2 border-brutal-black bg-brutal-rose shadow-brutal-sm brutal-press"
                      aria-label={`Hapus dompet ${wallet.name}`}
                    >
                      <Trash2 size={12} strokeWidth={2.5} className="text-white" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Cloud Sync Section ─────────────────────────────────────────────── */}
        <div className="p-4 border-t-2 border-brutal-black">
          <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-3">
            Sinkronisasi Cloud
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
                  {isCloudConnected ? "Terhubung" : "Tidak Terhubung"}
                </p>
                <p className="text-xs text-brutal-black/60">
                  {isCloudConnected && cloudUser ? cloudUser.email : "Login Google untuk sinkronisasi"}
                </p>
              </div>
            </div>

            {isCloudConnected ? (
              <div className="flex flex-col gap-2">
                {lastSyncAt && (
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brutal-black/50">
                    Terakhir sync: {new Date(lastSyncAt).toLocaleString("id-ID")}
                  </p>
                )}
                <div className="flex gap-2">
                  <BrutalButton
                    id="sync-now-btn"
                    variant="primary"
                    size="sm"
                    onClick={syncNow}
                    disabled={syncStatus === "syncing"}
                    className="flex items-center gap-2 flex-1"
                  >
                    <RefreshCw size={13} strokeWidth={2.5} className={syncStatus === "syncing" ? "animate-spin" : ""} />
                    {syncStatus === "syncing" ? "Menyinkronkan..." : "Sync Sekarang"}
                  </BrutalButton>
                  <BrutalButton
                    variant="ghost"
                    size="sm"
                    onClick={logoutCloud}
                    className="flex items-center gap-1.5 flex-1"
                  >
                    <LogOut size={13} strokeWidth={2.5} />
                    Cabut Akun
                  </BrutalButton>
                </div>
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
                <Cloud size={13} strokeWidth={2.5} />
                Login dengan Google
              </BrutalButton>
            )}
          </div>
        </div>

        {/* ── Categories Management ─────────────────────────────────────────── */}
        <div className="p-4 border-t-2 border-brutal-black space-y-3">
          <button
            onClick={() => navigate("/settings/categories")}
            className="w-full border-2 border-brutal-black bg-brutal-white p-4 flex items-center justify-between brutal-press shadow-brutal-sm"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-brutal-cyan border-2 border-brutal-black flex items-center justify-center">
                <Tags size={18} strokeWidth={2.5} />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold uppercase">Kelola Kategori</p>
                <p className="text-xs text-brutal-black/60">Ubah, tambah, atau hapus kategori</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate("/settings/budgets")}
            className="w-full border-2 border-brutal-black bg-brutal-white p-4 flex items-center justify-between brutal-press shadow-brutal-sm"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-brutal-orange border-2 border-brutal-black flex items-center justify-center">
                <Target size={18} strokeWidth={2.5} />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold uppercase">Atur Anggaran</p>
                <p className="text-xs text-brutal-black/60">Kelola target pengeluaran kategori</p>
              </div>
            </div>
          </button>
        </div>

        {/* ── App Info ──────────────────────────────────────────────────────── */}
        <div className="p-4">
          <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-3">
            Tentang Aplikasi
          </p>
          <div className="border-2 border-brutal-black bg-brutal-white p-4 shadow-brutal-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold uppercase tracking-wider opacity-60">Versi</span>
              <BrutalBadge>1.0.0-Dev</BrutalBadge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider opacity-60">Penyimpanan</span>
              <BrutalBadge>Lokal / IndexedDB</BrutalBadge>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}

      {/* Add Wallet */}
      <WalletFormModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSave={addWallet}
        mode="add"
      />

      {/* Edit Wallet */}
      <WalletFormModal
        open={editingWallet !== null}
        onClose={() => setEditingWallet(null)}
        onSave={handleUpdateWallet}
        initialData={editingWallet ?? undefined}
        mode="edit"
      />

      {/* Delete Wallet Confirm */}
      <ConfirmModal
        open={deletingWallet !== null}
        title="Hapus Dompet"
        message={`Yakin ingin menghapus dompet "${deletingWallet?.name}"? Transaksi terkait tidak akan terhapus, namun saldo tidak akan diupdate.`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        variant="danger"
        onConfirm={handleDeleteWalletConfirm}
        onCancel={() => setDeletingWallet(null)}
      />

      {/* Logout Confirm */}
      <ConfirmModal
        open={logoutConfirmOpen}
        title="Logout & Reset"
        message="Yakin ingin menghapus profil dan kembali ke halaman awal? Semua data wallet dan transaksi akan tetap tersimpan."
        confirmLabel="Ya, Logout"
        cancelLabel="Batal"
        variant="warning"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setLogoutConfirmOpen(false)}
      />
    </div>
  );
}
