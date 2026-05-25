import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { liveQuery } from "dexie";
import { db, type Category, type Transaction } from "@/db/db";
import { useWallets } from "@/hooks/useWallets";
import { useTransactions } from "@/hooks/useTransactions";
import { parseCurrency, formatRupiah, formatIDR } from "@/lib/utils";
import { toast } from "sonner";

export type TxType = "income" | "expense" | "transfer";

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

export function useEditTransactionForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { wallets } = useWallets();
  const { updateTransaction, removeTransaction } = useTransactions();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [activeType, setActiveType] = useState<TxType>("expense");
  const [categories, setCategories] = useState<Category[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);

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

  const [useItemDetails, setUseItemDetails] = useState(false);
  const [items, setItems] = useState<{name: string, price: string}[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Auto-Calculation
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

  // Load transaction
  useEffect(() => {
    if (id) {
      db.transactions.get(id).then((tx) => {
        if (tx) {
          setTransaction(tx);
          setActiveType(tx.type);
          setAmount(tx.amount > 0 ? formatRupiah(String(tx.amount)) : "");
          setDescription(tx.description);
          setCategoryValue(tx.category);
          setCategoryLabel(tx.category);
          setWalletId(tx.walletId ?? "");
          setFromWalletId(tx.fromWalletId ?? "");
          setToWalletId(tx.toWalletId ?? "");
          setTransferFee(tx.transferFee ? formatRupiah(String(tx.transferFee)) : "");
          setNotes(tx.notes ?? "");
          setDate(tx.date);
          if (tx.items && tx.items.length > 0) {
            setUseItemDetails(true);
            setItems(tx.items.map(i => ({ name: i.name, price: formatRupiah(String(i.price)) })));
          }
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

  const handleDeleteConfirm = async () => {
    if (transaction) {
      await removeTransaction(transaction.id);
      setDeleteOpen(false);
      toast.success("Transaksi berhasil dihapus!");
      navigate(-1);
    }
  };

  const handleSave = async () => {
    const errs: Record<string, string> = {};
    const amountNum = parseCurrency(amount);
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
      const changes: Omit<Transaction, "id" | "updatedAt"> =
        activeType === "transfer"
          ? {
            type: "transfer",
            date,
            amount: amountNum,
            description: description.trim(),
            category: "Transfer",
            fromWalletId: fromWalletId || undefined,
            toWalletId: toWalletId || undefined,
            transferFee: parseCurrency(transferFee),
            notes: notes.trim() || undefined,
          }
          : {
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
          };

      await updateTransaction(transaction!.id, changes);
      toast.success("Transaksi berhasil diperbarui!");
      navigate(-1);
    } catch (e) {
      console.error(e);
      toast.error("Gagal memperbarui transaksi.");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    transaction,
    activeType,
    setActiveType,
    categories,
    deleteOpen,
    setDeleteOpen,
    amount,
    setAmount,
    description,
    setDescription,
    categoryValue,
    categoryLabel,
    setCategoryValue,
    setCategoryLabel,
    walletId,
    setWalletId,
    walletLabel,
    setWalletLabel,
    walletHint,
    setWalletHint,
    walletColor,
    setWalletColor,
    fromWalletId,
    setFromWalletId,
    fromWalletLabel,
    setFromWalletLabel,
    fromWalletColor,
    setFromWalletColor,
    toWalletId,
    setToWalletId,
    toWalletLabel,
    setToWalletLabel,
    toWalletColor,
    setToWalletColor,
    transferFee,
    setTransferFee,
    notes,
    setNotes,
    date,
    setDate,
    useItemDetails,
    setUseItemDetails,
    items,
    setItems,
    errors,
    setErrors,
    isLoading,
    handleDeleteConfirm,
    handleSave,
    wallets,
  };
}
