import { useState, useEffect } from "react";
import { useWallets } from "@/hooks/useWallets";
import { useTransactions } from "@/hooks/useTransactions";
import { BrutalButton } from "@/components/atoms/BrutalButton";
import { BrutalInput } from "@/components/atoms/BrutalInput";
import { SelectField } from "@/components/atoms/SelectField";
import {
  SelectPickerScreen,
  type SelectOption,
} from "@/components/molecules/SelectPickerScreen";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Check,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { format } from "date-fns";
import { liveQuery } from "dexie";
import { db, type Category } from "@/db/db";

// ─── Tab Config ───────────────────────────────────────────────────────────────

type TxType = "income" | "expense" | "transfer";

const TAB_CONFIG: {
  type: TxType;
  label: string;
  icon: typeof TrendingUp;
  activeColor: string;
  btnColor: string;
}[] = [
    {
      type: "income",
      label: "Pemasukan",
      icon: TrendingUp,
      activeColor: "bg-brutal-emerald",
      btnColor: "!bg-brutal-emerald !text-brutal-black",
    },
    {
      type: "expense",
      label: "Pengeluaran",
      icon: TrendingDown,
      activeColor: "bg-brutal-rose",
      btnColor: "",
    },
    {
      type: "transfer",
      label: "Transfer",
      icon: ArrowLeftRight,
      activeColor: "bg-brutal-cyan",
      btnColor: "!bg-brutal-cyan !text-brutal-black",
    },
  ];

// ─── Rupiah formatter ─────────────────────────────────────────────────────────

function formatRupiah(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return new Intl.NumberFormat("id-ID").format(parseInt(digits));
}

function parseRupiah(formatted: string): number {
  return parseInt(formatted.replace(/\D/g, "") || "0");
}

function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

// ─── Wallet color map ─────────────────────────────────────────────────────────

const COLOR_HEX: Record<string, string> = {
  "brutal-lime": "#c8f135",
  "brutal-cyan": "#00d4ff",
  "brutal-yellow": "#ffd60a",
  "brutal-pink": "#ff4db8",
  "brutal-purple": "#a855f7",
  "brutal-emerald": "#00c47a",
  "brutal-rose": "#ff4d4d",
  "brutal-orange": "#ff8c00",
};

// ─── Success Toast ────────────────────────────────────────────────────────────

function SuccessToast({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="fixed top-4 left-4 right-4 z-[999] flex items-center gap-3 border-2 border-brutal-black bg-brutal-emerald p-3 shadow-brutal-md animate-in slide-in-from-top duration-200">
      <div className="flex h-7 w-7 items-center justify-center border-2 border-brutal-black bg-brutal-black">
        <Check size={14} strokeWidth={3} className="text-brutal-emerald" />
      </div>
      <p className="font-black text-sm uppercase tracking-wide">
        Transaksi berhasil disimpan!
      </p>
    </div>
  );
}

// ─── AddTransactionScreen ─────────────────────────────────────────────────────

