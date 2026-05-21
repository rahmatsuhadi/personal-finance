import { useState, useEffect } from "react";
import { liveQuery } from "dexie";
import { db, type Transaction } from "@/db/db";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { id as idLocale } from "date-fns/locale";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatIDR(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

// ─── SVG Pie Chart ────────────────────────────────────────────────────────────
// Custom pure-SVG donut/pie chart — Neo-Brutalism style with black stroke

const CHART_COLORS = [
  "#c8f135", // lime
  "#00d4ff", // cyan
  "#ffd60a", // yellow
  "#ff4db8", // pink
  "#a855f7", // purple
  "#00c47a", // emerald
  "#ff4d4d", // rose
  "#ff8c00", // orange
  "#3b82f6", // blue
];

interface PieSlice {
  label: string;
  value: number;
  color: string;
  percentage: number;
}

interface SvgPieChartProps {
  slices: PieSlice[];
  activeIndex: number | null;
  onSliceClick: (index: number) => void;
  size?: number;
}

function SvgPieChart({ slices, activeIndex, onSliceClick, size = 220 }: SvgPieChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 16;      // outer radius
  const r = R * 0.52;           // inner radius (donut hole)
  const activeR = R + 10;       // expanded outer radius for active slice

  if (slices.length === 0) return null;

  let cumulativeAngle = -Math.PI / 2; // start from top

  function polarToXY(angle: number, radius: number) {
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  }

  function describeArc(
    startAngle: number,
    endAngle: number,
    outerR: number,
    innerR: number
  ): string {
    const start = polarToXY(startAngle, outerR);
    const end = polarToXY(endAngle, outerR);
    const startInner = polarToXY(startAngle, innerR);
    const endInner = polarToXY(endAngle, innerR);
    const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

    return [
      `M ${start.x} ${start.y}`,
      `A ${outerR} ${outerR} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
      `L ${endInner.x} ${endInner.y}`,
      `A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${startInner.x} ${startInner.y}`,
      "Z",
    ].join(" ");
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((slice, i) => {
        const angle = (slice.percentage / 100) * 2 * Math.PI;
        const startAngle = cumulativeAngle;
        const endAngle = cumulativeAngle + angle;
        cumulativeAngle = endAngle;

        const isActive = activeIndex === i;
        const outerR = isActive ? activeR : R;

        const d = describeArc(startAngle, endAngle, outerR, r);

        return (
          <path
            key={i}
            d={d}
            fill={slice.color}
            stroke="#0a0a0a"
            strokeWidth={isActive ? 3 : 2}
            style={{ cursor: "pointer", transition: "d 120ms ease" }}
            onClick={() => onSliceClick(i)}
          />
        );
      })}

      {/* Center hole label */}
      <circle cx={cx} cy={cy} r={r - 4} fill="#f5f0e8" stroke="#0a0a0a" strokeWidth={2} />
      <text
        x={cx}
        y={cy - 8}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#0a0a0a"
        fontSize="10"
        fontWeight="800"
        fontFamily="Inter, sans-serif"
        style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}
      >
        {activeIndex !== null ? slices[activeIndex].label.split(" ")[0] : "TOTAL"}
      </text>
      <text
        x={cx}
        y={cy + 10}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#0a0a0a"
        fontSize="10"
        fontWeight="900"
        fontFamily="Inter, sans-serif"
      >
        {activeIndex !== null
          ? `${slices[activeIndex].percentage.toFixed(1)}%`
          : `${slices.length} kat`}
      </text>
    </svg>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

interface SummaryCardProps {
  label: string;
  value: string;
  bgColor: string;
}

function SummaryCard({ label, value, bgColor }: SummaryCardProps) {
  return (
    <div className={cn("flex flex-col border-2 border-brutal-black p-3 shadow-brutal-sm", bgColor)}>
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</p>
      <p className="text-sm font-black leading-tight mt-0.5">{value}</p>
    </div>
  );
}

// ─── Period type ──────────────────────────────────────────────────────────────

type Period = "month" | "year";

// ─── StatisticsScreen ─────────────────────────────────────────────────────────

export function StatisticsScreen() {
  const now = new Date();
  const [period, setPeriod] = useState<Period>("month");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Date range based on period
  const fromDate =
    period === "month"
      ? format(startOfMonth(now), "yyyy-MM-dd")
      : format(startOfYear(now), "yyyy-MM-dd");
  const toDate =
    period === "month"
      ? format(endOfMonth(now), "yyyy-MM-dd")
      : format(endOfYear(now), "yyyy-MM-dd");

  const periodLabel =
    period === "month"
      ? format(now, "MMMM yyyy", { locale: idLocale })
      : format(now, "yyyy");

  useEffect(() => {
    const sub = liveQuery(() =>
      db.transactions
        .where("date")
        .between(fromDate, toDate, true, true)
        .toArray()
    ).subscribe({
      next: (data) => {
        setTransactions(data);
        setActiveIndex(null);
      },
      error: () => {},
    });
    return () => sub.unsubscribe();
  }, [fromDate, toDate]);

  // ── Aggregate ───────────────────────────────────────────────────────────────
  const incomeTotal = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expenseTotal = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const netBalance = incomeTotal - expenseTotal;

  // Expense by category
  const categoryMap = new Map<string, number>();
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      categoryMap.set(t.category, (categoryMap.get(t.category) ?? 0) + t.amount);
    });

  const slices: PieSlice[] = Array.from(categoryMap.entries())
    .sort(([, a], [, b]) => b - a)
    .map(([label, value], i) => ({
      label,
      value,
      color: CHART_COLORS[i % CHART_COLORS.length],
      percentage: expenseTotal > 0 ? (value / expenseTotal) * 100 : 0,
    }));

  function handleSliceClick(i: number) {
    setActiveIndex(activeIndex === i ? null : i);
  }

  // Dynamic label below chart
  const chartLabel =
    activeIndex !== null
      ? `${slices[activeIndex].label}: ${formatIDR(slices[activeIndex].value)} (${slices[activeIndex].percentage.toFixed(1)}%)`
      : `Total Pengeluaran: ${formatIDR(expenseTotal)}`;

  return (
    <div
      className="flex flex-col min-h-full bg-brutal-bg pb-24"
      style={{ paddingTop: "var(--safe-top)" }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="border-b-4 border-brutal-black bg-brutal-purple px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black uppercase tracking-tight text-white">
            Statistik
          </h1>
          <p className="text-xs font-bold text-white/70 uppercase tracking-wider">
            {periodLabel}
          </p>
        </div>
      </div>

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

      {/* ── Pie Chart Section ────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center px-4 py-6 border-b-2 border-brutal-black">
        <div className="flex items-center gap-2 mb-4 self-start">
          <div className="h-3 w-3 bg-brutal-black border border-brutal-black" />
          <p className="text-xs font-black uppercase tracking-wider">
            Pengeluaran per Kategori
          </p>
        </div>

        {slices.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8">
            <p className="text-3xl">📊</p>
            <p className="text-xs font-bold uppercase text-brutal-black/40 text-center">
              Belum ada data pengeluaran
            </p>
          </div>
        ) : (
          <>
            {/* SVG Chart */}
            <div className="border-2 border-brutal-black shadow-brutal-md p-2 bg-brutal-white mb-4">
              <SvgPieChart
                slices={slices}
                activeIndex={activeIndex}
                onSliceClick={handleSliceClick}
                size={220}
              />
            </div>

            {/* Dynamic Label */}
            <div className="border-2 border-brutal-black bg-brutal-yellow px-4 py-2 shadow-brutal-sm w-full text-center">
              <p className="text-xs font-black uppercase tracking-wider">
                {chartLabel}
              </p>
            </div>
          </>
        )}
      </div>

      {/* ── Category Legend List ─────────────────────────────────────────────── */}
      {slices.length > 0 && (
        <div className="px-4 pt-4">
          <p className="text-xs font-black uppercase tracking-wider mb-3 opacity-60">
            Rincian Kategori
          </p>
          <div className="flex flex-col border-2 border-brutal-black divide-y-2 divide-brutal-black bg-brutal-white shadow-brutal-md">
            {slices.map((s, i) => (
              <button
                key={s.label}
                onClick={() => handleSliceClick(i)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-left brutal-press",
                  activeIndex === i ? "bg-brutal-black" : "bg-transparent"
                )}
              >
                {/* Color swatch */}
                <div
                  className="h-4 w-4 shrink-0 border-2 border-brutal-black"
                  style={{ backgroundColor: s.color }}
                />

                {/* Label */}
                <span
                  className={cn(
                    "flex-1 text-sm font-bold",
                    activeIndex === i ? "text-brutal-lime" : "text-brutal-black"
                  )}
                >
                  {s.label}
                </span>

                {/* Amount */}
                <span
                  className={cn(
                    "text-sm font-black",
                    activeIndex === i ? "text-white" : "text-brutal-black"
                  )}
                >
                  {formatIDR(s.value)}
                </span>

                {/* Percentage */}
                <span
                  className={cn(
                    "text-xs font-bold w-10 text-right",
                    activeIndex === i ? "text-brutal-lime/70" : "text-brutal-black/40"
                  )}
                >
                  {s.percentage.toFixed(0)}%
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
