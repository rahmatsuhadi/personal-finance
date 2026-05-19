import { useStack } from "@/navigation/StackNavigator";
import { AppHeader } from "@/components/atoms/AppHeader";
import { BrutalBadge } from "@/components/atoms/BrutalBadge";
import { cn } from "@/lib/utils";
import { type Transaction } from "@/db/db";
import { useWallets } from "@/hooks/useWallets";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

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

// ─── Row helper ────────────────────────────────────────────────────────────────

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

// ─── TransactionDetailScreen ──────────────────────────────────────────────────

interface TransactionDetailScreenProps {
  transaction: Transaction;
}

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

export function TransactionDetailScreen({ transaction }: TransactionDetailScreenProps) {
  const { pop } = useStack();
  const { wallets } = useWallets();

  const meta = TYPE_META[transaction.type];

  function getWalletName(id?: number): string {
    if (!id) return "—";
    return wallets.find((w) => w.id === id)?.name ?? `Dompet #${id}`;
  }

  return (
    <div
      className="flex flex-col h-dvh bg-brutal-bg"
      style={{ paddingTop: "var(--safe-top)" }}
    >
      {/* AppHeader */}
      <AppHeader title="Detail Transaksi" onBack={pop} />

      {/* Amount Hero Block */}
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
        <div className="border-2 border-brutal-black bg-brutal-white shadow-brutal-md px-4">
          <DetailRow
            label="Deskripsi"
            value={transaction.description || "—"}
          />
          <DetailRow label="Tanggal" value={formatDate(transaction.date)} />
          <DetailRow label="Kategori" value={transaction.category} />

          {/* Wallet info — conditional by type */}
          {transaction.type !== "transfer" && (
            <DetailRow label="Dompet" value={getWalletName(transaction.walletId)} />
          )}
          {transaction.type === "transfer" && (
            <>
              <DetailRow
                label="Dari Dompet"
                value={getWalletName(transaction.fromWalletId)}
              />
              <DetailRow
                label="Ke Dompet"
                value={getWalletName(transaction.toWalletId)}
              />
            </>
          )}

          {/* Notes — hidden if empty */}
          {transaction.notes && (
            <DetailRow label="Catatan" value={transaction.notes} />
          )}
        </div>
      </div>
    </div>
  );
}
