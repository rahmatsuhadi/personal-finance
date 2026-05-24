import { useState } from "react";
import { AppHeader } from "@/components/atoms/AppHeader";
import { useCategories } from "@/hooks/useCategories";
import { CategoryFormModal } from "@/components/molecules/CategoryFormModal";
import { ConfirmModal } from "@/components/atoms/ConfirmModal";
import { cn } from "@/lib/utils";
import { Plus, Pencil, Trash2 } from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { Category } from "@/db/db";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function CategoryListScreen() {
  const navigate = useNavigate();
  const { incomeCategories, expenseCategories, addCategory, updateCategory, removeCategory } = useCategories();
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const activeCategories = activeTab === "expense" ? expenseCategories : incomeCategories;

  async function handleDeleteConfirm() {
    if (deletingCategory?.id) {
      await removeCategory(deletingCategory.id);
      toast.success("Kategori berhasil dihapus!");
    }
    setDeletingCategory(null);
  }

  return (
    <div className="flex flex-col h-full bg-brutal-bg">
      {/* Header */}
      <AppHeader
        title="Kelola Kategori"
        bgColor="bg-brutal-orange"
        onBack={() => navigate(-1)}
        action={
          <button
            onClick={() => setAddModalOpen(true)}
            className="flex h-8 w-8 items-center justify-center border-2 border-brutal-black bg-brutal-lime shadow-brutal-sm brutal-press"
          >
            <Plus size={16} strokeWidth={3} />
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex border-b-2 border-brutal-black divide-x-2 divide-brutal-black bg-brutal-bg z-10">
        <button
          onClick={() => setActiveTab("expense")}
          className={cn(
            "flex-1 py-3 text-sm font-black uppercase tracking-wider brutal-press",
            activeTab === "expense"
              ? "bg-brutal-black text-brutal-rose"
              : "bg-brutal-bg text-brutal-black"
          )}
        >
          Pengeluaran
        </button>
        <button
          onClick={() => setActiveTab("income")}
          className={cn(
            "flex-1 py-3 text-sm font-black uppercase tracking-wider brutal-press",
            activeTab === "income"
              ? "bg-brutal-black text-brutal-emerald"
              : "bg-brutal-bg text-brutal-black"
          )}
        >
          Pemasukan
        </button>
      </div>

      {/* Category List */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 pb-24">
        {activeCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <p className="text-sm font-bold uppercase">Belum ada kategori.</p>
          </div>
        ) : (
          activeCategories.map((cat) => {
            const IconComp = cat.icon ? (LucideIcons as any)[cat.icon] : LucideIcons.Tag;

            return (
              <div
                key={cat.id}
                className="flex items-center gap-3 border-2 border-brutal-black bg-brutal-white p-3 shadow-brutal-sm"
              >
                {/* Icon Box */}
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center border-2 border-brutal-black",
                    cat.colorClass ? `bg-${cat.colorClass}` : "bg-brutal-yellow"
                  )}
                >
                  {IconComp && <IconComp size={20} strokeWidth={2.5} className="text-white" />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{cat.name}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingCategory(cat)}
                    className="flex h-8 w-8 items-center justify-center border-2 border-brutal-black bg-brutal-lime shadow-brutal-sm brutal-press"
                  >
                    <Pencil size={14} strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={() => setDeletingCategory(cat)}
                    className="flex h-8 w-8 items-center justify-center border-2 border-brutal-black bg-brutal-rose shadow-brutal-sm brutal-press"
                  >
                    <Trash2 size={14} strokeWidth={2.5} className="text-white" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      <CategoryFormModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSave={addCategory}
        defaultType={activeTab}
        mode="add"
      />

      {editingCategory && (
        <CategoryFormModal
          open={!!editingCategory}
          onClose={() => setEditingCategory(null)}
          onSave={async (data) => {
            if (editingCategory.id) {
              await updateCategory(editingCategory.id, data);
            }
          }}
          initialData={editingCategory}
          mode="edit"
        />
      )}

      <ConfirmModal
        open={!!deletingCategory}
        title="Hapus Kategori"
        message={`Yakin ingin menghapus kategori "${deletingCategory?.name}"? Transaksi lama yang menggunakan kategori ini akan tetap menampilkan namanya, namun tanpa ikon kustom.`}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingCategory(null)}
      />
    </div>
  );
}
