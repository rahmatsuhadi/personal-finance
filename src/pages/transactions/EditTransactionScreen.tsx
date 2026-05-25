import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, ArrowLeftRight, Trash2 } from "lucide-react";
import * as LucideIcons from "lucide-react";

import { 
  AppHeader, 
  BrutalButton, 
  BrutalInput, 
  ConfirmModal, 
  SmallIconButton 
} from "@/components/atoms";
import { 
  AmountInput, 
  CategoryPicker, 
  ItemDetails 
} from "@/components/organisms";

import { cn, formatIDR, formatRupiah } from "@/lib/utils";
import { useEditTransactionForm, type TxType } from "@/hooks/useEditTransactionForm";

// ─── Tab Config ───────────────────────────────────────────────────────────────

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
  const navigate = useNavigate();
  const form = useEditTransactionForm();

  const activeTab = TAB_CONFIG.find((t) => t.type === form.activeType) || TAB_CONFIG[1];

  function buildWalletOptions(excludeId?: string) {
    return form.wallets
      .filter((w) => String(w.id) !== excludeId)
      .map((w) => ({
        value: String(w.id),
        label: w.name,
        sublabel: `Saldo: ${formatIDR(w.balance)}`,
        accentColor: COLOR_HEX[w.colorClass] ?? "#ffd60a",
      }));
  }

  if (!form.transaction) {
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
          <SmallIconButton
            onClick={() => form.setDeleteOpen(true)}
            icon={Trash2}
            variant="rose"
            size="md"
          />
        }
      />

      {/* Type Tabs */}
      <div className="flex border-b-2 border-brutal-black divide-x-2 divide-brutal-black">
        {TAB_CONFIG.map((tab) => {
          const Icon = tab.icon;
          const isActive = form.activeType === tab.type;
          return (
            <button
              key={tab.type}
              onClick={() => form.setActiveType(tab.type)}
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

      {/* Form Content */}
      <div className="flex flex-col gap-4 px-4 pt-5 pb-32 overflow-y-auto flex-1">
        <BrutalInput
          label="Tanggal"
          type="date"
          value={form.date}
          onChange={(e) => form.setDate(e.target.value)}
          error={form.errors.date}
        />

        <AmountInput
          amount={form.amount}
          onChange={(val: string) => form.setAmount(formatRupiah(val))}
          error={form.errors.amount}
          disabled={form.useItemDetails && form.activeType === "expense"}
        />

        {form.activeType === "expense" && (
          <ItemDetails
            useItemDetails={form.useItemDetails}
            onUseItemDetailsChange={form.setUseItemDetails}
            items={form.items}
            onItemsChange={form.setItems}
          />
        )}

        <BrutalInput
          label="Deskripsi"
          value={form.description}
          onChange={(e) => form.setDescription(e.target.value)}
          error={form.errors.description}
        />

        {form.activeType !== "transfer" ? (
          <>
            <CategoryPicker
              id="edit-tx-category"
              label="Kategori"
              value={form.categoryValue}
              selectedValueLabel={form.categoryLabel}
              options={form.categories.map((c) => {
                const IconComp = (LucideIcons as any)[c.icon || "Tag"];
                return {
                  value: c.name,
                  label: c.name,
                  prefix: (
                    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center border-2 border-brutal-black", c.colorClass ? `bg-${c.colorClass}` : "bg-brutal-yellow")}>
                      <IconComp size={14} strokeWidth={2.5} className="text-white" />
                    </div>
                  )
                };
              })}
              error={form.errors.category}
              onSelect={(val: string, label: string) => {
                form.setCategoryValue(val);
                form.setCategoryLabel(label);
              }}
            />

            <CategoryPicker
              id="edit-tx-wallet"
              label="Dompet"
              value={form.walletId}
              selectedValueLabel={form.walletLabel}
              valueHint={form.walletHint}
              accentColor={form.walletColor}
              options={buildWalletOptions()}
              error={form.errors.walletId}
              onSelect={(val: string, label: string, color?: string) => {
                form.setWalletId(val);
                form.setWalletLabel(label);
                form.setWalletColor(color || "");
                const opt = buildWalletOptions().find(o => o.value === val);
                form.setWalletHint(opt?.sublabel || "");
              }}
            />
          </>
        ) : (
          <>
            <CategoryPicker
              id="edit-from-wallet"
              label="Dari Dompet (Sumber)"
              value={form.fromWalletId}
              selectedValueLabel={form.fromWalletLabel}
              accentColor={form.fromWalletColor}
              options={buildWalletOptions(form.toWalletId)}
              error={form.errors.fromWalletId}
              onSelect={(val: string, label: string, color?: string) => {
                form.setFromWalletId(val);
                form.setFromWalletLabel(label);
                form.setFromWalletColor(color || "");
              }}
            />

            <CategoryPicker
              id="edit-to-wallet"
              label="Ke Dompet (Tujuan)"
              value={form.toWalletId}
              selectedValueLabel={form.toWalletLabel}
              accentColor={form.toWalletColor}
              options={buildWalletOptions(form.fromWalletId)}
              error={form.errors.toWalletId}
              onSelect={(val: string, label: string, color?: string) => {
                form.setToWalletId(val);
                form.setToWalletLabel(label);
                form.setToWalletColor(color || "");
              }}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider">
                Biaya Transfer <span className="font-medium opacity-50 normal-case">(opsional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-brutal-black/50">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.transferFee}
                  onChange={(e) => form.setTransferFee(formatRupiah(e.target.value))}
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
            value={form.notes}
            onChange={(e) => form.setNotes(e.target.value)}
            className="w-full border-2 border-brutal-black bg-brutal-white px-4 py-3 text-sm font-medium shadow-brutal-md outline-none resize-none"
          />
        </div>

        <BrutalButton
          variant={form.activeType === "expense" ? "danger" : "primary"}
          size="lg"
          fullWidth
          onClick={form.handleSave}
          disabled={form.isLoading}
          className={activeTab.btnColor}
        >
          {form.isLoading ? "Menyimpan..." : "Simpan Perubahan"}
        </BrutalButton>
      </div>

      <ConfirmModal
        open={form.deleteOpen}
        title="Hapus Transaksi"
        message={`Yakin ingin menghapus transaksi "${form.transaction.description}"? Saldo dompet akan dikembalikan secara otomatis.`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        variant="danger"
        onConfirm={form.handleDeleteConfirm}
        onCancel={() => form.setDeleteOpen(false)}
      />
    </div>
  );
}
