import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/atoms/AppHeader";
import { useBudgetProgress, } from "@/hooks/useBudgetProgress";
import { formatIDR, cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { liveQuery } from "dexie";
import { db, type Transaction } from "@/db/db";
import {
  startOfMonth, endOfMonth, subMonths,
  startOfWeek, endOfWeek, subWeeks,
  startOfYear, endOfYear, subYears,
  format
} from "date-fns";
import { id as idLocale } from "date-fns/locale";
import * as LucideIcons from "lucide-react";

export function BudgetDetailScreen() {
  const navigate = useNavigate();
  const { id } = useParams();

  // Ambil semua progress, dan cari yang cocok dengan id anggaran
  const { progresses } = useBudgetProgress();
  const progress = progresses.find((p) => p.budget.id === id) || null;

  const [historyData, setHistoryData] = useState<any[]>([]);
  const [currentTransactions, setCurrentTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!progress) return;

    // Fetch past 5 periods as historical trend
    const subHistory = liveQuery(async () => {
      const results = [];
      const categoryNames = progress.categories.map(c => c.name);

      const txs = await db.transactions
        .where("category")
        .anyOf(categoryNames)
        .toArray();

      for (let i = 4; i >= 0; i--) {
        let label = "";
        let startDate: Date;
        let endDate: Date;
        const now = new Date();

        if (progress.budget.cycle === "weekly") {
          const d = subWeeks(now, i);
          startDate = startOfWeek(d, { weekStartsOn: 1 });
          endDate = endOfWeek(d, { weekStartsOn: 1 });
          label = `W${format(d, "w")}`;
        } else if (progress.budget.cycle === "yearly") {
          const d = subYears(now, i);
          startDate = startOfYear(d);
          endDate = endOfYear(d);
          label = format(d, "yyyy");
        } else {
          // monthly default
          const d = subMonths(now, i);
          startDate = startOfMonth(d);
          endDate = endOfMonth(d);
          label = format(d, "MMM", { locale: idLocale });
        }

        const startStr = format(startDate, "yyyy-MM-dd");
        const endStr = format(endDate, "yyyy-MM-dd");

        const total = txs
          .filter(t => t.type === "expense" && t.date >= startStr && t.date <= endStr)
          .reduce((sum, t) => sum + t.amount, 0);

        results.push({
          name: label,
          amount: total,
        });
      }
      return results;
    }).subscribe({
      next: (data) => setHistoryData(data),
      error: () => { },
    });

    // Fetch transactions for the current active period
    const subTxs = liveQuery(async () => {
      let startDate: Date;
      let endDate: Date;
      const now = new Date();

      if (progress.budget.cycle === "weekly") {
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        endDate = endOfWeek(now, { weekStartsOn: 1 });
      } else if (progress.budget.cycle === "yearly") {
        startDate = startOfYear(now);
        endDate = endOfYear(now);
      } else {
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
      }

      const startStr = format(startDate, "yyyy-MM-dd");
      const endStr = format(endDate, "yyyy-MM-dd");

      const categoryNames = progress.categories.map(c => c.name);

      const txs = await db.transactions
        .where("category")
        .anyOf(categoryNames)
        .toArray();

      return txs
        .filter(t => t.type === "expense" && t.date >= startStr && t.date <= endStr)
        .sort((a, b) => b.date.localeCompare(a.date));
    }).subscribe({
      next: (data) => setCurrentTransactions(data),
      error: () => { },
    });

    return () => {
      subHistory.unsubscribe();
      subTxs.unsubscribe();
    };
  }, [progress]);

  if (!progress) {
    return (
      <div className="flex flex-col h-full bg-brutal-bg" style={{ paddingTop: "var(--safe-top)" }}>
        <AppHeader title="Detail Anggaran" bgColor="bg-brutal-bg" onBack={() => navigate(-1)} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm font-bold opacity-60">Memuat data anggaran...</p>
        </div>
      </div>
    );
  }

  let cycleLabel = "";
  let dateRange = "";
  const now = new Date();

  if (progress.budget.cycle === "weekly") {
    cycleLabel = "Mingguan";
    dateRange = `${format(startOfWeek(now, { weekStartsOn: 1 }), "dd MMM", { locale: idLocale })} - ${format(endOfWeek(now, { weekStartsOn: 1 }), "dd MMM", { locale: idLocale })}`;
  } else if (progress.budget.cycle === "yearly") {
    cycleLabel = "Tahunan";
    dateRange = format(now, "yyyy");
  } else {
    cycleLabel = "Bulanan";
    dateRange = format(now, "MMMM yyyy", { locale: idLocale });
  }

  const budgetName = progress.budget.name || progress.categories[0]?.name || "Anggaran";

  return (
    <div className="flex flex-col h-full bg-brutal-bg" style={{ paddingTop: "var(--safe-top)" }}>
      <AppHeader
        title={`Analitik: ${budgetName}`}
        bgColor="bg-brutal-orange"
        onBack={() => navigate(-1)}
      />

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 pb-24">
        {/* Ringkasan Anggaran */}
        <div className="flex gap-2">
          <div className="flex-1 border-2 border-brutal-black bg-brutal-white p-3 shadow-brutal-sm text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Sisa Anggaran</p>
            <p className="text-sm font-black text-brutal-rose truncate">{formatIDR(progress.remaining)}</p>
          </div>
          <div className="flex-1 border-2 border-brutal-black bg-brutal-white p-3 shadow-brutal-sm text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Batas Aman / Hari</p>
            <p className="text-sm font-black text-brutal-lime truncate">{formatIDR(progress.safeDailyLimit)}</p>
          </div>
        </div>

        {/* Grafik Analitik */}
        <div className="border-2 border-brutal-black bg-brutal-white p-4 shadow-brutal-md">
          <div className="mb-4">
            <p className="text-xs font-black uppercase tracking-wider">
              Histori Pengeluaran (5 Periode)
            </p>
            <p className="text-[10px] font-bold text-brutal-black/60 uppercase tracking-widest mt-1">
              Periode: {cycleLabel} ({dateRange})
            </p>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#000" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: "bold" }} axisLine={{ stroke: '#000', strokeWidth: 2 }} />
                <YAxis tick={{ fontSize: 10, fontWeight: "bold" }} width={60} tickFormatter={(val) => `Rp${val / 1000}k`} axisLine={{ stroke: '#000', strokeWidth: 2 }} />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.1)' }}
                  contentStyle={{ border: '2px solid #000', borderRadius: 0, fontWeight: 'bold' }}
                />
                <Bar dataKey="amount" fill="var(--brutal-blue)" stroke="#000" strokeWidth={2} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daftar Riwayat Transaksi */}
        <div>
          <p className="text-xs font-black uppercase tracking-wider mb-4 opacity-60">
            Riwayat Transaksi Siklus Ini
          </p>

          {currentTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-brutal-black/30">
              <p className="text-xs font-bold text-brutal-black/50 text-center uppercase">
                Tidak ada transaksi
              </p>
            </div>
          ) : (
            <div className="flex flex-col border-2 border-brutal-black divide-y-2 divide-brutal-black bg-brutal-white shadow-brutal-md">
              {currentTransactions.map((tx) => {
                const categoryMatch = progress.categories.find(c => c.name === tx.category);
                const IconComp = categoryMatch?.icon ? (LucideIcons as any)[categoryMatch.icon] : LucideIcons.Tag;

                return (
                  <button
                    key={tx.id}
                    onClick={() => navigate(`/transaction/${tx.id}`)}
                    className="flex w-full items-center gap-3 p-3 text-left brutal-press hover:bg-brutal-bg/50 transition-colors"
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center border-2 border-brutal-black",
                        categoryMatch?.colorClass ? `bg-${categoryMatch.colorClass}` : "bg-brutal-yellow"
                      )}
                    >
                      {IconComp && <IconComp size={16} strokeWidth={2.5} className="text-white" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">
                        {tx.description || tx.category}
                      </p>
                      <p className="text-[10px] font-bold text-brutal-black/60 truncate uppercase">
                        {format(new Date(tx.date), "dd MMM yyyy", { locale: idLocale })}
                        {tx.description && ` • ${tx.category}`}
                      </p>
                    </div>

                    <span className="text-sm font-black text-brutal-rose">
                      - {formatIDR(tx.amount)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
