import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWallets } from "@/hooks/useWallets";
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
import * as LucideIcons from "lucide-react";
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

export function EditTransactionScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { wallets } = useWallets();
  const { updateTransaction, removeTransaction } = useTransactions();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [transaction, setTransaction] = useState<Transaction | null>(null);

  const [activeType, setActiveType] = useState<TxType>("expense");
  const [categories, setCategories] = useState<Category[]>([]);
  const [activePicker, setActivePicker] = useState<"category" | "wallet" | "fromWallet" | "toWallet" | null>(null);

  // Form state
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryValue, setCategoryValue] = useState("");
  const [categoryLabel, setCategoryLabel] = useState("");
  const [walletId, setWalletId] = useState("");
  const [walletLabel, setWalletLabel] = useState("");
  const [walletHint, setWalletHint] = useState("");
  const [walletColor, setWalletColor] = useState("");
  const [fromWalletId, setFromWalletId] = useState("");
  const [fromWalletLabel, setFromWalletLabel] = useState("");
  const [fromWalletColor, setFromWalletColor] = useState("");
  const [toWalletId, setToWalletId] = useState("");
  const [toWalletLabel, setToWalletLabel] = useState("");
  const [toWalletColor, setToWalletColor] = useState("");
  const [transferFee, setTransferFee] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Load transaction
  useEffect(() => {
    if (id) {
      db.transactions.get(parseInt(id)).then((tx) => {
        if (tx) {
          setTransaction(tx);
          setActiveType(tx.type);
          setAmount(tx.amount > 0 ? formatRupiah(String(tx.amount)) : "");
          setDescription(tx.description);
          setCategoryValue(tx.category);
          setCategoryLabel(tx.category);
          setWalletId(String(tx.walletId ?? ""));
          setFromWalletId(String(tx.fromWalletId ?? ""));
          setToWalletId(String(tx.toWalletId ?? ""));
          setTransferFee(tx.transferFee ? formatRupiah(String(tx.transferFee)) : "");
          setNotes(tx.notes ?? "");
          setDate(tx.date);
        } else {
          navigate(-1);
        }
      });
    }
  }, [id, navigate]);

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
    setActivePicker("category");
  }

  function openWalletPicker() {
    setActivePicker("wallet");
  }

  function openFromPicker() {
    setActivePicker("fromWallet");
  }

  function openToPicker() {
    setActivePicker("toWallet");
  }

  async function handleDeleteConfirm() {
    if (transaction) {
      await removeTransaction(transaction.id!);
      setDeleteOpen(false);
      navigate(-1);
    }
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

      await updateTransaction(transaction!.id!, changes);
      navigate(-1);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  const activeTab = TAB_CONFIG.find((t) => t.type === activeType)!;

  if (!transaction) {
    return (
      <div className="flex h-dvh items-center justify-center bg-brutal-bg">
        <p className="font-bold">Loading...</p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-dvh bg-brutal-bg"
      style={{ paddingTop: "var(--safe-top)" }}
    >
      <AppHeader
        title="Edit Transaksi"
        onBack={() => navigate(-1)}
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

      {/* Stack Pickers Inline */}
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
            onSelect={(val) => {
              setCategoryValue(val);
              setCategoryLabel(val);
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
            options={walletOptions()}
            selectedValue={walletId}
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
            options={walletOptions(toWalletId)}
            selectedValue={fromWalletId}
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
            options={walletOptions(fromWalletId)}
            selectedValue={toWalletId}
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

