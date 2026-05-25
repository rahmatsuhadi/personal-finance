import { type Transaction } from "@/db/db";
import { type FilterPeriod, type FilterType } from "@/hooks/useTransactions";
import { TransactionGroup } from "@/components/molecules";
import { EmptyState } from "@/components/atoms";

export interface TransactionHistorySectionProps {
  grouped: Array<{ date: string; label: string; items: Transaction[] }>;
  filterPeriod: FilterPeriod;
  filterType: FilterType;
  onTransactionClick: (tx: Transaction) => void;
}

export function TransactionHistorySection({
  grouped,
  filterPeriod,
  filterType,
  onTransactionClick,
}: TransactionHistorySectionProps) {
  return (
    <div className="flex flex-col flex-1">
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-brutal-black bg-brutal-bg sticky top-0 z-10">
        <span className="text-xs font-bold uppercase tracking-wider">
          Riwayat Transaksi
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-50">
          {filterPeriod === "day"
            ? "Hari Ini"
            : filterPeriod === "week"
              ? "Minggu Ini"
              : filterPeriod === "month"
                ? "Bulan Ini"
                : "Tahun Ini"}{" "}
          · {filterType === "all" ? "Semua" : filterType === "income" ? "Pemasukan" : "Pengeluaran"}
        </span>
      </div>

      {grouped.length === 0 ? (
        <EmptyState
          title="Belum Ada Transaksi"
          description="Tekan tombol + untuk menambah transaksi baru."
          bgColor="bg-brutal-yellow"
          className="flex-1"
        />
      ) : (
        <div className="flex flex-col border-b-2 border-brutal-black divide-y-2 divide-brutal-black">
          {grouped.map((group) => (
            <TransactionGroup
              key={group.date}
              label={group.label}
              items={group.items}
              onItemClick={onTransactionClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
