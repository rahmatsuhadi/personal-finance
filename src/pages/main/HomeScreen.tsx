import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useWallets } from "@/hooks/useWallets";
import { useTransactions, type FilterType, type FilterPeriod } from "@/hooks/useTransactions";
import { TransactionGroup } from "@/components/molecules/TransactionItem";
import { WalletCard } from "@/components/molecules/WalletCard";
import { BrutalButton } from "@/components/atoms/BrutalButton";
import { SlidersHorizontal, TrendingUp, TrendingDown, Wallet, Sparkles, Inbox, AlertTriangle} from "lucide-react";
import { useBudgetProgress } from "@/hooks/useBudgetProgress";
import { formatIDR, cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { type Transaction } from "@/db/db";
// import CloudSyncButton from "@/components/molecules/CloudSyncButton";


// ─── Filter Drawer ────────────────────────────────────────────────────────────

const TYPE_OPTIONS: { label: string; value: FilterType }[] = [
  { label: "Semua", value: "all" },
  { label: "Pemasukan", value: "income" },
  { label: "Pengeluaran", value: "expense" },
];

const PERIOD_OPTIONS: { label: string; value: FilterPeriod }[] = [
  { label: "Hari Ini", value: "day" },
  { label: "Minggu Ini", value: "week" },
  { label: "Bulan Ini", value: "month" },
  { label: "Tahun Ini", value: "year" },
];

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  currentType: FilterType;
  currentPeriod: FilterPeriod;
  onApply: (type: FilterType, period: FilterPeriod) => void;
}

function FilterDrawer({
  open,
  onClose,
  currentType,
  currentPeriod,
  onApply,
}: FilterDrawerProps) {
  const [tempType, setTempType] = useState<FilterType>(currentType);
  const [tempPeriod, setTempPeriod] = useState<FilterPeriod>(currentPeriod);

  // Sync temp state when drawer opens with fresh current props
  useEffect(() => {
    if (open) {
      setTempType(currentType);
      setTempPeriod(currentPeriod);
    }
  }, [open, currentType, currentPeriod]);

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-brutal-black/50"
        onClick={onClose}
      />
      {/* Drawer */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50",
          "border-t-4 border-brutal-black bg-brutal-bg",
          "pb-[calc(var(--safe-bottom)+72px)]",
          "animate-in slide-in-from-bottom duration-200"
        )}
      >
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="h-1.5 w-12 bg-brutal-black" />
        </div>

        <div className="px-4 pb-4">
          <p className="mb-4 text-sm font-black uppercase tracking-wider border-b-2 border-brutal-black pb-2">
            Filter Transaksi
          </p>

          {/* Type Filter */}
          <div className="mb-5">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider opacity-60">
              Tipe
            </p>
            <div className="flex gap-2">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTempType(opt.value)}
                  className={cn(
                    "flex-1 border-2 border-brutal-black px-3 py-2",
                    "text-xs font-bold uppercase tracking-wider brutal-press",
                    tempType === opt.value
                      ? "bg-brutal-black text-brutal-lime shadow-brutal-sm"
                      : "bg-brutal-white text-brutal-black shadow-brutal-sm"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Period Filter */}
          <div className="mb-5">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider opacity-60">
              Periode
            </p>
            <div className="grid grid-cols-2 gap-2">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTempPeriod(opt.value)}
                  className={cn(
                    "border-2 border-brutal-black px-3 py-2",
                    "text-xs font-bold uppercase tracking-wider brutal-press",
                    tempPeriod === opt.value
                      ? "bg-brutal-black text-brutal-lime shadow-brutal-sm"
                      : "bg-brutal-white text-brutal-black shadow-brutal-sm"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <BrutalButton
            variant="primary"
            size="md"
            fullWidth
            onClick={() => onApply(tempType, tempPeriod)}
          >
            Terapkan Filter
          </BrutalButton>
        </div>
      </div>
    </>
  );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: string;
  icon: typeof Wallet;
  bgColor: string;
}

function MetricCard({ label, value, icon: Icon, bgColor }: MetricCardProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col border-2 border-brutal-black p-3 shadow-brutal-sm",
        bgColor
      )}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={12} strokeWidth={2.5} />
        <span className="text-[10px] font-bold uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-sm font-black leading-tight">{value}</p>
    </div>
  );
}

// ─── HomeScreen ───────────────────────────────────────────────────────────────

