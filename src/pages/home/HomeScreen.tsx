import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  SlidersHorizontal, 
  TrendingUp, 
  TrendingDown, 
  Sparkles
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useWallets } from "@/hooks/useWallets";
import { useTransactions, type FilterType, type FilterPeriod } from "@/hooks/useTransactions";
import { useBudgetProgress } from "@/hooks/useBudgetProgress";

import { formatIDR } from "@/lib/utils";
import { type Transaction } from "@/db/db";

import { 
  MetricCard, 
  BudgetAlertBanner, 
  TotalBalanceCard
} from "@/components/molecules";
import { 
  FilterDrawer, 
  WalletHorizontalList, 
  TransactionHistorySection 
} from "@/components/organisms";
import { MainPageTemplate } from "@/components/templates";

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
    <MainPageTemplate
      title={firstName}
      headerSubtitle="Selamat Datang,"
      headerActions={
        <div className="flex items-center gap-2">
          {/* AI Chatbot button */}
          <button
            id="home-chatbot-btn"
            onClick={() => navigate("/ai-chat")}
            className="flex h-10 w-10 items-center justify-center border-2 border-brutal-purple bg-brutal-purple brutal-press shadow-brutal-sm"
            aria-label="Buka asisten AI"
          >
            <Sparkles size={16} strokeWidth={2.5} className="text-white" />
          </button>

          {/* Filter button */}
          <button
            id="home-filter-btn"
            onClick={() => setDrawerOpen(true)}
            className="flex h-10 w-10 items-center justify-center border-2 border-brutal-lime bg-transparent brutal-press"
            aria-label="Buka filter transaksi"
          >
            <SlidersHorizontal size={18} strokeWidth={2.5} className="text-brutal-lime" />
          </button>
        </div>
      }
      topSection={<TotalBalanceCard balance={totalBalance} />}
    >
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
            <BudgetAlertBanner
              key={p.budget.id}
              budgetLabel={p.budget.name || p.categories[0]?.name || "Kustom"}
              status={p.status as "critical" | "warning"}
              percentage={p.percentage}
              onClick={() => navigate("/statistics")}
            />
          ))}
        </div>
      )}

      {/* ── Wallet Horizontal Scroll ─────────────────────────────────────────── */}
      <WalletHorizontalList wallets={wallets} />

      {/* ── Recent Transactions ──────────────────────────────────────────────── */}
      <TransactionHistorySection
        grouped={grouped}
        filterPeriod={filterPeriod}
        filterType={filterType}
        onTransactionClick={handleTransactionClick}
      />

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
    </MainPageTemplate>
  );
}
