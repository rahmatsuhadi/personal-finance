import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useWallets } from "@/hooks/useWallets";
import { WalletCard } from "@/components/molecules/WalletCard";
import { WalletFormModal } from "@/components/molecules/WalletFormModal";
import { ConfirmModal } from "@/components/atoms/ConfirmModal";
import { BrutalButton } from "@/components/atoms/BrutalButton";
import { User, LogOut, Wallet, Plus, Trash2, Pencil, Tags, Target, Download, Upload} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { db } from "@/db/db";
import { exportDB, importDB } from "dexie-export-import";
import type { Wallet as WalletType } from "@/db/db";
import { toast } from "sonner";
// import CloudSyncActionCard from "@/components/molecules/CloudSyncActionCard";

// ─── SettingsScreen ───────────────────────────────────────────────────────────

export function SettingsScreen() {
  const { user, logout, isCloudConnected } = useAuth();
  const { wallets, addWallet, updateWallet, removeWallet } = useWallets();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<WalletType | null>(null);
  // Confirm modals
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [deletingWallet, setDeletingWallet] = useState<WalletType | null>(null);
  const [importConfirmOpen, setImportConfirmOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  async function handleLogoutConfirm() {
    await logout();
    setLogoutConfirmOpen(false);
    toast.info("Berhasil logout.");
  }

  async function handleDeleteWalletConfirm() {
    if (!deletingWallet?.id) return;
    await removeWallet(deletingWallet.id);
    setDeletingWallet(null);
    toast.success("Dompet berhasil dihapus!");
  }


  async function handleUpdateWallet(data: Omit<WalletType, "id" | "updatedAt" | "isDirty" | "isDeleted">) {
    if (!editingWallet?.id) return;
    await updateWallet(editingWallet.id, data);
    setEditingWallet(null);
    toast.success("Dompet berhasil diperbarui!");
  }

  // ── Backup & Restore Logic ──────────────────────────────────────────────────

  async function handleExport() {
    try {
      setIsExporting(true);
      const blob = await exportDB(db, {
        prettyJson: true,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const date = new Date().toISOString().split("T")[0];
      link.href = url;
      link.download = `kantiarta-backup-${date}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Data berhasil diekspor!");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Gagal mengekspor data.");
    } finally {
      setIsExporting(false);
    }
  }

  function onImportClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportConfirmOpen(true);
    }
    // Reset input value so same file can be selected again
    e.target.value = "";
  }

  async function handleImportConfirm() {
    if (!selectedFile) return;

    try {
      setIsImporting(true);
      setImportConfirmOpen(false);

      // Delete existing DB before import to avoid conflicts
      await db.delete();
      await importDB(selectedFile);
      
      toast.success("Data berhasil diimpor! Aplikasi akan dimuat ulang.");
      
      // Reload page to re-initialize DB state across hooks
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Import failed:", error);
      toast.error("Gagal mengimpor data. Pastikan format file benar.");
    } finally {
      setIsImporting(false);
      setSelectedFile(null);
    }
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

        {/* <CloudSyncActionCard /> */}

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

        {/* ── Categories Management ─────────────────────────────────────────── */}
        <div className="p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-3">
            Manajemen Data
          </p>
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

        {/* ── Backup & Restore Section ──────────────────────────────────────── */}
        <div className="p-4 bg-brutal-bg">
          <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-3">
            Backup & Pemulihan
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="border-2 border-brutal-black bg-brutal-lime p-4 flex flex-col items-center gap-2 brutal-press shadow-brutal-sm disabled:opacity-50"
            >
              <Download size={24} strokeWidth={2.5} />
              <div className="text-center">
                <p className="text-xs font-black uppercase">Ekspor Data</p>
                <p className="text-[10px] opacity-70">Simpan ke JSON</p>
              </div>
            </button>

            <button
              onClick={onImportClick}
              disabled={isImporting}
              className="border-2 border-brutal-black bg-brutal-yellow p-4 flex flex-col items-center gap-2 brutal-press shadow-brutal-sm disabled:opacity-50"
            >
              <Upload size={24} strokeWidth={2.5} />
              <div className="text-center">
                <p className="text-xs font-black uppercase">Impor Data</p>
                <p className="text-[10px] opacity-70">Muat dari file</p>
              </div>
            </button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
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
        message={`Yakin ingin menghapus dompet "${deletingWallet?.name}"? Transaksi terkait tidak akan terhapus.`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        variant="danger"
        onConfirm={handleDeleteWalletConfirm}
        onCancel={() => setDeletingWallet(null)}
      />

      {/* Import Confirm */}
      <ConfirmModal
        open={importConfirmOpen}
        title="Konfirmasi Impor"
        message="Mengimpor data akan menghapus semua data lokal saat ini dan menggantinya dengan data dari file backup. Lanjutkan?"
        confirmLabel="Ya, Impor"
        cancelLabel="Batal"
        variant="warning"
        onConfirm={handleImportConfirm}
        onCancel={() => {
          setImportConfirmOpen(false);
          setSelectedFile(null);
        }}
      />

      {/* Logout Confirm */}
      <ConfirmModal
        open={logoutConfirmOpen}
        title="Logout & Reset"
        message={isCloudConnected ? "Anda akan logout dari akun cloud dan menghapus semua data lokal. Pastikan sudah melakukan backup jika perlu." : "Anda akan menghapus semua data lokal. Pastikan sudah melakukan backup jika perlu."}
        confirmLabel="Ya, Logout"
        cancelLabel="Batal"
        variant="warning"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setLogoutConfirmOpen(false)}
      />
    </div>
  );
}
