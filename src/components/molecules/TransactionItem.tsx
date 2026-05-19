import { type Transaction } from "@/db/db";
import { BrutalBadge } from "@/components/atoms/BrutalBadge";
import { cn } from "@/lib/utils";
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from "lucide-react";

// ─── Format currency helper ───────────────────────────────────────────────────

function formatAmount(amount: number, type: Transaction["type"]): string {
  const formatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

  if (type === "income") return `+${formatted}`;
  if (type === "expense") return `-${formatted}`;
  return formatted;
}

// ─── TransactionItem Molecule ─────────────────────────────────────────────────

interface TransactionItemProps {
  transaction: Transaction;
  onClick?: () => void;
}

const typeConfig = {
  income: {
    icon: ArrowDownLeft,
    iconBg: "bg-brutal-emerald",
    amountColor: "text-brutal-emerald",
    badgeVariant: "income" as const,
    label: "Pemasukan",
  },
  expense: {
    icon: ArrowUpRight,
    iconBg: "bg-brutal-rose",
    amountColor: "text-brutal-rose",
    badgeVariant: "expense" as const,
    label: "Pengeluaran",
  },
  transfer: {
    icon: ArrowLeftRight,
    iconBg: "bg-brutal-cyan",
    amountColor: "text-brutal-black",
    badgeVariant: "transfer" as const,
    label: "Transfer",
  },
};

export function TransactionItem({ transaction, onClick }: TransactionItemProps) {
  const config = typeConfig[transaction.type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-3 border-2 border-brutal-black bg-brutal-white p-3",
        "shadow-brutal-sm",
        onClick && "brutal-press cursor-pointer"
      )}
      onClick={onClick}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex h-10 w-10 flex-shrink-0 items-center justify-center",
          "border-2 border-brutal-black",
          config.iconBg
        )}
      >
        <Icon size={18} strokeWidth={2.5} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate">
          {transaction.description || config.label}
        </p>
        <p className="text-xs text-brutal-black/60 truncate">
          {transaction.category}
        </p>
      </div>

      {/* Amount */}
      <div className="text-right flex-shrink-0">
        <p className={cn("text-sm font-black", config.amountColor)}>
          {formatAmount(transaction.amount, transaction.type)}
        </p>
      </div>
    </div>
  );
}

// ─── TransactionGroup Molecule ────────────────────────────────────────────────

interface TransactionGroupProps {
  label: string;
  items: Transaction[];
  onItemClick?: (tx: Transaction) => void;
}

export function TransactionGroup({
  label,
  items,
  onItemClick,
}: TransactionGroupProps) {
  return (
    <div className="flex flex-col">
      {/* Date label */}
      <div className="flex items-center gap-2 px-4 py-2 border-b-2 border-brutal-black bg-brutal-black">
        <span className="text-xs font-bold uppercase tracking-wider text-brutal-lime">
          {label}
        </span>
      </div>

      {/* Items */}
      <div className="flex flex-col divide-y-2 divide-brutal-black">
        {items.map((tx) => (
          <TransactionItem
            key={tx.id}
            transaction={tx}
            onClick={onItemClick ? () => onItemClick(tx) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
