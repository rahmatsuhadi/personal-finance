import { cn } from "@/lib/utils";

interface AmountInputProps {
  amount: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export function AmountInput({
  amount,
  onChange,
  error,
  disabled,
}: AmountInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor="tx-amount"
        className="text-xs font-bold uppercase tracking-wider text-brutal-black"
      >
        Nominal (Rp)
      </label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-brutal-black/50">
          Rp
        </span>
        <input
          id="tx-amount"
          type="text"
          inputMode="numeric"
          placeholder="0"
          value={amount}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={cn(
            "w-full border-2 border-brutal-black bg-brutal-white pl-10 pr-4 py-3",
            "text-sm font-medium shadow-brutal-md outline-none",
            "focus:shadow-brutal-sm focus:translate-x-[2px] focus:translate-y-[2px] transition-all duration-75",
            error && "border-brutal-rose",
            disabled && "bg-brutal-black/5 opacity-80 cursor-not-allowed"
          )}
        />
      </div>
      {error && (
        <p className="text-xs font-bold text-brutal-rose">{error}</p>
      )}
    </div>
  );
}
