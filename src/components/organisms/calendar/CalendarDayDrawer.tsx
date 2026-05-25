import { ChevronLeft, ChevronRight, X, ArrowDown, ArrowUp, ArrowLeftRight, Inbox } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { cn, formatIDR } from "@/lib/utils";
import { SmallIconButton } from "@/components/atoms/SmallIconButton";
import { type Transaction } from "@/db/db";

const TYPE_ICON: Record<Transaction["type"], React.ReactNode> = {
  income: <ArrowDown size={18} strokeWidth={2.5} />,
  expense: <ArrowUp size={18} strokeWidth={2.5} />,
  transfer: <ArrowLeftRight size={18} strokeWidth={2.5} />,
};

const TYPE_TEXT_COLOR: Record<Transaction["type"], string> = {
  income: "text-brutal-emerald",
  expense: "text-brutal-rose",
  transfer: "text-brutal-black",
};

export interface CalendarDayDrawerProps {
  selectedDate: Date;
  transactions: Transaction[];
  onClose: () => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  onTxClick: (tx: Transaction) => void;
}

export function CalendarDayDrawer({
  selectedDate,
  transactions,
  onClose,
  onPrevDay,
  onNextDay,
  onTxClick,
}: CalendarDayDrawerProps) {
  const dateLabel = format(selectedDate, "EEEE, d MMMM yyyy", { locale: idLocale });

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-brutal-black/50" onClick={onClose} />
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 max-h-[70vh] flex flex-col",
          "border-t-4 border-brutal-black bg-brutal-bg",
          "pb-[calc(var(--safe-bottom)+72px)]",
          "animate-in slide-in-from-bottom duration-200"
        )}
      >
        {/* Header */}
        <div className="flex items-center border-b-2 border-brutal-black px-4 py-3 shrink-0">
          <SmallIconButton
            onClick={onPrevDay}
            icon={ChevronLeft}
            variant="white"
            size="sm"
            className="mr-2"
          />
          <p className="flex-1 text-center text-xs font-black uppercase tracking-wider">
            {dateLabel}
          </p>
          <SmallIconButton
            onClick={onNextDay}
            icon={ChevronRight}
            variant="white"
            size="sm"
            className="ml-2"
          />
          <SmallIconButton
            onClick={onClose}
            icon={X}
            variant="white"
            size="sm"
            className="ml-2"
          />
        </div>

        {/* Summary strip */}
        {transactions.length > 0 && (
          <div className="flex border-b-2 border-brutal-black divide-x-2 divide-brutal-black shrink-0">
            <div className="flex-1 p-2 text-center bg-brutal-emerald">
              <p className="text-[10px] font-bold uppercase">Masuk</p>
              <p className="text-xs font-black">{formatIDR(income)}</p>
            </div>
            <div className="flex-1 p-2 text-center bg-brutal-rose">
              <p className="text-[10px] font-bold uppercase">Keluar</p>
              <p className="text-xs font-black">{formatIDR(expense)}</p>
            </div>
          </div>
        )}

        {/* Transaction List */}
        <div className="overflow-y-auto flex-1">
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Inbox size={48} strokeWidth={2.5} className="text-brutal-black/40 mb-2" />
              <p className="text-xs font-bold uppercase text-brutal-black/40">
                Tidak ada transaksi hari ini
              </p>
            </div>
          ) : (
            <ul className="divide-y-2 divide-brutal-black">
              {transactions.map((tx) => (
                <li key={tx.id}>
                  <button
                    onClick={() => onTxClick(tx)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left bg-brutal-white brutal-press"
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center text-sm font-black border-2 border-brutal-black",
                        tx.type === "income" && "bg-brutal-emerald",
                        tx.type === "expense" && "bg-brutal-rose",
                        tx.type === "transfer" && "bg-brutal-cyan"
                      )}
                    >
                      {TYPE_ICON[tx.type]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{tx.description}</p>
                      <p className="text-[10px] text-brutal-black/50">{tx.category}</p>
                    </div>
                    <p className={cn("text-sm font-black shrink-0", TYPE_TEXT_COLOR[tx.type])}>
                      {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : ""}
                      {formatIDR(tx.amount)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
