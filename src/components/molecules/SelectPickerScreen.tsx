import { useState } from "react";
import { AppHeader } from "@/components/atoms/AppHeader";
import { cn } from "@/lib/utils";
import { Search, Check } from "lucide-react";

// ─── Option Type ──────────────────────────────────────────────────────────────

export interface SelectOption {
  label: string;
  value: string;
  /** Optional sublabel di bawah label utama */
  sublabel?: string;
  /** Optional warna blok/badge kiri */
  accentColor?: string;
  /** Optional emoji/icon prefix */
  prefix?: React.ReactNode | string;
}

// ─── SelectPickerScreen ───────────────────────────────────────────────────────

interface SelectPickerScreenProps {
  title: string;
  options: SelectOption[];
  selectedValue?: string;
  onSelect: (value: string, option: SelectOption) => void;
  onClose: () => void;
  /** Apakah membutuhkan search bar */
  searchable?: boolean;
  /** Pesan kosong jika tidak ada opsi */
  emptyMessage?: string;
}

export function SelectPickerScreen({
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
  searchable = false,
  emptyMessage = "Tidak ada pilihan tersedia.",
}: SelectPickerScreenProps) {
  const [query, setQuery] = useState("");

  const filtered = searchable
    ? options.filter((o) =>
        o.label.toLowerCase().includes(query.toLowerCase()) ||
        (o.sublabel ?? "").toLowerCase().includes(query.toLowerCase())
      )
    : options;

  function handleSelect(option: SelectOption) {
    onSelect(option.value, option);
    onClose();
  }

  return (
    <div
      className="flex flex-col h-dvh bg-brutal-bg"
      style={{ paddingTop: "var(--safe-top)" }}
    >
      {/* AppHeader */}
      <AppHeader title={title} onBack={onClose} />


      {/* Search Bar */}
      {searchable && (
        <div className="border-b-2 border-brutal-black p-3">
          <div className="relative">
            <Search
              size={16}
              strokeWidth={2.5}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-brutal-black/40"
            />
            <input
              type="text"
              placeholder="Cari..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className={cn(
                "w-full border-2 border-brutal-black bg-brutal-white",
                "pl-9 pr-4 py-2.5 text-sm font-medium",
                "placeholder:text-brutal-black/40 outline-none",
                "shadow-brutal-sm focus:shadow-none transition-all duration-75"
              )}
            />
          </div>
        </div>
      )}

      {/* Options List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <p className="text-sm font-bold uppercase text-center opacity-40">
              {emptyMessage}
            </p>
          </div>
        ) : (
          <ul className="divide-y-2 divide-brutal-black border-b-2 border-brutal-black">
            {filtered.map((option) => {
              const isSelected = option.value === selectedValue;
              return (
                <li key={option.value}>
                  <button
                    onClick={() => handleSelect(option)}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-4 text-left",
                      "transition-colors brutal-press",
                      isSelected
                        ? "bg-brutal-black text-white"
                        : "bg-brutal-white hover:bg-brutal-bg"
                    )}
                  >
                    {/* Accent color strip / prefix */}
                    {option.accentColor && (
                      <div
                        className="h-10 w-2 shrink-0 border-2 border-brutal-black"
                        style={{ backgroundColor: option.accentColor }}
                      />
                    )}
                    {option.prefix && (
                      <span className="text-xl shrink-0">
                        {option.prefix}
                      </span>
                    )}

                    {/* Label */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm font-bold",
                          isSelected ? "text-brutal-lime" : "text-brutal-black"
                        )}
                      >
                        {option.label}
                      </p>
                      {option.sublabel && (
                        <p
                          className={cn(
                            "text-xs font-medium mt-0.5",
                            isSelected
                              ? "text-white/70"
                              : "text-brutal-black/50"
                          )}
                        >
                          {option.sublabel}
                        </p>
                      )}
                    </div>

                    {/* Checkmark if selected */}
                    {isSelected && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center border-2 border-brutal-lime bg-brutal-lime">
                        <Check
                          size={14}
                          strokeWidth={3}
                          className="text-brutal-black"
                        />
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