export function HomeScreen() {
  const { user } = useAuth();
  const { wallets, totalBalance, incomeTotal, expenseTotal } = useWallets();
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("month");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { grouped } = useTransactions(filterType, filterPeriod);
  const { progresses } = useBudgetProgress();
  const alertProgresses = progresses.filter((p) => p.status === "warning" || p.status === "critical");

  const firstName = user?.name?.split(" ")[0] ?? "Kamu";

  function handleTransactionClick(tx: Transaction) {
    navigate(`/transaction/${tx.id}`);
  }

  return (
    <div className="flex flex-col min-h-full bg-brutal-bg pb-20">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        className={cn(
          "border-b-4 border-brutal-black bg-brutal-black px-4",
          "pt-[calc(var(--safe-top)+16px)] pb-4"
        )}
      >
        {/* Greeting */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brutal-lime/70">
              Selamat Datang,
            </p>
            <h1 className="text-2xl font-black text-white leading-tight">
              {firstName}
            </h1>
          </div>
          {/* Action buttons: Sync + Chatbot + Filter */}
          <div className="flex items-center gap-2">
            {/* Sync indicator */}

            {/* <CloudSyncButton /> */}
            

            {/* AI Chatbot button */}
            <button
              id="home-chatbot-btn"
              onClick={() => navigate("/ai-chat")}
              className={cn(
                "flex h-10 w-10 items-center justify-center",
                "border-2 border-brutal-purple bg-brutal-purple brutal-press",
                "shadow-brutal-sm"
              )}
              aria-label="Buka asisten AI"
            >
              <Sparkles size={16} strokeWidth={2.5} className="text-white" />
            </button>

            {/* Filter button */}
            <button
              id="home-filter-btn"
              onClick={() => setDrawerOpen(true)}
              className={cn(
                "flex h-10 w-10 items-center justify-center",
                "border-2 border-brutal-lime bg-transparent brutal-press"
              )}
              aria-label="Buka filter transaksi"
            >
              <SlidersHorizontal size={18} strokeWidth={2.5} className="text-brutal-lime" />
            </button>
          </div>
        </div>

        {/* Total Balance Card */}
        <div className="border-2 border-brutal-lime bg-brutal-lime p-4 shadow-brutal-md">
          <p className="text-[10px] font-bold uppercase tracking-widest text-brutal-black/60 mb-1">
            Total Saldo Semua Dompet
          </p>
          <p className="text-3xl font-black text-brutal-black leading-none">
            {formatIDR(totalBalance)}
          </p>
        </div>
      </div>

      {/* ── Metric Row ──────────────────────────────────────────────────────── */}
      <div className="flex gap-0 border-b-2 border-brutal-black divide-x-2 divide-brutal-black">
        <MetricCard
          label="Pemasukan"
          value={formatIDR(incomeTotal)}
          icon={TrendingUp}
          bgColor="bg-brutal-emerald"
        />
        <MetricCard
          label="Pengeluaran"
          value={formatIDR(expenseTotal)}
          icon={TrendingDown}
          bgColor="bg-brutal-rose"
        />
      </div>

      {/* ── Budget Alerts ────────────────────────────────────────────────────── */}
      {alertProgresses.length > 0 && (
        <div className="border-b-2 border-brutal-black divide-y-2 divide-brutal-black">
          {alertProgresses.map((p) => (
            <button
              key={p.budget.id}
              onClick={() => {
                navigate("/statistics");
              }}
              className={cn(
                "w-full px-4 py-3 flex items-center justify-between brutal-press text-left",
                p.status === "critical" ? "bg-brutal-rose" : "bg-brutal-yellow"
              )}
            >
              <div className="flex items-center gap-2 text-brutal-black">
                <AlertTriangle size={18} strokeWidth={3} />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Anggaran {p.budget.name || p.categories[0]?.name || "Kustom"} {p.status === "critical" ? "Kritis" : "Hampir Habis"}
                </span>
              </div>
              <span className="text-sm font-black text-brutal-black">
                {p.percentage.toFixed(0)}%
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ── Wallet Horizontal Scroll ─────────────────────────────────────────── */}
      {wallets.length > 0 && (
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
      )}

      {/* ── Recent Transactions ──────────────────────────────────────────────── */}
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
          <div className="flex flex-col items-center justify-center flex-1 py-16 px-6">
            <div className="border-4 border-brutal-black bg-brutal-yellow p-6 shadow-brutal-lg mb-4">
              <Inbox size={48} strokeWidth={2.5} className="mx-auto text-brutal-black/80" />
            </div>
            <p className="text-sm font-black uppercase tracking-wider text-center">
              Belum Ada Transaksi
            </p>
            <p className="text-xs text-brutal-black/50 text-center mt-1 font-medium">
              Tekan tombol + untuk menambah transaksi baru.
            </p>
          </div>
        ) : (
          <div className="flex flex-col border-b-2 border-brutal-black divide-y-2 divide-brutal-black">
            {grouped.map((group) => (
              <TransactionGroup
                key={group.date}
                label={group.label}
                items={group.items}
                onItemClick={handleTransactionClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Filter Drawer ────────────────────────────────────────────────────── */}
      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        currentType={filterType}
        currentPeriod={filterPeriod}
        onApply={(type, period) => {
          setFilterType(type);
          setFilterPeriod(period);
          setDrawerOpen(false);
        }}
      />
    </div>
  );
}
