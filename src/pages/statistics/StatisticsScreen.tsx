import { useState } from "react";
import { cn, formatIDR } from "@/lib/utils";
import { BarChart3, Target } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useBudgetProgress } from "@/hooks/useBudgetProgress";
import { BrutalProgressBar, EmptyState } from "@/components/atoms";
import { SummaryCard } from "@/components/molecules";
import { CategoryChartSection } from "@/components/organisms";
import { MainPageTemplate } from "@/components/templates";
import { useNavigate } from "react-router-dom";
import { useStatisticsData, type Period } from "@/hooks/useStatisticsData";





// ─── StatisticsScreen ─────────────────────────────────────────────────────────

export function StatisticsScreen() {
  const [period, setPeriod] = useState<Period>("month");
  const {
    transactions,
    periodLabel,
    incomeTotal,
    expenseTotal,
    netBalance,
    slices,
  } = useStatisticsData(period);

  const [viewMode, setViewMode] = useState<"category" | "budget">("category");
  const { progresses } = useBudgetProgress();
  const navigate = useNavigate();



  return (
    <MainPageTemplate
      title="Statistik"
      headerActions={
        <p className="text-xs font-bold text-white/70 uppercase tracking-wider">
          {periodLabel}
        </p>
      }
      headerBg="bg-brutal-purple"
      bottomPadding="large"
    >
      {/* ── Period Selector ──────────────────────────────────────────────────── */}
      <div className="flex border-b-2 border-brutal-black divide-x-2 divide-brutal-black">
        {(["month", "year"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              "flex-1 py-2.5 text-xs font-black uppercase tracking-wider brutal-press",
              period === p
                ? "bg-brutal-black text-brutal-lime"
                : "bg-brutal-white text-brutal-black"
            )}
          >
            {p === "month" ? "Bulan Ini" : "Tahun Ini"}
          </button>
        ))}
      </div>

      {/* ── Summary Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-0 border-b-2 border-brutal-black divide-x-0">
        <div className="grid grid-rows-2 divide-y-2 divide-brutal-black border-r-2 border-brutal-black">
          <SummaryCard
            label="Total Pemasukan"
            value={formatIDR(incomeTotal)}
            bgColor="bg-brutal-emerald"
          />
          <SummaryCard
            label="Total Pengeluaran"
            value={formatIDR(expenseTotal)}
            bgColor="bg-brutal-rose"
          />
        </div>
        <div className="grid grid-rows-2 divide-y-2 divide-brutal-black">
          <SummaryCard
            label="Saldo Bersih"
            value={formatIDR(netBalance)}
            bgColor={netBalance >= 0 ? "bg-brutal-lime" : "bg-brutal-yellow"}
          />
          <SummaryCard
            label="Total Transaksi"
            value={`${transactions.length} transaksi`}
            bgColor="bg-brutal-white"
          />
        </div>
      </div>

      {/* ── View Toggle ──────────────────────────────────────────────────────── */}
      <div className="flex border-b-2 border-brutal-black divide-x-2 divide-brutal-black bg-brutal-bg sticky top-[48px] z-10">
        <button
          onClick={() => setViewMode("category")}
          className={cn(
            "flex-1 py-3 text-sm font-black uppercase tracking-wider brutal-press flex items-center justify-center gap-2",
            viewMode === "category"
              ? "bg-brutal-black text-white"
              : "bg-brutal-bg text-brutal-black"
          )}
        >
          <BarChart3 size={16} strokeWidth={2.5} />
          Grafik Kategori
        </button>
        <button
          onClick={() => setViewMode("budget")}
          className={cn(
            "flex-1 py-3 text-sm font-black uppercase tracking-wider brutal-press flex items-center justify-center gap-2",
            viewMode === "budget"
              ? "bg-brutal-black text-white"
              : "bg-brutal-bg text-brutal-black"
          )}
        >
          <Target size={16} strokeWidth={2.5} />
          Pantau Anggaran
        </button>
      </div>

      {viewMode === "category" ? (
        <CategoryChartSection
          slices={slices}
          expenseTotal={expenseTotal}
        />
      ) : (
        <div className="px-4 pt-6">
          <p className="text-xs font-black uppercase tracking-wider mb-4 opacity-60">
            Status Anggaran
          </p>
          {progresses.length === 0 ? (
            <EmptyState
              icon={Target}
              title="Belum ada anggaran"
              description="Pantau batas pengeluaran dengan menambahkan anggaran baru."
              bgColor="bg-brutal-orange"
            />
          ) : (
            <div className="flex flex-col gap-4">
              {progresses.map((p) => {
                const firstCat = p.categories[0];
                const IconComp = firstCat && LucideIcons[firstCat.icon as keyof typeof LucideIcons] as React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
                return (
                  <button
                    key={p.budget.id}
                    onClick={() => navigate(`/budgets/${p.budget.id}`)}
                    className="flex flex-col gap-2 p-3 border-2 border-brutal-black bg-brutal-white shadow-brutal-sm brutal-press text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn("h-8 w-8 flex items-center justify-center border-2 border-brutal-black", firstCat?.colorClass ? `bg-${firstCat.colorClass}` : "bg-brutal-yellow")}>
                          {IconComp && <IconComp size={14} strokeWidth={2.5} className="text-white" />}
                        </div>
                        <div className="flex flex-col">
                           <span className="text-sm font-bold truncate">{p.budget.name || firstCat?.name || "Anggaran"}</span>
                           {p.categories.length > 1 && (
                             <span className="text-[9px] uppercase tracking-wider font-bold opacity-60">
                               {p.categories.length} Kategori
                             </span>
                           )}
                        </div>
                      </div>
                      <span className="text-xs font-black">
                        {p.percentage.toFixed(0)}%
                      </span>
                    </div>
                    
                    <BrutalProgressBar percentage={p.percentage} status={p.status} />
                    
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider opacity-70">
                      <span>{formatIDR(p.spent)}</span>
                      <span>Target: {formatIDR(p.budget.amount)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </MainPageTemplate>
  );
}
