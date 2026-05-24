import { useState, useEffect } from "react";
import { BrutalButton } from "@/components/atoms/BrutalButton";
import { BrutalInput } from "@/components/atoms/BrutalInput";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { Category } from "@/db/db";
import { toast } from "sonner";

// ─── Options ──────────────────────────────────────────────────────────────────

const COLOR_OPTIONS: { label: string; value: string; bg: string }[] = [
  { label: "Hijau Lime", value: "brutal-lime", bg: "bg-brutal-lime" },
  { label: "Cyan", value: "brutal-cyan", bg: "bg-brutal-cyan" },
  { label: "Kuning", value: "brutal-yellow", bg: "bg-brutal-yellow" },
  { label: "Pink", value: "brutal-pink", bg: "bg-brutal-pink" },
  { label: "Ungu", value: "brutal-purple", bg: "bg-brutal-purple" },
  { label: "Emerald", value: "brutal-emerald", bg: "bg-brutal-emerald" },
  { label: "Merah", value: "brutal-rose", bg: "bg-brutal-rose" },
  { label: "Orange", value: "brutal-orange", bg: "bg-brutal-orange" },
  { label: "Biru", value: "brutal-blue", bg: "bg-brutal-blue" },
  { label: "Hitam", value: "brutal-black", bg: "bg-brutal-black" },
];

const ICON_OPTIONS = [
  "Tag", "Coffee", "ShoppingCart", "Car", "Zap", "Film", "HeartPulse",
  "GraduationCap", "Briefcase", "TrendingUp", "TrendingDown", "Gift", "Smartphone",
  "Home", "Plane", "Book", "Music", "Utensils", "Monitor", "Gamepad2",
  "Banknote", "PlusCircle", "MinusCircle", "Activity", "Scissors",
  "ShoppingBag", "Ticket", "Wifi", "Package", "Smile"
];

// ─── CategoryFormModal ────────────────────────────────────────────────────────

interface CategoryFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (category: Omit<Category, "id" | "updatedAt" | "isDirty" | "isDeleted">) => Promise<void>;
  defaultType?: "income" | "expense";
  initialData?: Category;
  mode?: "add" | "edit";
}

export function CategoryFormModal({
  open,
  onClose,
  onSave,
  defaultType = "expense",
  initialData,
  mode = "add",
}: CategoryFormModalProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [type, setType] = useState<"income" | "expense">(initialData?.type ?? defaultType);
  const [colorClass, setColorClass] = useState(initialData?.colorClass ?? "brutal-yellow");
  const [icon, setIcon] = useState(initialData?.icon ?? "Tag");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Reset Effect ───────────────────────────────────────────────────────────
  // Automatically reset form state when modal is opened to prevent stale data
  useEffect(() => {
    if (open) {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialData, defaultType]);

  function reset() {
    setName(initialData?.name ?? "");
    setType(initialData?.type ?? defaultType);
    setColorClass(initialData?.colorClass ?? "brutal-yellow");
    setIcon(initialData?.icon ?? "Tag");
    setErrors({});
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSave() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Nama kategori wajib diisi.";
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setIsLoading(true);
    try {
      await onSave({ name: name.trim(), type, colorClass, icon });
      toast.success(mode === "edit" ? "Kategori berhasil diperbarui!" : "Kategori berhasil ditambahkan!");
      reset(); // Reset after successful save
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Gagal menyimpan kategori.");
    } finally {
      setIsLoading(false);
    }
  }

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-brutal-black/60" onClick={handleClose} />
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50",
          "border-t-4 border-brutal-black bg-brutal-bg",
          "pb-[calc(var(--safe-bottom)+16px)] h-[85dvh] flex flex-col",
          "animate-in slide-in-from-bottom duration-200"
        )}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b-2 border-brutal-black px-4 py-3 bg-brutal-bg">
          <h2 className="text-base font-black uppercase tracking-wider">
            {mode === "edit" ? "Edit Kategori" : "Tambah Kategori"}
          </h2>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center border-2 border-brutal-black bg-brutal-white shadow-brutal-sm brutal-press"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5">
          <BrutalInput
            id="cat-name"
            label="Nama Kategori"
            placeholder="cth. Makanan, Gaji, dll..."
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((p) => ({ ...p, name: "" }));
            }}
            error={errors.name}
          />

          {/* Type Selector (Only in Add mode) */}
          {mode === "add" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider">Tipe</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setType("income")}
                  className={cn(
                    "flex-1 border-2 border-brutal-black py-2.5 text-sm font-black uppercase brutal-press",
                    type === "income"
                      ? "bg-brutal-black text-brutal-emerald shadow-brutal-sm"
                      : "bg-brutal-white text-brutal-black shadow-brutal-sm"
                  )}
                >
                  Pemasukan
                </button>
                <button
                  onClick={() => setType("expense")}
                  className={cn(
                    "flex-1 border-2 border-brutal-black py-2.5 text-sm font-black uppercase brutal-press",
                    type === "expense"
                      ? "bg-brutal-black text-brutal-rose shadow-brutal-sm"
                      : "bg-brutal-white text-brutal-black shadow-brutal-sm"
                  )}
                >
                  Pengeluaran
                </button>
              </div>
            </div>
          )}

          {/* Color Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider">Warna Latar Ikon</label>
            <div className="grid grid-cols-5 gap-2">
              {COLOR_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setColorClass(opt.value)}
                  className={cn(
                    "flex h-10 items-center justify-center border-2 border-brutal-black brutal-press",
                    opt.bg,
                    colorClass === opt.value && "shadow-brutal-md ring-2 ring-brutal-black ring-offset-1"
                  )}
                >
                  {colorClass === opt.value && (
                    <span className="text-brutal-black font-black text-sm">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Icon Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider">Ikon</label>
            <div className="grid grid-cols-6 gap-2">
              {ICON_OPTIONS.map((iconName) => {
                const IconComp = (LucideIcons as any)[iconName];
                if (!IconComp) return null;
                const isSelected = icon === iconName;
                return (
                  <button
                    key={iconName}
                    onClick={() => setIcon(iconName)}
                    className={cn(
                      "flex h-10 items-center justify-center border-2 border-brutal-black brutal-press",
                      isSelected ? "bg-brutal-black text-white shadow-brutal-md" : "bg-brutal-white text-brutal-black"
                    )}
                  >
                    <IconComp size={18} strokeWidth={isSelected ? 3 : 2} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t-2 border-brutal-black bg-brutal-bg p-4">
          <BrutalButton
            id="cat-save-btn"
            variant="accent"
            size="lg"
            fullWidth
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? "Menyimpan..." : "Simpan Kategori"}
          </BrutalButton>
        </div>
      </div>
    </>
  );
}
