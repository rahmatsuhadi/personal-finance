import { useState } from "react";
import { BrutalButton } from "@/components/atoms/BrutalButton";
import { BrutalInput } from "@/components/atoms/BrutalInput";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import type { Wallet } from "@/db/db";

// ─── Color Options ────────────────────────────────────────────────────────────

const COLOR_OPTIONS: { label: string; value: string; bg: string }[] = [
  { label: "Hijau Lime", value: "brutal-lime", bg: "bg-brutal-lime" },
  { label: "Cyan", value: "brutal-cyan", bg: "bg-brutal-cyan" },
  { label: "Kuning", value: "brutal-yellow", bg: "bg-brutal-yellow" },
  { label: "Pink", value: "brutal-pink", bg: "bg-brutal-pink" },
  { label: "Ungu", value: "brutal-purple", bg: "bg-brutal-purple" },
  { label: "Emerald", value: "brutal-emerald", bg: "bg-brutal-emerald" },
  { label: "Merah", value: "brutal-rose", bg: "bg-brutal-rose" },
  { label: "Orange", value: "brutal-orange", bg: "bg-brutal-orange" },
];

// ─── AddWalletModal ───────────────────────────────────────────────────────────

interface AddWalletModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (wallet: Omit<Wallet, "id" | "updatedAt">) => Promise<void>;
}

export function AddWalletModal({ open, onClose, onSave }: AddWalletModalProps) {
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState<"IDR" | "USD">("IDR");
  const [colorClass, setColorClass] = useState("brutal-lime");
  const [balance, setBalance] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function reset() {
    setName("");
    setCurrency("IDR");
    setColorClass("brutal-lime");
    setBalance("");
    setErrors({});
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSave() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Nama dompet wajib diisi.";
    const balanceNum = parseFloat(balance.replace(/[,.]/g, "")) || 0;
    if (balanceNum < 0) errs.balance = "Saldo tidak boleh negatif.";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsLoading(true);
    try {
      await onSave({
        name: name.trim(),
        currency,
        colorClass,
        balance: balanceNum,
      });
      reset();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-brutal-black/60"
        onClick={handleClose}
      />
      {/* Bottom Sheet */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50",
          "border-t-4 border-brutal-black bg-brutal-bg",
          "pb-[calc(var(--safe-bottom)+16px)]",
          "animate-in slide-in-from-bottom duration-200"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-brutal-black px-4 py-3">
          <h2 className="text-base font-black uppercase tracking-wider">
            Tambah Dompet
          </h2>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center border-2 border-brutal-black bg-brutal-white shadow-brutal-sm brutal-press"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>

        <div className="px-4 pt-4 flex flex-col gap-4 max-h-[75vh] overflow-y-auto pb-4">
          {/* Nama Dompet */}
          <BrutalInput
            id="wallet-name"
            label="Nama Dompet"
            placeholder="cth. Kas, BCA, OVO..."
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((p) => ({ ...p, name: "" }));
            }}
            error={errors.name}
          />

          {/* Saldo Awal */}
          <BrutalInput
            id="wallet-balance"
            label="Saldo Awal"
            placeholder="0"
            type="number"
            inputMode="numeric"
            value={balance}
            onChange={(e) => {
              setBalance(e.target.value);
              if (errors.balance) setErrors((p) => ({ ...p, balance: "" }));
            }}
            error={errors.balance}
          />

          {/* Currency */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider">
              Mata Uang
            </label>
            <div className="flex gap-2">
              {(["IDR", "USD"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={cn(
                    "flex-1 border-2 border-brutal-black py-2.5 text-sm font-black uppercase brutal-press",
                    currency === c
                      ? "bg-brutal-black text-brutal-lime shadow-brutal-sm"
                      : "bg-brutal-white text-brutal-black shadow-brutal-sm"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider">
              Warna Kartu
            </label>
            <div className="grid grid-cols-4 gap-2">
              {COLOR_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setColorClass(opt.value)}
                  className={cn(
                    "flex h-12 items-center justify-center border-2 border-brutal-black brutal-press",
                    opt.bg,
                    colorClass === opt.value && "shadow-brutal-md ring-2 ring-brutal-black ring-offset-1"
                  )}
                  title={opt.label}
                >
                  {colorClass === opt.value && (
                    <span className="text-brutal-black font-black text-lg">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <BrutalButton
            id="wallet-save-btn"
            variant="accent"
            size="lg"
            fullWidth
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? "Menyimpan..." : "Simpan Dompet"}
          </BrutalButton>
        </div>
      </div>
    </>
  );
}