export function AddTransactionScreen() {
  const { wallets } = useWallets();
  const { addTransaction } = useTransactions();

  const [activeType, setActiveType] = useState<TxType>("expense");
  const [categories, setCategories] = useState<Category[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activePicker, setActivePicker] = useState<"category" | "wallet" | "fromWallet" | "toWallet" | null>(null);

  // ── Form State ───────────────────────────────────────────────────────────
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  // Category
  const [categoryValue, setCategoryValue] = useState("");
  const [categoryLabel, setCategoryLabel] = useState("");
  // Wallet (income/expense)
  const [walletId, setWalletId] = useState("");
  const [walletLabel, setWalletLabel] = useState("");
  const [walletHint, setWalletHint] = useState("");
  const [walletColor, setWalletColor] = useState("");
  // Transfer wallets
  const [fromWalletId, setFromWalletId] = useState("");
  const [fromWalletLabel, setFromWalletLabel] = useState("");
  const [fromWalletColor, setFromWalletColor] = useState("");
  const [toWalletId, setToWalletId] = useState("");
  const [toWalletLabel, setToWalletLabel] = useState("");
  const [toWalletColor, setToWalletColor] = useState("");
  const [transferFee, setTransferFee] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // ── Load categories live ─────────────────────────────────────────────────
  useEffect(() => {
    const sub = liveQuery(() =>
      db.categories
        .where("type")
        .equals(activeType === "transfer" ? "expense" : activeType)
        .toArray()
    ).subscribe({
      next: (data) => {
        setCategories(data);
        setCategoryValue("");
        setCategoryLabel("");
      },
      error: () => { },
    });
    return () => sub.unsubscribe();
  }, [activeType]);

  // ── Reset on tab change ───────────────────────────────────────────────────
  function handleTypeChange(type: TxType) {
    setActiveType(type);
    setAmount("");
    setDescription("");
    setCategoryValue("");
    setCategoryLabel("");
    setWalletId("");
    setWalletLabel("");
    setWalletHint("");
    setWalletColor("");
    setFromWalletId("");
    setFromWalletLabel("");
    setFromWalletColor("");
    setToWalletId("");
    setToWalletLabel("");
    setToWalletColor("");
    setTransferFee("");
    setNotes("");
    setErrors({});
  }

  // ── Stack Pickers ─────────────────────────────────────────────────────────

  function openCategoryPicker() {
    setActivePicker("category");
  }

  function buildWalletOptions(excludeId?: string): SelectOption[] {
    return wallets
      .filter((w) => String(w.id) !== excludeId)
      .map((w) => ({
        value: String(w.id),
        label: w.name,
        sublabel: `Saldo: ${formatIDR(w.balance)}`,
        accentColor: COLOR_HEX[w.colorClass] ?? "#ffd60a",
      }));
  }

  function openWalletPicker() {
    setActivePicker("wallet");
  }

  function openFromWalletPicker() {
    setActivePicker("fromWallet");
  }

  function openToWalletPicker() {
    setActivePicker("toWallet");
  }

  // ── Validate & Submit ─────────────────────────────────────────────────────

  async function handleSubmit() {
    const errs: Record<string, string> = {};
    const amountNum = parseRupiah(amount);

    if (amountNum <= 0) errs.amount = "Nominal wajib lebih dari 0.";
    if (!description.trim()) errs.description = "Deskripsi wajib diisi.";
    if (!date) errs.date = "Tanggal wajib diisi.";

    if (activeType !== "transfer") {
      if (!categoryValue) errs.category = "Pilih kategori.";
      if (!walletId) errs.walletId = "Pilih dompet.";
    } else {
      // if (!fromWalletId) errs.fromWalletId = "Pilih dompet asal.";
      // if (!toWalletId) errs.toWalletId = "Pilih dompet tujuan.";
      if (fromWalletId && toWalletId && fromWalletId === toWalletId)
        errs.toWalletId = "Dompet asal dan tujuan tidak boleh sama.";
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      if (activeType === "transfer") {
        await addTransaction({
          type: "transfer",
          date,
          amount: amountNum,
          description: description.trim(),
          category: "Transfer",
          fromWalletId: parseInt(fromWalletId),
          toWalletId: parseInt(toWalletId),
          transferFee: parseRupiah(transferFee),
          notes: notes.trim() || undefined,
        });
      } else {
        await addTransaction({
          type: activeType,
          date,
          amount: amountNum,
          description: description.trim(),
          category: categoryValue,
          walletId: parseInt(walletId),
          notes: notes.trim() || undefined,
        });
      }

      // Reset form
      setAmount("");
      setDescription("");
      setCategoryValue("");
      setCategoryLabel("");
      setWalletId("");
      setWalletLabel("");
      setWalletHint("");
      setWalletColor("");
      setFromWalletId("");
      setFromWalletLabel("");
      setFromWalletColor("");
      setToWalletId("");
      setToWalletLabel("");
      setToWalletColor("");
      setTransferFee("");
      setNotes("");
      setDate(format(new Date(), "yyyy-MM-dd"));

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);
    } catch (e) {
      console.error("[AddTransaction]", e);
    } finally {
      setIsLoading(false);
    }
  }

  const activeTab = TAB_CONFIG.find((t) => t.type === activeType)!;

  return (
    <div
      className="flex flex-col min-h-full bg-brutal-bg"
      style={{ paddingTop: "var(--safe-top)" }}
    >
      <SuccessToast visible={showSuccess} />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="border-b-4 border-brutal-black bg-brutal-black px-4 py-4">
        <h1 className="text-xl font-black text-white uppercase tracking-tight">
          Tambah Transaksi
        </h1>
      </div>

      {/* ── Type Tabs ───────────────────────────────────────────────────────── */}
      <div className="flex border-b-2 border-brutal-black divide-x-2 divide-brutal-black">
        {TAB_CONFIG.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeType === tab.type;
          return (
            <button
              key={tab.type}
              id={`tx-tab-${tab.type}`}
              onClick={() => handleTypeChange(tab.type)}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-3",
                "text-[10px] font-black uppercase tracking-wider brutal-press",
                isActive
                  ? `${tab.activeColor} text-brutal-black`
                  : "bg-brutal-white text-brutal-black/50"
              )}
            >
              <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Form ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 px-4 pt-5 pb-32 overflow-y-auto">

        {/* Tanggal */}
        <BrutalInput
          id="tx-date"
          label="Tanggal"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          error={errors.date}
        />

        {/* Nominal */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="tx-amount"
            className="text-xs font-bold uppercase tracking-wider"
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
              onChange={(e) => {
                setAmount(formatRupiah(e.target.value));
                if (errors.amount) setErrors((p) => ({ ...p, amount: "" }));
              }}
              className={cn(
                "w-full border-2 border-brutal-black bg-brutal-white pl-10 pr-4 py-3",
                "text-sm font-medium shadow-brutal-md outline-none",
                "focus:shadow-brutal-sm focus:translate-x-[2px] focus:translate-y-[2px] transition-all duration-75",
                errors.amount && "border-brutal-rose"
              )}
            />
          </div>
          {errors.amount && (
            <p className="text-xs font-bold text-brutal-rose">{errors.amount}</p>
          )}
        </div>

        {/* Deskripsi */}
        <BrutalInput
          id="tx-description"
          label="Deskripsi"
          placeholder="cth. Makan siang, Gaji bulan ini..."
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (errors.description)
              setErrors((p) => ({ ...p, description: "" }));
          }}
          error={errors.description}
        />

        {/* ── Kategori & Dompet (income / expense) ─────────────────────────── */}
        {activeType !== "transfer" && (
          <>
            {/* Kategori → SelectPickerScreen */}
            <SelectField
              id="tx-category"
              label="Kategori"
              placeholder="Ketuk untuk pilih kategori..."
              value={categoryLabel || undefined}
              error={errors.category}
              onClick={openCategoryPicker}
            />

            {/* Dompet → SelectPickerScreen */}
            <SelectField
              id="tx-wallet"
              label="Dompet"
              placeholder="Ketuk untuk pilih dompet..."
              value={walletLabel || undefined}
              valueHint={walletHint}
              accentColor={walletColor}
              error={errors.walletId}
              onClick={openWalletPicker}
            />
          </>
        )}

        {/* ── Transfer Fields ───────────────────────────────────────────────── */}
        {activeType === "transfer" && (
          <>
            {/* Dari Dompet */}
            <SelectField
              id="tx-from-wallet"
              label="Dari Dompet (Sumber)"
              placeholder="Ketuk untuk pilih dompet asal..."
              value={fromWalletLabel || undefined}
              accentColor={fromWalletColor}
              error={errors.fromWalletId}
              onClick={openFromWalletPicker}
            />

            {/* Ke Dompet */}
            <SelectField
              id="tx-to-wallet"
              label="Ke Dompet (Tujuan)"
              placeholder="Ketuk untuk pilih dompet tujuan..."
              value={toWalletLabel || undefined}
              accentColor={toWalletColor}
              error={errors.toWalletId}
              onClick={openToWalletPicker}
            />

            {/* Biaya Transfer */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="tx-fee"
                className="text-xs font-bold uppercase tracking-wider"
              >
                Biaya Transfer / Admin{" "}
                <span className="normal-case font-medium opacity-50">
                  (opsional)
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-brutal-black/50">
                  Rp
                </span>
                <input
                  id="tx-fee"
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={transferFee}
                  onChange={(e) => setTransferFee(formatRupiah(e.target.value))}
                  className={cn(
                    "w-full border-2 border-brutal-black bg-brutal-white pl-10 pr-4 py-3",
                    "text-sm font-medium shadow-brutal-md outline-none",
                    "focus:shadow-brutal-sm transition-all duration-75"
                  )}
                />
              </div>
            </div>
          </>
        )}

        {/* Catatan */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="tx-notes"
            className="text-xs font-bold uppercase tracking-wider"
          >
            Catatan{" "}
            <span className="normal-case font-medium opacity-50">
              (opsional)
            </span>
          </label>
          <textarea
            id="tx-notes"
            rows={3}
            placeholder="Tulis catatan tambahan..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={cn(
              "w-full border-2 border-brutal-black bg-brutal-white px-4 py-3",
              "text-sm font-medium placeholder:text-brutal-black/40",
              "shadow-brutal-md outline-none resize-none",
              "focus:shadow-brutal-sm focus:translate-x-[2px] focus:translate-y-[2px] transition-all duration-75"
            )}
            style={{ borderRadius: "0 !important" }}
          />
        </div>

        {/* Submit */}
        <BrutalButton
          id="tx-submit-btn"
          variant={activeType === "expense" ? "danger" : "primary"}
          size="lg"
          fullWidth
          onClick={handleSubmit}
          disabled={isLoading}
          className={activeTab.btnColor}
        >
          {isLoading ? "Menyimpan..." : `Simpan ${activeTab.label}`}
        </BrutalButton>
      </div>

      {activePicker === "category" && (
        <div className="absolute inset-0 z-[70]">
          <SelectPickerScreen
            title="Pilih Kategori"
            options={categories.map((c) => {
              const IconComp = c.icon ? (LucideIcons as any)[c.icon] : LucideIcons.Tag;
              return {
                value: c.name,
                label: c.name,
                prefix: IconComp ? (
                  <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center border-2 border-brutal-black", c.colorClass ? `bg-${c.colorClass}` : "bg-brutal-yellow")}>
                    <IconComp size={14} strokeWidth={2.5} className="text-white" />
                  </div>
                ) : undefined
              };
            })}
            selectedValue={categoryValue}
            searchable={categories.length > 6}
            emptyMessage="Belum ada kategori tersedia."
            onSelect={(val, opt) => {
              setCategoryValue(val);
              setCategoryLabel(opt.label);
              setErrors((p) => ({ ...p, category: "" }));
            }}
            onClose={() => setActivePicker(null)}
          />
        </div>
      )}

      {activePicker === "wallet" && (
        <div className="absolute inset-0 z-[70]">
          <SelectPickerScreen
            title="Pilih Dompet"
            options={buildWalletOptions()}
            selectedValue={walletId}
            emptyMessage="Belum ada dompet. Tambah dulu di tab Profil."
            onSelect={(val, opt) => {
              setWalletId(val);
              setWalletLabel(opt.label);
              setWalletHint(opt.sublabel ?? "");
              setWalletColor(opt.accentColor ?? "");
              setErrors((p) => ({ ...p, walletId: "" }));
            }}
            onClose={() => setActivePicker(null)}
          />
        </div>
      )}

      {activePicker === "fromWallet" && (
        <div className="absolute inset-0 z-[70]">
          <SelectPickerScreen
            title="Dari Dompet (Sumber)"
            options={buildWalletOptions(toWalletId)}
            selectedValue={fromWalletId}
            emptyMessage="Belum ada dompet."
            onSelect={(val, opt) => {
              setFromWalletId(val);
              setFromWalletLabel(opt.label);
              setFromWalletColor(opt.accentColor ?? "");
              setErrors((p) => ({ ...p, fromWalletId: "" }));
            }}
            onClose={() => setActivePicker(null)}
          />
        </div>
      )}

      {activePicker === "toWallet" && (
        <div className="absolute inset-0 z-[70]">
          <SelectPickerScreen
            title="Ke Dompet (Tujuan)"
            options={buildWalletOptions(fromWalletId)}
            selectedValue={toWalletId}
            emptyMessage="Belum ada dompet."
            onSelect={(val, opt) => {
              setToWalletId(val);
              setToWalletLabel(opt.label);
              setToWalletColor(opt.accentColor ?? "");
              setErrors((p) => ({ ...p, toWalletId: "" }));
            }}
            onClose={() => setActivePicker(null)}
          />
        </div>
      )}
    </div>
  );
}
