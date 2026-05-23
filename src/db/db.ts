import Dexie, { type EntityTable } from "dexie";

// ─── Sync Metadata ────────────────────────────────────────────────────────────

export interface SyncMeta {
  serverId?: string;   // ID dari server (setelah sync berhasil)
  updatedAt: number;   // Unix timestamp ms (Last-Write-Wins)
  isDirty: boolean;    // Apakah ada perubahan lokal yang belum di-sync
  isDeleted: boolean;  // Soft delete flag
}

// ─── Type Definitions ────────────────────────────────────────────────────────

export interface UserProfile {
  id: number; // hardcoded to 1 (single-user schema)
  name: string;
}

export interface Wallet extends SyncMeta {
  id: string;  // UUID string
  name: string;
  currency: "IDR" | "USD";
  colorClass: string;
  balance: number;
}

export interface TransactionItem {
  name: string;
  price: number;
}

export interface Transaction extends SyncMeta {
  id: string;  // UUID string
  type: "income" | "expense" | "transfer";
  date: string; // ISO date string YYYY-MM-DD
  amount: number;
  description: string;
  category: string;
  walletId?: string;
  fromWalletId?: string;
  toWalletId?: string;
  transferFee?: number;
  notes?: string;
  items?: TransactionItem[];
}

export interface Category extends SyncMeta {
  id: string;  // UUID string
  name: string;
  type: "income" | "expense";
  icon?: string;
  colorClass?: string;
}

export interface Budget extends SyncMeta {
  id: string;  // UUID string
  name: string;
  categoryIds: string[];
  amount: number;
  cycle: "weekly" | "monthly" | "yearly";
}

// ─── Dexie Instance ──────────────────────────────────────────────────────────

class BrutalistFinanceDB extends Dexie {
  user_profile!: EntityTable<UserProfile, "id">;
  wallets!: EntityTable<Wallet, "id">;
  transactions!: EntityTable<Transaction, "id">;
  categories!: EntityTable<Category, "id">;
  budgets!: EntityTable<Budget, "id">;

  constructor() {
    super("BrutalistFinanceDB");

    this.version(1).stores({
      user_profile: "id, name",
      wallets: "++id, name, currency, colorClass, balance",
      transactions:
        "++id, type, date, amount, description, category, walletId, fromWalletId, toWalletId, transferFee, notes",
      categories: "++id, name, type",
    });

    this.version(2).stores({
      categories: "++id, name, type",
    }).upgrade(tx => {
      return tx.table("categories").toCollection().modify(category => {
        if (!category.icon) category.icon = "Tag";
        if (!category.colorClass) category.colorClass = "brutal-yellow";
      });
    });

    this.version(3).stores({
      budgets: "++id, categoryId, amount, cycle",
    });

    this.version(4).stores({
      budgets: "++id, name, *categoryIds, amount, cycle",
    }).upgrade(tx => {
      return tx.table("budgets").toCollection().modify(async budget => {
        if (budget.categoryId !== undefined) {
          budget.categoryIds = [budget.categoryId];
          const category = await tx.table("categories").get(budget.categoryId);
          budget.name = category ? category.name : "Anggaran";
          delete budget.categoryId;
        }
      });
    });

    this.version(5).stores({
      transactions: "++id, type, date, amount, category, walletId",
    });

    // ── v6: Migrate to UUID string IDs + sync metadata ───────────────────────
    this.version(6).stores({
      wallets: "id, name, currency, isDirty, isDeleted, updatedAt",
      transactions: "id, type, date, amount, category, walletId, isDirty, isDeleted, updatedAt",
      categories: "id, name, type, isDirty, isDeleted, updatedAt",
      budgets: "id, name, *categoryIds, isDirty, isDeleted, updatedAt",
    }).upgrade(async tx => {
      const now = Date.now();

      // ── Wallets ──────────────────────────────────────────────────────────
      const oldWallets = await tx.table("wallets").toArray();
      const walletIdMap = new Map<number, string>(); // old numeric ID → new UUID
      await tx.table("wallets").clear();
      for (const w of oldWallets) {
        const newId = crypto.randomUUID();
        walletIdMap.set(w.id, newId);
        await tx.table("wallets").add({
          ...w,
          id: newId,
          serverId: undefined,
          updatedAt: now,
          isDirty: true,
          isDeleted: false,
        });
      }

      // ── Categories ───────────────────────────────────────────────────────
      const oldCategories = await tx.table("categories").toArray();
      const categoryIdMap = new Map<number, string>();
      await tx.table("categories").clear();
      for (const c of oldCategories) {
        const newId = crypto.randomUUID();
        categoryIdMap.set(c.id, newId);
        await tx.table("categories").add({
          ...c,
          id: newId,
          serverId: undefined,
          updatedAt: now,
          isDirty: true,
          isDeleted: false,
        });
      }

      // ── Transactions ─────────────────────────────────────────────────────
      const oldTransactions = await tx.table("transactions").toArray();
      await tx.table("transactions").clear();
      for (const t of oldTransactions) {
        await tx.table("transactions").add({
          ...t,
          id: crypto.randomUUID(),
          walletId: t.walletId != null ? walletIdMap.get(t.walletId) ?? undefined : undefined,
          fromWalletId: t.fromWalletId != null ? walletIdMap.get(t.fromWalletId) ?? undefined : undefined,
          toWalletId: t.toWalletId != null ? walletIdMap.get(t.toWalletId) ?? undefined : undefined,
          serverId: undefined,
          updatedAt: now,
          isDirty: true,
          isDeleted: false,
        });
      }

      // ── Budgets ──────────────────────────────────────────────────────────
      const oldBudgets = await tx.table("budgets").toArray();
      await tx.table("budgets").clear();
      for (const b of oldBudgets) {
        await tx.table("budgets").add({
          ...b,
          id: crypto.randomUUID(),
          categoryIds: (b.categoryIds ?? []).map((cId: number) => categoryIdMap.get(cId) ?? String(cId)),
          serverId: undefined,
          updatedAt: now,
          isDirty: true,
          isDeleted: false,
        });
      }
    });
  }
}

