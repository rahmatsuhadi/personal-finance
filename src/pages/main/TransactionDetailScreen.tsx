import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/atoms/AppHeader";
import { BrutalButton } from "@/components/atoms/BrutalButton";
import { BrutalBadge } from "@/components/atoms/BrutalBadge";
import { ConfirmModal } from "@/components/atoms/ConfirmModal";
import { cn } from "@/lib/utils";
import { db, type Transaction } from "@/db/db";
import { useWallets } from "@/hooks/useWallets";
import { useTransactions } from "@/hooks/useTransactions";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Pencil, Trash2 } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return format(new Date(y, m - 1, d), "EEEE, d MMMM yyyy", { locale: idLocale });
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b-2 border-brutal-black last:border-b-0">
      <span className="text-xs font-bold uppercase tracking-wider text-brutal-black/50 shrink-0 w-32">
        {label}
      </span>
      <span className="text-sm font-bold text-right flex-1">{value}</span>
    </div>
  );
}

// ─── Type Config ──────────────────────────────────────────────────────────────

const TYPE_META = {
  income: {
    label: "Pemasukan",
    headerBg: "bg-brutal-emerald",
    amountPrefix: "+",
    badgeVariant: "income" as const,
  },
  expense: {
    label: "Pengeluaran",
    headerBg: "bg-brutal-rose",
    amountPrefix: "-",
    badgeVariant: "expense" as const,
  },
  transfer: {
    label: "Transfer",
    headerBg: "bg-brutal-cyan",
    amountPrefix: "",
    badgeVariant: "transfer" as const,
  },
};

// ─── TransactionDetailScreen ──────────────────────────────────────────────────

export function TransactionDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { wallets } = useWallets();
  const { removeTransaction } = useTransactions();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [transaction, setTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    if (id) {
      db.transactions.get(parseInt(id)).then((tx) => {
        if (tx) setTransaction(tx);
        else navigate(-1);
      });
    }
  }, [id, navigate]);

  if (!transaction) {
    return (
      <div className="flex h-dvh items-center justify-center bg-brutal-bg">
        <p className="font-bold">Loading...</p>
      </div>
    );
  }

  const meta = TYPE_META[transaction.type];

  function getWalletName(wid?: number): string {
    if (!wid) return "—";
    return wallets.find((w) => w.id === wid)?.name ?? `Dompet #${wid}`;
  }

  function handleEdit() {
    navigate(`/transaction/edit/${transaction!.id}`);
  }

  async function handleDeleteConfirm() {
    await removeTransaction(transaction!.id!);
    setDeleteOpen(false);
    navigate(-1);
  }

  return (
    <div
      className="flex flex-col h-dvh bg-brutal-bg"
      style={{ paddingTop: "var(--safe-top)" }}
    >
      <AppHeader
        title="Detail Transaksi"
        onBack={() => navigate(-1)}
        action={
          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              className="flex h-9 w-9 items-center justify-center border-2 border-brutal-lime bg-brutal-lime shadow-brutal-sm brutal-press"
              aria-label="Edit transaksi"
            >
              <Pencil size={15} strokeWidth={2.5} className="text-brutal-black" />
            </button>
            <button
              onClick={() => setDeleteOpen(true)}
              className="flex h-9 w-9 items-center justify-center border-2 border-brutal-rose bg-brutal-rose shadow-brutal-sm brutal-press"
              aria-label="Hapus transaksi"
            >
              <Trash2 size={15} strokeWidth={2.5} className="text-white" />
            </button>
          </div>
        }
      />

      {/* Amount Hero */}
      <div
        className={cn(
          "flex flex-col items-center justify-center py-10 px-6",
          "border-b-4 border-brutal-black",
          meta.headerBg
        )}
      >
        <BrutalBadge variant={meta.badgeVariant} className="mb-3">
          {meta.label}
        </BrutalBadge>
        <p className="text-4xl font-black text-brutal-black leading-none text-center">
          {meta.amountPrefix}{formatIDR(transaction.amount)}
        </p>
        {transaction.type === "transfer" && (transaction.transferFee ?? 0) > 0 && (
          <p className="text-sm font-bold text-brutal-black/60 mt-2">
            + biaya {formatIDR(transaction.transferFee!)}
          </p>
        )}
      </div>

      {/* Detail Table */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="border-2 border-brutal-black bg-brutal-white shadow-brutal-md px-4 mb-4">
          <DetailRow label="Deskripsi" value={transaction.description || "—"} />
          <DetailRow label="Tanggal" value={formatDate(transaction.date)} />
          <DetailRow label="Kategori" value={transaction.category} />
          {transaction.type !== "transfer" && (
            <DetailRow label="Dompet" value={getWalletName(transaction.walletId)} />
          )}
          {transaction.type === "transfer" && (
            <>
              <DetailRow label="Dari Dompet" value={getWalletName(transaction.fromWalletId)} />
              <DetailRow label="Ke Dompet" value={getWalletName(transaction.toWalletId)} />
            </>
          )}
          {transaction.notes && <DetailRow label="Catatan" value={transaction.notes} />}
        </div>

        {/* Transaction Items */}
        {transaction.items && transaction.items.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-black uppercase tracking-wider mb-2 opacity-60">
              Rincian Barang
            </h3>
            <div className="border-2 border-brutal-black bg-brutal-white shadow-brutal-md divide-y-2 divide-brutal-black">
              {transaction.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-3">
                  <span className="text-sm font-bold">{item.name}</span>
                  <span className="text-sm font-black">
                    {formatIDR(item.price)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <BrutalButton
            variant="ghost"
            size="md"
            className="flex-1 flex items-center justify-center gap-2"
            onClick={handleEdit}
          >
            <Pencil size={14} strokeWidth={2.5} />
            Edit
          </BrutalButton>
          <BrutalButton
            variant="danger"
            size="md"
            className="flex-1 flex items-center justify-center gap-2"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 size={14} strokeWidth={2.5} />
            Hapus
          </BrutalButton>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        open={deleteOpen}
        title="Hapus Transaksi"
        message={`Yakin ingin menghapus transaksi "${transaction.description}"? Saldo dompet akan dikembalikan secara otomatis.`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
