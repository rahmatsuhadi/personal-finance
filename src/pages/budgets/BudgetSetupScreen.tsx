import { useState } from "react";
import { AppHeader, ConfirmModal, SmallIconButton, EmptyState } from "@/components/atoms";
import { useBudgets } from "@/hooks/useBudgets";
import { useCategories } from "@/hooks/useCategories";
import { formatIDR } from "@/lib/utils";
import { Plus, Pencil, Trash2, Target } from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { Budget } from "@/db/db";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function BudgetSetupScreen() {
  const navigate = useNavigate();
  const { budgets, removeBudget } = useBudgets();
  const { expenseCategories } = useCategories();

  const [deletingBudget, setDeletingBudget] = useState<Budget | null>(null);

  async function handleDeleteConfirm() {
    if (deletingBudget?.id) {
      await removeBudget(deletingBudget.id);
      toast.success("Anggaran berhasil dihapus!");
    }
    setDeletingBudget(null);
  }

  const cycleLabels: Record<string, string> = {
    weekly: "Mingguan",
    monthly: "Bulanan",
    yearly: "Tahunan",
  };

  return (
    <div className="flex flex-col h-full bg-brutal-bg">
      <AppHeader
        title="Atur Anggaran"
        bgColor="bg-brutal-orange"
        onBack={() => navigate(-1)}
        action={
          <SmallIconButton
            onClick={() => navigate("/settings/budgets/add")}
            icon={Plus}
            variant="lime"
            size="sm"
            strokeWidth={3}
          />
        }
      />


      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 pb-24">
        {budgets.length === 0 ? (
          <EmptyState
            icon={Target}
            title="Belum ada anggaran"
            description="Buat anggaran untuk membatasi pengeluaran per kategori."
            bgColor="bg-brutal-orange"
          />
        ) : (
          budgets.map((budget) => {
            const catIds = budget.categoryIds || [];
            const cat = catIds.length > 0 ? expenseCategories.find((c) => c.id === catIds[0]) : null;

            const IconComp = cat?.icon ? (LucideIcons as any)[cat.icon] : LucideIcons.Target;

            return (
              <div
                key={budget.id}
                className="flex items-center gap-3 border-2 border-brutal-black bg-brutal-white p-3 shadow-brutal-sm"
              >
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center border-2 border-brutal-black",
                    cat?.colorClass ? `bg-${cat.colorClass}` : "bg-brutal-yellow"
                  )}
                >
                  {IconComp && <IconComp size={20} strokeWidth={2.5} className="text-white" />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{budget.name || cat?.name || "Anggaran"}</p>
                  <p className="text-[10px] font-bold text-brutal-black/60 truncate uppercase tracking-widest mt-0.5">
                    {catIds.length} Kategori
                  </p>
                  <p className="text-xs font-bold text-brutal-rose mt-1">
                    {formatIDR(budget.amount)} <span className="font-medium text-brutal-black/60">/ {cycleLabels[budget.cycle]}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <SmallIconButton
                    onClick={() => navigate(`/settings/budgets/edit/${budget.id}`)}
                    icon={Pencil}
                    variant="lime"
                    size="sm"
                  />
                  <SmallIconButton
                    onClick={() => setDeletingBudget(budget)}
                    icon={Trash2}
                    variant="rose"
                    size="sm"
                  />
                </div>
              </div>
            );
          })
        )}
      </div>



      <ConfirmModal
        open={!!deletingBudget}
        title="Hapus Anggaran"
        message="Yakin ingin menghapus anggaran ini?"
        confirmLabel="Hapus"
        cancelLabel="Batal"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingBudget(null)}
      />
    </div>
  );
}
