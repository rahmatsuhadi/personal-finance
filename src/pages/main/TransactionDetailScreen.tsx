import { useStack } from "@/navigation/StackNavigator";
import { AppHeader } from "@/components/atoms/AppHeader";
import { BrutalButton } from "@/components/atoms/BrutalButton";
import { BrutalBadge } from "@/components/atoms/BrutalBadge";
import { cn } from "@/lib/utils";
import { type Transaction } from "@/db/db";
import { useWallets } from "@/hooks/useWallets";
import { useTransactions } from "@/hooks/useTransactions";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Pencil, Trash2 } from "lucide-react";
import { EditTransactionScreen } from "@/pages/main/EditTransactionScreen";

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
      <span className="text-xs font-bold uppercase tracking-wider text-brutal-black/50 flex-shrink-0 w-32">
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

interface TransactionDetailScreenProps {
  transaction: Transaction;
}

export function TransactionDetailScreen({ transaction }: TransactionDetailScreenProps) {
  const { pop, push } = useStack();
  const { wallets } = useWallets();
  const { removeTransaction } = useTransactions();

  const meta = TYPE_META[transaction.type];

  function getWalletName(id?: number): string {
    if (!id) return "—";
    return wallets.find((w) => w.id === id)?.name ?? `Dompet #${id}`;
  }

  function handleEdit() {
    push(
      <EditTransactionScreen
        transaction={transaction}
        onUpdated={() => pop()} // pop detail after edit success
      />
    );
  }

  async function handleDelete() {
    if (!confirm("Hapus transaksi ini?")) return;
    await removeTransaction(transaction.id!);
    pop();
  }

  return (
    <div
      className="flex flex-col h-dvh bg-brutal-bg"
      style={{ paddingTop: "var(--safe-top)" }}
    >
      {/* AppHeader with edit + delete in action slot */}
      <AppHeader
        title="Detail Transaksi"
        onBack={pop}
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
              onClick={handleDelete}
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
          {meta.amountPrefix}
          {formatIDR(transaction.amount)}
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

          {transaction.notes && (
            <DetailRow label="Catatan" value={transaction.notes} />
          )}
        </div>

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
            onClick={handleDelete}
          >
            <Trash2 size={14} strokeWidth={2.5} />
            Hapus
          </BrutalButton>
        </div>
      </div>
    </div>
  );
}
