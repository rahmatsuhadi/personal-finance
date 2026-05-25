import { useState, useEffect } from "react";
import { cn, formatIDR } from "@/lib/utils";
import { BarChart3 } from "lucide-react";
import { EmptyState } from "@/components/atoms";

export interface PieSlice {
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

function SvgPieChart({
  slices,
  activeIndex,
  onSliceClick,
  size = 220,
}: SvgPieChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 16; // outer radius
  const r = R * 0.52; // inner radius (donut hole)
  const activeR = R + 10; // expanded outer radius for active slice

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
      <circle
        cx={cx}
        cy={cy}
        r={r - 4}
        fill="#f5f0e8"
        stroke="#0a0a0a"
        strokeWidth={2}
      />
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

export interface CategoryChartSectionProps {
  slices: PieSlice[];
  expenseTotal: number;
}

export function CategoryChartSection({
  slices,
  expenseTotal,
}: CategoryChartSectionProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Reset active slice when slices change
  useEffect(() => {
    setActiveIndex(null);
  }, [slices]);

  function handleSliceClick(i: number) {
    setActiveIndex(activeIndex === i ? null : i);
  }

  const chartLabel =
    activeIndex !== null
      ? `${slices[activeIndex].label}: ${formatIDR(slices[activeIndex].value)} (${slices[activeIndex].percentage.toFixed(1)}%)`
      : `Total Pengeluaran: ${formatIDR(expenseTotal)}`;

  return (
    <>
      <div className="flex flex-col items-center px-4 py-6 border-b-2 border-brutal-black">
        <div className="flex items-center gap-2 mb-4 self-start">
          <div className="h-3 w-3 bg-brutal-black border border-brutal-black" />
          <p className="text-xs font-black uppercase tracking-wider">
            Pengeluaran per Kategori
          </p>
        </div>

        {slices.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="Belum ada data pengeluaran"
            description="Tambahkan transaksi pengeluaran untuk melihat grafik rincian kategori."
            bgColor="bg-brutal-purple"
            className="w-full"
          />
        ) : (
          <>
            <div className="border-2 border-brutal-black shadow-brutal-md p-2 bg-brutal-white mb-4">
              <SvgPieChart
                slices={slices}
                activeIndex={activeIndex}
                onSliceClick={handleSliceClick}
                size={220}
              />
            </div>

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
                <div
                  className="h-4 w-4 shrink-0 border-2 border-brutal-black"
                  style={{ backgroundColor: s.color }}
                />
                <span
                  className={cn(
                    "flex-1 text-sm font-bold",
                    activeIndex === i ? "text-brutal-lime" : "text-brutal-black"
                  )}
                >
                  {s.label}
                </span>
                <span
                  className={cn(
                    "text-sm font-black",
                    activeIndex === i ? "text-white" : "text-brutal-black"
                  )}
                >
                  {formatIDR(s.value)}
                </span>
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
    </>
  );
}
