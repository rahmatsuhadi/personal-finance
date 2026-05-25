import { type Wallet } from "@/db/db";
import { cn } from "@/lib/utils";

// ─── Color map for wallet colorClass ─────────────────────────────────────────

const colorMap: Record<string, string> = {
  "brutal-lime": "bg-brutal-lime",
  "brutal-cyan": "bg-brutal-cyan",
  "brutal-yellow": "bg-brutal-yellow",
  "brutal-pink": "bg-brutal-pink",
  "brutal-purple": "bg-brutal-purple",
  "brutal-emerald": "bg-brutal-emerald",
  "brutal-rose": "bg-brutal-rose",
  "brutal-orange": "bg-brutal-orange",
};

// ─── Format currency helper ───────────────────────────────────────────────────

function formatBalance(amount: number, currency: "IDR" | "USD"): string {
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

// ─── WalletCard Molecule ──────────────────────────────────────────────────────

interface WalletCardProps {
  wallet: Wallet;
  compact?: boolean;
  onClick?: () => void;
}

export function WalletCard({ wallet, compact = false, onClick }: WalletCardProps) {
  const bgColor = colorMap[wallet.colorClass] ?? "bg-brutal-yellow";

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 border-2 border-brutal-black p-3",
          "shadow-brutal-sm",
          bgColor,
          onClick && "brutal-press cursor-pointer"
        )}
        onClick={onClick}
      >
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider truncate">
            {wallet.name}
          </p>
          <p className="text-sm font-black truncate">
            {formatBalance(wallet.balance, wallet.currency)}
          </p>
        </div>
        {/* <BrutalBadge variant="currency">{wallet.currency}</BrutalBadge> */}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border-2 border-brutal-black p-4 shadow-brutal-md",
        bgColor,
        onClick && "brutal-press cursor-pointer"
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex flex-col">
          <span className="text-xs font-bold uppercase tracking-wider opacity-70">
            Dompet
          </span>
          <h3 className="text-lg font-black truncate">{wallet.name}</h3>
        </div>
        {/* <BrutalBadge variant="currency">{wallet.currency}</BrutalBadge> */}
      </div>

      {/* Balance */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider opacity-70">
          Saldo
        </span>
        <p className="text-2xl font-black leading-tight">
          {formatBalance(wallet.balance, wallet.currency)}
        </p>
      </div>
    </div>
  );
}
