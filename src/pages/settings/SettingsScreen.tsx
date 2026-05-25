import { useState, useRef } from "react";
import { User, Wallet, Plus, Trash2, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { exportDB, importDB } from "dexie-export-import";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { useWallets } from "@/hooks/useWallets";
import { db, type Wallet as WalletType } from "@/db/db";

import { 
  ConfirmModal, 
  BrutalButton, 
  SmallIconButton,
  EmptyState
} from "@/components/atoms";
import { 
  WalletCard, 
  WalletFormModal, 
  ProfileCard 
} from "@/components/molecules";
import { 
  DataManagementSection, 
  BackupRestoreSection 
} from "@/components/organisms";
import { MainPageTemplate } from "@/components/templates";

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

  async function handleUpdateWallet(data: Omit<WalletType, "id" | "updatedAt">) {
    if (!editingWallet?.id) return;
    await updateWallet(editingWallet.id, data);
    setEditingWallet(null);
    toast.success("Dompet berhasil diperbarui!");
  }

  // ── Backup & Restore Logic ──────────────────────────────────────────────────

  async function handleExport() {
    try {
      setIsExporting(true);
      const blob = await exportDB(db, { prettyJson: true });
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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportConfirmOpen(true);
    }
    e.target.value = "";
  }

  async function handleImportConfirm() {
    if (!selectedFile) return;
    try {
      setIsImporting(true);
      setImportConfirmOpen(false);
      await db.delete();
      await importDB(selectedFile);
      toast.success("Data berhasil diimpor! Aplikasi akan dimuat ulang.");
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error("Import failed:", error);
      toast.error("Gagal mengimpor data. Pastikan format file benar.");
    } finally {
      setIsImporting(false);
      setSelectedFile(null);
    }
  }

  return (
    <MainPageTemplate
      title="Profil & Pengaturan"
      headerBg="bg-brutal-orange"
      headerIcon={<User size={20} strokeWidth={2.5} className="text-brutal-orange" />}
      bottomPadding="large"
    >
      <div className="flex flex-col gap-0 divide-y-2 divide-brutal-black">
        {/* Profile Card */}
        <ProfileCard 
          name={user?.name || "User"} 
          onLogout={() => setLogoutConfirmOpen(true)} 
        />

        {/* Wallets Section */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wider opacity-60">
              Dompet Saya ({wallets.length})
            </p>
            <BrutalButton
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
            <EmptyState
              icon={Wallet}
              title="Belum ada dompet"
              description="Tap di sini untuk menambahkan dompet baru."
              bgColor="bg-brutal-lime"
              onClick={() => setAddModalOpen(true)}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {wallets.map((wallet) => (
                <div key={wallet.id} className="relative">
                  <WalletCard wallet={wallet} />
                  <div className="absolute top-2 right-2 flex gap-1.5">
                    <SmallIconButton
                      onClick={() => setEditingWallet(wallet)}
                      icon={Pencil}
                      variant="lime"
                      size="xs"
                    />
                    <SmallIconButton
                      onClick={() => setDeletingWallet(wallet)}
                      icon={Trash2}
                      variant="rose"
                      size="xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Data Management Section */}
        <DataManagementSection 
          onCategoriesClick={() => navigate("/settings/categories")}
          onBudgetsClick={() => navigate("/settings/budgets")}
        />

        {/* Backup & Restore Section */}
        <BackupRestoreSection 
          onExport={handleExport}
          onImport={() => fileInputRef.current?.click()}
          isExporting={isExporting}
          isImporting={isImporting}
        />
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json"
          className="hidden"
        />
      </div>

      {/* Modals */}
      <WalletFormModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSave={addWallet}
        mode="add"
      />

      <WalletFormModal
        open={editingWallet !== null}
        onClose={() => setEditingWallet(null)}
        onSave={handleUpdateWallet}
        initialData={editingWallet ?? undefined}
        mode="edit"
      />

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
    </MainPageTemplate>
  );
}
