import { useState, useEffect } from "react";
import { BrutalButton } from "@/components/atoms/BrutalButton";
import { cn } from "@/lib/utils";
import type { FilterType, FilterPeriod } from "@/hooks/useTransactions";

// ─── Filter Drawer Organism ───────────────────────────────────────────────────

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

export interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  currentType: FilterType;
  currentPeriod: FilterPeriod;
  onApply: (type: FilterType, period: FilterPeriod) => void;
}

export function FilterDrawer({
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