export const db = new BrutalistFinanceDB();

// ─── Seed Default Data ───────────────────────────────────────────────────────
// Guard against StrictMode/HMR double-invoke

let _seeded = false;

export const DEFAULT_CATEGORIES: Omit<Category, "id" | "serverId" | "updatedAt" | "isDirty" | "isDeleted"> [] = [
  { name: "Gaji", type: "income", icon: "Banknote", colorClass: "brutal-emerald" },
  { name: "Bisnis", type: "income", icon: "Briefcase", colorClass: "brutal-blue" },
  { name: "Investasi", type: "income", icon: "TrendingUp", colorClass: "brutal-purple" },
  { name: "Hadiah", type: "income", icon: "Gift", colorClass: "brutal-pink" },
  { name: "Lainnya (Pemasukan)", type: "income", icon: "PlusCircle", colorClass: "brutal-cyan" },
  { name: "Makanan & Minuman", type: "expense", icon: "Coffee", colorClass: "brutal-orange" },
  { name: "Transportasi", type: "expense", icon: "Car", colorClass: "brutal-yellow" },
  { name: "Belanja", type: "expense", icon: "ShoppingCart", colorClass: "brutal-rose" },
  { name: "Tagihan & Utilitas", type: "expense", icon: "Zap", colorClass: "brutal-cyan" },
  { name: "Hiburan", type: "expense", icon: "Film", colorClass: "brutal-purple" },
  { name: "Kesehatan", type: "expense", icon: "HeartPulse", colorClass: "brutal-rose" },
  { name: "Pendidikan", type: "expense", icon: "GraduationCap", colorClass: "brutal-blue" },
  { name: "Lainnya (Pengeluaran)", type: "expense", icon: "MinusCircle", colorClass: "brutal-black" },
];

export async function seedDefaultData() {
  if (_seeded) return;
  _seeded = true;

  const now = Date.now();

  // ── Categories: dedup then add missing ──────────────────────────────────
  const allCats = await db.categories.filter(c => !c.isDeleted).toArray();

  // Remove duplicates (keep first occurrence of each name+type)
  const seen = new Set<string>();
  const toDelete: string[] = [];
  for (const cat of allCats) {
    const key = `${cat.type}::${cat.name}`;
    if (seen.has(key)) {
      toDelete.push(cat.id);
    } else {
      seen.add(key);
    }
  }
  if (toDelete.length > 0) {
    await db.categories.bulkDelete(toDelete);
  }

  // Add any missing default categories and fix missing icons
  const existingCats = await db.categories.filter(c => !c.isDeleted).toArray();
  const existingKeys = new Set(existingCats.map((c) => `${c.type}::${c.name}`));

  for (const c of existingCats) {
    if (!c.icon || c.icon === "Tag") {
      const def = DEFAULT_CATEGORIES.find(d => d.name === c.name && d.type === c.type);
      if (def) {
        await db.categories.update(c.id, { icon: def.icon, colorClass: def.colorClass });
      }
    }
  }

  const missingCats = DEFAULT_CATEGORIES.filter(
    (c) => !existingKeys.has(`${c.type}::${c.name}`)
  );
  if (missingCats.length > 0) {
    await db.categories.bulkAdd(
      missingCats.map(c => ({
        ...c,
        id: crypto.randomUUID(),
        updatedAt: now,
        isDirty: true,
        isDeleted: false,
      }))
    );
  }

  // ── Wallets: seed only if empty ─────────────────────────────────────────
  const walletCount = await db.wallets.filter(w => !w.isDeleted).count();
  if (walletCount === 0) {
    await db.wallets.bulkAdd([
      { id: crypto.randomUUID(), name: "Kas", currency: "IDR", colorClass: "brutal-lime", balance: 0, updatedAt: now, isDirty: true, isDeleted: false },
    ]);
  }
}
