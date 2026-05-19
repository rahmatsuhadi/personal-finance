import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useWallets } from "@/hooks/useWallets";
import { WalletCard } from "@/components/molecules/WalletCard";
import { AddWalletModal } from "@/components/molecules/AddWalletModal";
import { BrutalButton } from "@/components/atoms/BrutalButton";
import { BrutalBadge } from "@/components/atoms/BrutalBadge";
import { cn } from "@/lib/utils";
import { User, LogOut, Wallet, Plus, Trash2 } from "lucide-react";

// ─── SettingsScreen ───────────────────────────────────────────────────────────

export function SettingsScreen() {
  const { user, logout } = useAuth();
  const { wallets, addWallet, removeWallet } = useWallets();
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  async function handleLogout() {
    if (confirm("Yakin ingin menghapus profil dan kembali ke halaman awal?")) {
      await logout();
    }
  }

  async function handleDeleteWallet(id: number, name: string) {
    if (confirm(`Hapus dompet "${name}"? Data transaksi terkait tidak akan terhapus.`)) {
      await removeWallet(id);
    }
  }

  return (
    <div
      className={cn("flex flex-col min-h-full bg-brutal-bg pb-24")}
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
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center border-2 border-brutal-black bg-brutal-yellow shadow-brutal-sm">
                <span className="text-2xl font-black">
                  {user?.name?.charAt(0).toUpperCase() ?? "?"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider opacity-60">
                  Nama
                </p>
                <p className="text-xl font-black truncate">{user?.name}</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t-2 border-brutal-black">
              <BrutalButton
                variant="danger"
                size="sm"
                onClick={handleLogout}
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
              onClick={() => setWalletModalOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Plus size={13} strokeWidth={2.5} />
              Tambah Dompet
            </BrutalButton>
          </div>

          {wallets.length === 0 ? (
            <button
              onClick={() => setWalletModalOpen(true)}
              className={cn(
                "w-full border-2 border-dashed border-brutal-black bg-brutal-white p-6",
                "flex flex-col items-center gap-2 brutal-press"
              )}
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
                  {/* Delete button */}
                  <button
                    onClick={() => handleDeleteWallet(wallet.id!, wallet.name)}
                    className={cn(
                      "absolute top-2 right-2",
                      "flex h-7 w-7 items-center justify-center",
                      "border-2 border-brutal-black bg-brutal-white shadow-brutal-sm brutal-press"
                    )}
                    aria-label={`Hapus dompet ${wallet.name}`}
                  >
                    <Trash2 size={13} strokeWidth={2.5} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── App Info ──────────────────────────────────────────────────────── */}
        <div className="p-4">
          <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-3">
            Tentang Aplikasi
          </p>
          <div className="border-2 border-brutal-black bg-brutal-white p-4 shadow-brutal-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold uppercase tracking-wider opacity-60">
                Versi
              </span>
              <BrutalBadge>1.0.0</BrutalBadge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider opacity-60">
                Penyimpanan
              </span>
              <BrutalBadge>Lokal / IndexedDB</BrutalBadge>
            </div>
          </div>
        </div>
      </div>

      {/* Add Wallet Modal */}
      <AddWalletModal
        open={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        onSave={addWallet}
      />
    </div>
  );
}
