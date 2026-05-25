import { type Wallet as WalletType } from "@/db/db";
import { WalletCard } from "@/components/molecules";
import { Wallet } from "lucide-react";

export interface WalletHorizontalListProps {
  wallets: WalletType[];
}

export function WalletHorizontalList({ wallets }: WalletHorizontalListProps) {
  if (wallets.length === 0) return null;

  return (
    <div className="border-b-2 border-brutal-black">
      <div className="flex items-center gap-2 px-4 py-2 border-b-2 border-brutal-black">
        <Wallet size={14} strokeWidth={2.5} />
        <span className="text-xs font-bold uppercase tracking-wider">
          Dompet Saya
        </span>
      </div>
      <div className="flex gap-3 overflow-x-auto px-4 py-3 no-scrollbar">
        {wallets.map((wallet) => (
          <div key={wallet.id} className="w-48 shrink-0">
            <WalletCard wallet={wallet} compact />
          </div>
        ))}
      </div>
    </div>
  );
}
