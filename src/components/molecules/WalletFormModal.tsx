import { useState, useEffect } from "react";
import { BrutalButton } from "@/components/atoms/BrutalButton";
import { BrutalInput } from "@/components/atoms/BrutalInput";
import { cn, formatRupiah, parseCurrency } from "@/lib/utils";
import { X } from "lucide-react";
import type { Wallet } from "@/db/db";

// ─── Color Options ─────────────────────────────────────────────────────────────

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

// ─── WalletFormModal ──────────────────────────────────────────────────────────
// Reusable modal for Add AND Edit wallet

interface WalletFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (wallet: Omit<Wallet, "id" | "updatedAt" | "isDirty" | "isDeleted">) => Promise<void>;
  /** Pre-fill for edit mode */
  initialData?: Wallet;
  mode?: "add" | "edit";
}

export function WalletFormModal({
  open,
  onClose,
  onSave,
  initialData,
  mode = "add",
}: WalletFormModalProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [currency, setCurrency] = useState<"IDR" | "USD">(
    initialData?.currency ?? "IDR"
  );
  const [colorClass, setColorClass] = useState(
    initialData?.colorClass ?? "brutal-lime"
  );
  const [balance, setBalance] = useState(
    initialData?.balance != null ? formatRupiah(Number(initialData.balance)) : ""
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function reset() {
    setName(initialData?.name ?? "");
    setCurrency(initialData?.currency ?? "IDR");
    setColorClass(initialData?.colorClass ?? "brutal-lime");
    setBalance(initialData?.balance != null ? formatRupiah(Number(initialData.balance)) : "");
    setErrors({});
  }

  // Sync state when modal opens
  useEffect(() => {
    if (open) {
      reset();
    }
  }, [open, initialData]);

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSave() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Nama dompet wajib diisi.";
    const balanceNum = parseCurrency(balance);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setIsLoading(true);
    try {
      await onSave({ name: name.trim(), currency, colorClass, balance: balanceNum });
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
      <div className="fixed inset-0 z-40 bg-brutal-black/60 " onClick={handleClose} />
      <div
        className={cn(
          "fixed bottom-15 left-0 right-0 z-50",
          "border-t-4 border-brutal-black bg-brutal-bg",
          "pb-[calc(var(--safe-bottom)+16px)]",
          "animate-in slide-in-from-bottom duration-200"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-brutal-black px-4 py-3">
          <h2 className="text-base font-black uppercase tracking-wider">
            {mode === "edit" ? "Edit Dompet" : "Tambah Dompet"}
          </h2>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center border-2 border-brutal-black bg-brutal-white shadow-brutal-sm brutal-press"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>

        <div className="px-4 pt-4 flex flex-col gap-4 max-h-[75vh] overflow-y-auto pb-4">
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

          <BrutalInput
            id="wallet-balance"
            label={mode === "edit" ? "Saldo Saat Ini" : "Saldo Awal"}
            placeholder="0"
            type="text"
            inputMode="numeric"
            value={balance}
            onChange={(e) => setBalance(formatRupiah(e.target.value))}
          />

          {/* Currency */}
          {/* <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider">Mata Uang</label>
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
          </div> */}

          {/* Color */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider">Warna Kartu</label>
            <div className="grid grid-cols-4 gap-2">
              {COLOR_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setColorClass(opt.value)}
                  className={cn(
                    "flex h-12 items-center justify-center border-2 border-brutal-black brutal-press",
                    opt.bg,
                    colorClass === opt.value && "shadow-brutal-md"
                  )}
                >
                  {colorClass === opt.value && (
                    <span className="text-brutal-black font-black text-lg">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <BrutalButton
            id="wallet-save-btn"
            variant="accent"
            size="lg"
            fullWidth
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading
              ? "Menyimpan..."
              : mode === "edit"
              ? "Simpan Perubahan"
              : "Simpan Dompet"}
          </BrutalButton>
        </div>
      </div>
    </>
  );
}
