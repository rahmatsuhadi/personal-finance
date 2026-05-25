
import type { ParsedTransaction } from "@/types";
import { Check, X, Wallet, Tag, Edit3 } from "lucide-react";

interface TxConfirmCardProps {
  tx: ParsedTransaction;
  isApproved?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onEdit: () => void;
}

export function TxConfirmCard({ tx, isApproved, onConfirm, onCancel, onEdit }: TxConfirmCardProps) {
  const formatIDR = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

  return (
    <div className="mt-3 w-full border-2 border-brutal-black bg-brutal-white p-4 shadow-brutal-sm">
      <div className="border-b-2 border-dashed border-brutal-black pb-2 mb-3">
        <span className={`inline-block px-2 py-0.5 text-[10px] font-black uppercase border border-brutal-black ${tx.type === 'expense' ? 'bg-brutal-rose text-white' : 'bg-brutal-emerald text-white'}`}>
          {tx.type === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
        </span>
        <h4 className="text-base font-black mt-1">{tx.description}</h4>
        <p className="text-xl font-black text-brutal-purple mt-0.5">{formatIDR(tx.amount)}</p>
      </div>

      <div className="space-y-1.5 text-xs font-bold text-brutal-black/80 mb-4">
        <div className="flex items-center gap-2">
          <Wallet size={12} />
          <span>Sumber Dana: <b className="text-brutal-black">{tx.walletName}</b></span>
        </div>
        <div className="flex items-center gap-2">
          <Tag size={12} />
          <span>Tanggal: <b className="text-brutal-black">{tx.date}</b></span>
        </div>
      </div>

      {isApproved ? (
        <div className="flex items-center justify-center gap-1.5 border-2 border-brutal-black bg-brutal-emerald/20 p-2 text-xs font-black text-brutal-emerald">
          <Check size={14} strokeWidth={3} /> TRANSAKSI BERHASIL DICATAT
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="flex-1 flex items-center justify-center gap-1 border-2 border-brutal-black bg-brutal-rose py-2 text-xs font-black text-white shadow-brutal-xs brutal-press"
            >
              <X size={14} strokeWidth={3} /> Batal
            </button>
            <button
              onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-1 border-2 border-brutal-black bg-brutal-cyan py-2 text-xs font-black text-brutal-black shadow-brutal-xs brutal-press"
            >
              <Edit3 size={14} strokeWidth={3} /> Edit
            </button>
          </div>
          <button
            onClick={onConfirm}
            className="w-full flex items-center justify-center gap-1 border-2 border-brutal-black bg-brutal-lime py-2.5 text-xs font-black text-brutal-black shadow-brutal-xs brutal-press"
          >
            <Check size={14} strokeWidth={3} /> Setuju
          </button>
        </div>
      )}
    </div>
  );
}