import { useState, useEffect } from "react";
import { useWallets } from "@/hooks/useWallets";
import { useStack } from "@/navigation/StackNavigator";
import { AppHeader } from "@/components/atoms/AppHeader";
import { BrutalButton } from "@/components/atoms/BrutalButton";
import { BrutalInput } from "@/components/atoms/BrutalInput";
import { SelectField } from "@/components/atoms/SelectField";
import { ConfirmModal } from "@/components/atoms/ConfirmModal";
import {
  SelectPickerScreen,
  type SelectOption,
} from "@/components/molecules/SelectPickerScreen";
import { useTransactions } from "@/hooks/useTransactions";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Trash2,
} from "lucide-react";
import { liveQuery } from "dexie";
import { db, type Category, type Transaction } from "@/db/db";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── EditTransactionScreen ────────────────────────────────────────────────────

interface EditTransactionScreenProps {
  transaction: Transaction;
  /** Called after successful update so parent can refresh */
  onUpdated?: () => void;
}

export function EditTransactionScreen({
  transaction,
  onUpdated,
}: EditTransactionScreenProps) {
  const { wallets } = useWallets();
  const { updateTransaction, removeTransaction } = useTransactions();
  const { pop, push } = useStack();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [activeType, setActiveType] = useState<TxType>(transaction.type);
  const [categories, setCategories] = useState<Category[]>([]);

  // Form state — pre-filled
  const [amount, setAmount] = useState(
    transaction.amount > 0 ? formatRupiah(String(transaction.amount)) : ""
  );
  const [description, setDescription] = useState(transaction.description);
  const [categoryValue, setCategoryValue] = useState(transaction.category);
  const [categoryLabel, setCategoryLabel] = useState(transaction.category);
  const [walletId, setWalletId] = useState(String(transaction.walletId ?? ""));
  const [walletLabel, setWalletLabel] = useState("");
  const [walletHint, setWalletHint] = useState("");
  const [walletColor, setWalletColor] = useState("");
  const [fromWalletId, setFromWalletId] = useState(
    String(transaction.fromWalletId ?? "")
  );
  const [fromWalletLabel, setFromWalletLabel] = useState("");
  const [fromWalletColor, setFromWalletColor] = useState("");
  const [toWalletId, setToWalletId] = useState(
    String(transaction.toWalletId ?? "")
  );
  const [toWalletLabel, setToWalletLabel] = useState("");
  const [toWalletColor, setToWalletColor] = useState("");
  const [transferFee, setTransferFee] = useState(
    transaction.transferFee ? formatRupiah(String(transaction.transferFee)) : ""
  );
  const [notes, setNotes] = useState(transaction.notes ?? "");
  const [date, setDate] = useState(transaction.date);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Pre-fill wallet labels from wallets list
  useEffect(() => {
    if (!wallets.length) return;
    const w = wallets.find((x) => String(x.id) === walletId);
    if (w) {
      setWalletLabel(w.name);
      setWalletHint(`Saldo: ${formatIDR(w.balance)}`);
      setWalletColor(COLOR_HEX[w.colorClass] ?? "");
    }
    const fw = wallets.find((x) => String(x.id) === fromWalletId);
    if (fw) {
      setFromWalletLabel(fw.name);
      setFromWalletColor(COLOR_HEX[fw.colorClass] ?? "");
    }
    const tw = wallets.find((x) => String(x.id) === toWalletId);
    if (tw) {
      setToWalletLabel(tw.name);
      setToWalletColor(COLOR_HEX[tw.colorClass] ?? "");
    }
  }, [wallets, walletId, fromWalletId, toWalletId]);

  // Load categories
  useEffect(() => {
    const sub = liveQuery(() =>
      db.categories
        .where("type")
        .equals(activeType === "transfer" ? "expense" : activeType)
        .toArray()
    ).subscribe({
      next: (data) => setCategories(data),
      error: () => { },
    });
    return () => sub.unsubscribe();
  }, [activeType]);

  function walletOptions(excludeId?: string): SelectOption[] {
    return wallets
      .filter((w) => String(w.id) !== excludeId)
      .map((w) => ({
        value: String(w.id),
        label: w.name,
        sublabel: `Saldo: ${formatIDR(w.balance)}`,
        accentColor: COLOR_HEX[w.colorClass] ?? "#ffd60a",
      }));
  }

  function openCategoryPicker() {
    push(
      <SelectPickerScreen
        title="Pilih Kategori"
        options={categories.map((c) => ({ value: c.name, label: c.name }))}
        selectedValue={categoryValue}
        searchable={categories.length > 6}
        onSelect={(val) => {
          setCategoryValue(val);
          setCategoryLabel(val);
          setErrors((p) => ({ ...p, category: "" }));
        }}
      />
    );
  }

  function openWalletPicker() {
    push(
      <SelectPickerScreen
        title="Pilih Dompet"
        options={walletOptions()}
        selectedValue={walletId}
        onSelect={(val, opt) => {
          setWalletId(val);
          setWalletLabel(opt.label);
          setWalletHint(opt.sublabel ?? "");
          setWalletColor(opt.accentColor ?? "");
          setErrors((p) => ({ ...p, walletId: "" }));
        }}
      />
    );
  }

  function openFromPicker() {
    push(
      <SelectPickerScreen
        title="Dari Dompet (Sumber)"
        options={walletOptions(toWalletId)}
        selectedValue={fromWalletId}
        onSelect={(val, opt) => {
          setFromWalletId(val);
          setFromWalletLabel(opt.label);
          setFromWalletColor(opt.accentColor ?? "");
          setErrors((p) => ({ ...p, fromWalletId: "" }));
        }}
      />
    );
  }

  function openToPicker() {
    push(
      <SelectPickerScreen
        title="Ke Dompet (Tujuan)"
        options={walletOptions(fromWalletId)}
        selectedValue={toWalletId}
        onSelect={(val, opt) => {
          setToWalletId(val);
          setToWalletLabel(opt.label);
          setToWalletColor(opt.accentColor ?? "");
          setErrors((p) => ({ ...p, toWalletId: "" }));
        }}
      />
    );
  }

  async function handleDeleteConfirm() {
    await removeTransaction(transaction.id!);
    onUpdated?.();
    setDeleteOpen(false);
    pop();
  }

  async function handleSave() {
    const errs: Record<string, string> = {};
    const amountNum = parseRupiah(amount);
    if (amountNum <= 0) errs.amount = "Nominal wajib lebih dari 0.";
    if (!description.trim()) errs.description = "Deskripsi wajib diisi.";
    if (activeType !== "transfer") {
      if (!categoryValue) errs.category = "Pilih kategori.";
      if (!walletId) errs.walletId = "Pilih dompet.";
    } else {
      if (!fromWalletId) errs.fromWalletId = "Pilih dompet asal.";
      if (!toWalletId) errs.toWalletId = "Pilih dompet tujuan.";
    }
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsLoading(true);
    try {
      const changes: Omit<Transaction, "id"> =
        activeType === "transfer"
          ? {
            type: "transfer",
            date,
            amount: amountNum,
            description: description.trim(),
            category: "Transfer",
            fromWalletId: parseInt(fromWalletId),
            toWalletId: parseInt(toWalletId),
            transferFee: parseRupiah(transferFee),
            notes: notes.trim() || undefined,
          }
          : {
            type: activeType,
            date,
            amount: amountNum,
            description: description.trim(),
            category: categoryValue,
            walletId: parseInt(walletId),
            notes: notes.trim() || undefined,
          };

      await updateTransaction(transaction.id!, changes);
      onUpdated?.();
      pop();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  const activeTab = TAB_CONFIG.find((t) => t.type === activeType)!;

  return (
    <div
      className="flex flex-col h-dvh bg-brutal-bg"
      style={{ paddingTop: "var(--safe-top)" }}
    >
      <AppHeader
        title="Edit Transaksi"
        onBack={pop}
        action={
          <button
            onClick={() => setDeleteOpen(true)}
            className="flex h-9 w-9 items-center justify-center border-2 border-brutal-rose bg-brutal-rose shadow-brutal-sm brutal-press"
          >
            <Trash2 size={15} strokeWidth={2.5} className="text-white" />
          </button>
        }
      />

      {/* Type Tabs */}
      <div className="flex border-b-2 border-brutal-black divide-x-2 divide-brutal-black">
        {TAB_CONFIG.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeType === tab.type;
          return (
            <button
              key={tab.type}
              onClick={() => setActiveType(tab.type)}
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

      {/* Form */}
      <div className="flex flex-col gap-4 px-4 pt-5 pb-32 overflow-y-auto flex-1">
        <BrutalInput
          id="edit-tx-date"
          label="Tanggal"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        {/* Nominal */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider">Nominal (Rp)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-brutal-black/50">Rp</span>
            <input
              type="text"
              inputMode="numeric"
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
          {errors.amount && <p className="text-xs font-bold text-brutal-rose">{errors.amount}</p>}
        </div>

        <BrutalInput
          id="edit-tx-desc"
          label="Deskripsi"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (errors.description) setErrors((p) => ({ ...p, description: "" }));
          }}
          error={errors.description}
        />

        {activeType !== "transfer" && (
          <>
            <SelectField
              id="edit-tx-category"
              label="Kategori"
              value={categoryLabel || undefined}
              onClick={openCategoryPicker}
              error={errors.category}
            />
            <SelectField
              id="edit-tx-wallet"
              label="Dompet"
              value={walletLabel || undefined}
              valueHint={walletHint}
              accentColor={walletColor}
              onClick={openWalletPicker}
              error={errors.walletId}
            />
          </>
        )}

        {activeType === "transfer" && (
          <>
            <SelectField
              id="edit-from-wallet"
              label="Dari Dompet (Sumber)"
              value={fromWalletLabel || undefined}
              accentColor={fromWalletColor}
              onClick={openFromPicker}
              error={errors.fromWalletId}
            />
            <SelectField
              id="edit-to-wallet"
              label="Ke Dompet (Tujuan)"
              value={toWalletLabel || undefined}
              accentColor={toWalletColor}
              onClick={openToPicker}
              error={errors.toWalletId}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider">Biaya Transfer <span className="font-medium opacity-50 normal-case">(opsional)</span></label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-brutal-black/50">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={transferFee}
                  onChange={(e) => setTransferFee(formatRupiah(e.target.value))}
                  className="w-full border-2 border-brutal-black bg-brutal-white pl-10 pr-4 py-3 text-sm font-medium shadow-brutal-md outline-none"
                />
              </div>
            </div>
          </>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider">
            Catatan <span className="font-medium opacity-50 normal-case">(opsional)</span>
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border-2 border-brutal-black bg-brutal-white px-4 py-3 text-sm font-medium shadow-brutal-md outline-none resize-none"
            style={{ borderRadius: "0 !important" }}
          />
        </div>

        <BrutalButton
          variant={activeType === "expense" ? "danger" : "primary"}
          size="lg"
          fullWidth
          onClick={handleSave}
          disabled={isLoading}
          className={activeTab.btnColor}
        >
          {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
        </BrutalButton>
      </div>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        open={deleteOpen}
        title="Hapus Transaksi"
        message={`Yakin ingin menghapus transaksi "${transaction.description}"? Saldo dompet akan dikembalikan secara otomatis.`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
