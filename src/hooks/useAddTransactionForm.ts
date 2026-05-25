import { useState, useEffect } from "react";
import { format } from "date-fns";
import { liveQuery } from "dexie";
import { db, type Category } from "@/db/db";
import { useWallets } from "@/hooks/useWallets";
import { useTransactions } from "@/hooks/useTransactions";
import { parseCurrency, formatRupiah, formatIDR } from "@/lib/utils";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";

export type TxType = "income" | "expense" | "transfer";

export function useAddTransactionForm() {
  const { wallets } = useWallets();
  const { addTransaction } = useTransactions();
  const location = useLocation();

  const [activeType, setActiveType] = useState<TxType>("expense");
  const [categories, setCategories] = useState<Category[]>([]);
  const [scannerOpen, setScannerOpen] = useState(false);

  // ── Form State ───────────────────────────────────────────────────────────
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
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const [useItemDetails, setUseItemDetails] = useState(false);
  const [items, setItems] = useState<{ name: string, price: string }[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // ── Initial State from Router ────────────────────────────────────────────
  useEffect(() => {
    if (location.state && location.state.initialTx && wallets.length > 0) {
      const initialTx = location.state.initialTx;
      const type = initialTx.type || "expense";
      setActiveType(type);
      if (initialTx.amount) setAmount(formatRupiah(String(initialTx.amount)));
      if (initialTx.description) setDescription(initialTx.description);
      if (initialTx.category) {
        setCategoryValue(initialTx.category);
        setCategoryLabel(initialTx.category);
      }
      if (initialTx.date) setDate(initialTx.date);
      
      if (initialTx.walletName) {
        const matched = wallets.find(w => w.name.toLowerCase() === initialTx.walletName.toLowerCase());
        if (matched) {
          setWalletId(matched.id);
          setWalletLabel(matched.name);
          setWalletColor(matched.colorClass);
          setWalletHint(`Saldo: ${formatIDR(matched.balance)}`);
        }
      }
      
      // Bersihkan state history agar tidak mengisi ulang form saat reset/submit
      window.history.replaceState(null, "");
    }
  }, [location.state, wallets]);

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
        .toArray()
    ).subscribe({
      next: (data) => {
        setCategories(data);
        
        const initialTx = location.state?.initialTx;
        let matchedName = "";
        if (initialTx && initialTx.category) {
          const matched = data.find(
            c => c.name.toLowerCase() === initialTx.category.toLowerCase()
          );
          if (matched) {
            matchedName = matched.name;
          }
        }

        if (matchedName) {
          setCategoryValue(matchedName);
          setCategoryLabel(matchedName);
        } else {
          setCategoryValue(current => {
            const exists = data.some(c => c.name === current);
            return exists ? current : "";
          });
          setCategoryLabel(current => {
            const exists = data.some(c => c.name === current);
            return exists ? current : "";
          });
        }
      },
      error: () => { },
    });
    return () => sub.unsubscribe();
  }, [activeType, location.state]);

  const handleTypeChange = (type: TxType) => {
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
  };

  const handleScanResult = (data: any) => {
    const rawType = (data.type || "expense").toLowerCase();
    const type = ["income", "expense", "transfer"].includes(rawType) 
      ? rawType as TxType 
      : "expense";

    setActiveType(type);
    if (data.amount) setAmount(formatRupiah(data.amount));
    setDescription(data.description || "");
    if (data.category) {
      setCategoryValue(data.category);
      setCategoryLabel(data.category);
    }
    if (data.date) setDate(data.date);
    if (data.useItemDetails) {
      setUseItemDetails(true);
      setItems((data.items || []).map((item: any) => ({
        name: item.name,
        price: formatRupiah(item.price)
      })));
    } else {
      setUseItemDetails(false);
      setItems([]);
    }
    setScannerOpen(false);
  };

  const handleSubmit = async () => {
    const errs: Record<string, string> = {};
    const amountNum = parseCurrency(amount);

    if (amountNum <= 0) errs.amount = "Nominal wajib lebih dari 0.";
    if (!description.trim()) errs.description = "Deskripsi wajib diisi.";
    if (!date) errs.date = "Tanggal wajib diisi.";

    if (activeType !== "transfer") {
      if (!categoryValue) errs.category = "Pilih kategori.";
      if (!walletId) errs.walletId = "Pilih dompet.";
    } else {
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
      handleTypeChange(activeType);
      setDate(format(new Date(), "yyyy-MM-dd"));
      toast.success("Transaksi berhasil disimpan!");
      return true;
    } catch (e) {
      console.error("[AddTransaction]", e);
      toast.error("Gagal menyimpan transaksi.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    wallets,
    activeType,
    categories,
    scannerOpen,
    setScannerOpen,
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
    handleTypeChange,
    handleScanResult,
    handleSubmit,
  };
}
