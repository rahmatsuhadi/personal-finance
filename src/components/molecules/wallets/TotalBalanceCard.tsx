import { formatIDR } from "@/lib/utils";

export interface TotalBalanceCardProps {
  balance: number;
}

export function TotalBalanceCard({ balance }: TotalBalanceCardProps) {
  return (
    <div className="border-2 border-brutal-lime bg-brutal-lime p-4 shadow-brutal-md">
      <p className="text-[10px] font-bold uppercase tracking-widest text-brutal-black/60 mb-1">
        Total Saldo Semua Dompet
      </p>
      <p className="text-3xl font-black text-brutal-black leading-none">
        {formatIDR(balance)}
      </p>
    </div>
  );
}
