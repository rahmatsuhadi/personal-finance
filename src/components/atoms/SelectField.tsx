import { type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── SelectField Atom ─────────────────────────────────────────────────────────
// Tappable field yang terlihat seperti input, tapi saat diklik membuka
// SelectPickerScreen melalui stack navigation.

interface SelectFieldProps {
  id: string;
  label: string;
  placeholder?: string;
  value?: string;
  /** Sublabel kecil di bawah value (e.g. saldo wallet) */
  valueHint?: string;
  /** Strip warna kiri sebagai visual indicator */
  accentColor?: string;
  error?: string;
  onClick: () => void;
  /** Optional leading node (icon/dot) */
  leading?: ReactNode;
  disabled?: boolean;
}

export function SelectField({
  id,
  label,
  placeholder = "Ketuk untuk memilih...",
  value,
  valueHint,
  accentColor,
  error,
  onClick,
  leading,
  disabled = false,
}: SelectFieldProps) {
  const hasValue = Boolean(value);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {/* Label */}
      <label
        htmlFor={id}
        className="text-xs font-bold uppercase tracking-wider text-brutal-black"
      >
        {label}
      </label>

      {/* Tappable Field */}
      <button
        id={id}
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "flex w-full items-center gap-3 border-2 border-brutal-black bg-brutal-white",
          "px-4 py-3 text-left shadow-brutal-md",
          "brutal-press transition-all duration-75",
          "focus:outline-none active:shadow-brutal-sm",
          error && "border-brutal-rose",
          disabled && "opacity-50 pointer-events-none"
        )}
      >
        {/* Accent Color Strip */}
        {accentColor && (
          <div
            className="h-6 w-1.5 shrink-0 border border-brutal-black"
            style={{ backgroundColor: accentColor }}
          />
        )}

        {/* Leading slot */}
        {leading && (
          <span className="shrink-0 text-brutal-black/50">{leading}</span>
        )}

        {/* Value or Placeholder */}
        <span
          className={cn(
            "flex-1 min-w-0 text-sm font-medium",
            hasValue ? "text-brutal-black" : "text-brutal-black/40"
          )}
        >
          {hasValue ? (
            <span className="flex flex-col">
              <span className="font-bold">{value}</span>
              {valueHint && (
                <span className="text-[11px] text-brutal-black/50 font-normal mt-0.5">
                  {valueHint}
                </span>
              )}
            </span>
          ) : (
            placeholder
          )}
        </span>

        {/* Chevron */}
        <ChevronRight
          size={16}
          strokeWidth={2.5}
          className="shrink-0 text-brutal-black/40"
        />
      </button>

      {/* Error */}
      {error && (
        <p className="text-xs font-bold text-brutal-rose">{error}</p>
      )}
    </div>
  );
}
