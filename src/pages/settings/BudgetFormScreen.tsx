import { useState, useEffect } from "react";
import { AppHeader } from "@/components/atoms/AppHeader";
import { BrutalButton } from "@/components/atoms/BrutalButton";
import { BrutalInput } from "@/components/atoms/BrutalInput";
import { SelectField } from "@/components/atoms/SelectField";
import {
  SelectPickerScreen,
  type SelectOption,
} from "@/components/molecules/SelectPickerScreen";
import { Check } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate, useParams } from "react-router-dom";
import { useBudgets } from "@/hooks/useBudgets";
import { useCategories } from "@/hooks/useCategories";

// Helpers
function formatRupiah(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return new Intl.NumberFormat("id-ID").format(parseInt(digits));
}
function parseRupiah(formatted: string): number {
  return parseInt(formatted.replace(/\D/g, "") || "0");
}

export function BudgetFormScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const { addBudget, updateBudget, budgets } = useBudgets();
  const { expenseCategories } = useCategories();

  const [name, setName] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [amount, setAmount] = useState("");
  const [cycle, setCycle] = useState<"weekly" | "monthly" | "yearly">("monthly");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [activePicker, setActivePicker] = useState<"category" | null>(null);

  // Load initial data if editing
  useEffect(() => {
    if (isEditMode && budgets.length > 0) {
      const budget = budgets.find(b => b.id === Number(id));
      if (budget) {
        setName(budget.name);
        setCategoryIds(budget.categoryIds.map(String));
        setAmount(formatRupiah(budget.amount.toString()));
        setCycle(budget.cycle);
      }
    }
  }, [isEditMode, budgets, id]);

  async function handleSave() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Nama anggaran wajib diisi.";
    if (categoryIds.length === 0) errs.categoryIds = "Minimal pilih 1 kategori.";
    const parsedAmount = parseRupiah(amount);
    if (!amount || parsedAmount <= 0) errs.amount = "Nominal harus diisi dengan benar.";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        name: name.trim(),
        categoryIds: categoryIds.map(Number),
        amount: parsedAmount,
        cycle,
      };

      if (isEditMode) {
        await updateBudget(Number(id), data);
      } else {
        await addBudget(data);
      }
      navigate(-1); // Go back after success
    } catch (e: any) {
      setErrors({ form: e.message || "Gagal menyimpan anggaran." });
    } finally {
      setIsSaving(false);
    }
  }

  // Options for categories
  const categoryOptions: SelectOption[] = expenseCategories.map(c => {
    const IconComp = c.icon ? (LucideIcons as any)[c.icon] : LucideIcons.Tag;
    return {
      value: c.id!.toString(),
      label: c.name,
      prefix: (
        <div className={cn("h-7 w-7 flex items-center justify-center border-2 border-brutal-black", c.colorClass ? `bg-${c.colorClass}` : "bg-brutal-yellow")}>
          {IconComp && <IconComp size={14} strokeWidth={2.5} className="text-white" />}
        </div>
      )
    };
  });

  return (
    <div
      className="flex flex-col min-h-full bg-brutal-bg pb-24"
      style={{ paddingTop: "var(--safe-top)" }}
    >
      <AppHeader
        title={isEditMode ? "Ubah Anggaran" : "Tambah Anggaran"}
        bgColor="bg-brutal-orange"
        onBack={() => navigate(-1)}
      />

      <div className="p-4 flex flex-col gap-6">
        {errors.form && (
          <div className="p-3 border-2 border-brutal-black bg-brutal-rose text-white text-xs font-bold shadow-brutal-sm">
            {errors.form}
          </div>
        )}

        {/* Name Input */}
        <div className="flex flex-col gap-1.5">
          <BrutalInput
            label="Nama Anggaran"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((p) => ({ ...p, name: "" }));
            }}
            error={errors.name}
            placeholder="Contoh: Kebutuhan Pokok"
          />
        </div>

        {/* Category Picker */}
        <SelectField
          id="bdgt-category"
          label="Kategori Pengeluaran"
          value={categoryIds.length > 0 ? `${categoryIds.length} Kategori Dipilih` : ""}
          placeholder="Pilih Kategori"
          error={errors.categoryIds}
          onClick={() => {
            setActivePicker("category");
          }}
        />

        {/* Amount Input */}
        <div className="flex flex-col gap-1.5">
          <BrutalInput
            label="Nominal Target"
            type="text"
            inputMode="numeric"
            value={amount ? `Rp ${amount}` : ""}
            onChange={(e) => {
              setAmount(formatRupiah(e.target.value));
              if (errors.amount) setErrors((p) => ({ ...p, amount: "" }));
              setErrors((p) => ({ ...p, amount: "" }));
            }}
            error={errors.amount}
            placeholder="Rp 0"
          />
        </div>

        {/* Cycle Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider">
            Siklus Waktu
          </label>
          <div className="flex rounded-none border-2 border-brutal-black divide-x-2 divide-brutal-black shadow-brutal-sm">
            {[
              { value: "weekly", label: "Mingguan" },
              { value: "monthly", label: "Bulanan" },
              { value: "yearly", label: "Tahunan" },
            ].map((opt) => {
              const active = cycle === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setCycle(opt.value as any)}
                  className={cn(
                    "flex-1 h-12 flex items-center justify-center text-xs font-bold uppercase transition-colors brutal-press",
                    active ? "bg-brutal-black text-white" : "bg-brutal-white text-brutal-black hover:bg-brutal-bg"
                  )}
                >
                  {active && <Check size={14} strokeWidth={3} className="mr-1" />}
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Save Button */}
        <BrutalButton
          variant="primary"
          className="w-full mt-4"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? "Menyimpan..." : "Simpan Anggaran"}
        </BrutalButton>
      </div>

      {/* Select Picker Overlay */}
      {activePicker === "category" && (
        <div className="absolute inset-0 z-[100] animate-in slide-in-from-right duration-250 ease-out bg-brutal-bg">
          <SelectPickerScreen
            title="Pilih Kategori"
            options={categoryOptions}
            selectedValues={categoryIds}
            multiple={true}
            onSelectMultiple={(vals) => {
              setCategoryIds(vals);
              setActivePicker(null);
              setErrors((prev) => ({ ...prev, categoryIds: "" }));
            }}
            onClose={() => setActivePicker(null)}
            searchable
          />
        </div>
      )}
    </div>
  );
}
