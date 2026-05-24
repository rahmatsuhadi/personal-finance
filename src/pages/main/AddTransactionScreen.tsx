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
import { ScannerOverlay } from "@/components/molecules/ScannerOverlay";
import { cn, formatIDR, formatRupiah, parseCurrency } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Maximize,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { format } from "date-fns";
import { liveQuery } from "dexie";
import { db, type Category } from "@/db/db";
import { toast } from "sonner";

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

// ─── AddTransactionScreen ─────────────────────────────────────────────────────

export function AddTransactionScreen() {
  const { wallets } = useWallets();
  const { addTransaction } = useTransactions();

  const [activeType, setActiveType] = useState<TxType>("expense");
  const [categories, setCategories] = useState<Category[]>([]);
  const [activePicker, setActivePicker] = useState<"category" | "wallet" | "fromWallet" | "toWallet" | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [transferFee, setTransferFee] = useState("");

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
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

  // Items
  const [useItemDetails, setUseItemDetails] = useState(false);
  const [items, setItems] = useState<{ name: string, price: string }[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // ── Auto Calculate Amount ────────────────────────────────────────────────
  useEffect(() => {
    if (useItemDetails && activeType === "expense") {
      const total = items.reduce((sum, item) => sum + parseCurrency(item.price), 0);
      if (total > 0) {
        setAmount(new Intl.NumberFormat("id-ID").format(total));
      } else {
        setAmount("");
      }
    }
  }, [items, useItemDetails, activeType]);

  // ── Load categories live ─────────────────────────────────────────────────
  useEffect(() => {
    const sub = liveQuery(() =>
      db.categories
        .where("type")
        .equals(activeType === "transfer" ? "expense" : activeType)
        .filter(c => !c.isDeleted)
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
    setUseItemDetails(false);
    setItems([]);
    setErrors({});
  }

  // ── Scanner Logic ───────────────────────────────────────────────────────────

  function handleScanResult(data: any) {
    setActiveType(data.type);
    setAmount(data.amount);
    setDescription(data.description);
    setCategoryValue(data.category);
    setCategoryLabel(data.category);
    setDate(data.date);

    if (data.useItemDetails) {
      setUseItemDetails(true);
      setItems(data.items);
    } else {
      setUseItemDetails(false);
      setItems([]);
    }

    setScannerOpen(false);
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
    const amountNum = parseCurrency(amount);

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
          fromWalletId: fromWalletId || undefined,
          toWalletId: toWalletId || undefined,
          transferFee: parseCurrency(transferFee),
          notes: notes.trim() || undefined,
        });
      } else {
        await addTransaction({
          type: activeType,
          date,
          amount: amountNum,
          description: description.trim(),
          category: categoryValue,
          walletId: walletId || undefined,
          notes: notes.trim() || undefined,
          items: useItemDetails && items.length > 0
            ? items.map(i => ({ name: i.name.trim() || "Item", price: parseCurrency(i.price) }))
            : undefined,
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
      setUseItemDetails(false);
      setItems([]);
      setDate(format(new Date(), "yyyy-MM-dd"));
      toast.success("Transaksi berhasil disimpan!");

    } catch (e) {
      console.error("[AddTransaction]", e);
      toast.error("Gagal menyimpan transaksi.");
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
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="border-b-4 border-brutal-black bg-brutal-black px-4 py-4 flex items-center justify-between">
        <h1 className="text-xl font-black text-white uppercase tracking-tight">
          Tambah Transaksi
        </h1>
        <button
          onClick={() => setScannerOpen(true)}
          className="flex h-10 w-10 items-center justify-center border-2 border-brutal-lime bg-transparent text-brutal-lime brutal-press"
          aria-label="Buka scanner AI"
        >
          <Maximize size={20} strokeWidth={2.5} />
        </button>
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
              disabled={useItemDetails && activeType === "expense"}
              className={cn(
                "w-full border-2 border-brutal-black bg-brutal-white pl-10 pr-4 py-3",
                "text-sm font-medium shadow-brutal-md outline-none",
                "focus:shadow-brutal-sm focus:translate-x-[2px] focus:translate-y-[2px] transition-all duration-75",
                errors.amount && "border-brutal-rose",
                useItemDetails && activeType === "expense" && "bg-brutal-black/5 opacity-80 cursor-not-allowed"
              )}
            />
          </div>
          {errors.amount && (
            <p className="text-xs font-bold text-brutal-rose">{errors.amount}</p>
          )}
        </div>

        {/* ── Transaction Items Switch ── */}
        {activeType === "expense" && (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setUseItemDetails(!useItemDetails);
                if (!useItemDetails && items.length === 0) {
                  setItems([{ name: "", price: "" }]);
                }
              }}
              className="flex items-center gap-3 self-start brutal-press"
            >
              <div
                className={cn(
                  "w-10 h-6 border-2 border-brutal-black relative transition-colors duration-200",
                  useItemDetails ? "bg-brutal-lime" : "bg-brutal-white"
                )}
              >
                <div
                  className={cn(
                    "absolute top-0.5 bottom-0.5 w-4 border-2 border-brutal-black bg-brutal-white transition-all duration-200",
                    useItemDetails ? "left-4" : "left-0.5"
                  )}
                />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider">
                Gunakan Detail Barang
              </span>
            </button>

            {useItemDetails && (
              <div className="flex flex-col gap-3 pl-4 border-l-4 border-brutal-black mt-2">
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <div className="flex-1 flex flex-col gap-2">
                      <input
                        type="text"
                        placeholder="Nama barang..."
                        value={item.name}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[idx].name = e.target.value;
                          setItems(newItems);
                        }}
                        className="w-full border-2 border-brutal-black bg-brutal-white px-3 py-2 text-xs font-bold shadow-[2px_2px_0px_rgba(0,0,0,1)] outline-none focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px]"
                      />
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-brutal-black/50">
                          Rp
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          value={item.price}
                          onChange={(e) => {
                            const newItems = [...items];
                            newItems[idx].price = formatRupiah(e.target.value);
                            setItems(newItems);
                          }}
                          className="w-full border-2 border-brutal-black bg-brutal-white pl-8 pr-3 py-2 text-xs font-bold shadow-[2px_2px_0px_rgba(0,0,0,1)] outline-none focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px]"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const newItems = items.filter((_, i) => i !== idx);
                        setItems(newItems);
                      }}
                      className="p-2 border-2 border-brutal-black bg-brutal-rose text-white shadow-[2px_2px_0px_rgba(0,0,0,1)] brutal-press mt-1 shrink-0"
                    >
                      <LucideIcons.Trash2 size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => setItems([...items, { name: "", price: "" }])}
                  className="self-start flex items-center gap-2 mt-1 px-3 py-2 border-2 border-brutal-black bg-brutal-cyan shadow-[2px_2px_0px_rgba(0,0,0,1)] brutal-press text-xs font-bold uppercase tracking-wider"
                >
                  <LucideIcons.Plus size={14} strokeWidth={3} />
                  Tambah Item
                </button>
              </div>
            )}
          </div>
        )}

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
      {/* ── Scanner Overlay ── */}
      {scannerOpen && (
        <ScannerOverlay
          onClose={() => setScannerOpen(false)}
          onResult={handleScanResult}
          localCategories={categories.map(c => c.name).join(",")}
        />
      )}
    </div>
  );
}

