import Dexie, { type EntityTable } from "dexie";

// ─── Type Definitions ────────────────────────────────────────────────────────

export interface UserProfile {
  id: number; // hardcoded to 1 (single-user schema)
  name: string;
}

export interface Wallet {
  id?: number;
  name: string;
  currency: "IDR" | "USD";
  colorClass: string;
  balance: number;
}

export interface Transaction {
  id?: number;
  type: "income" | "expense" | "transfer";
  date: string; // ISO date string YYYY-MM-DD
  amount: number;
  description: string;
  category: string;
  walletId?: number;
  fromWalletId?: number;
  toWalletId?: number;
  transferFee?: number;
  notes?: string;
}

export interface Category {
  id?: number;
  name: string;
  type: "income" | "expense";
  icon?: string;
  colorClass?: string;
}

// ─── Dexie Instance ──────────────────────────────────────────────────────────

class BrutalistFinanceDB extends Dexie {
  user_profile!: EntityTable<UserProfile, "id">;
  wallets!: EntityTable<Wallet, "id">;
  transactions!: EntityTable<Transaction, "id">;
  categories!: EntityTable<Category, "id">;

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
  }
}

export const db = new BrutalistFinanceDB();

// ─── Seed Default Data ───────────────────────────────────────────────────────
// Guard against StrictMode/HMR double-invoke

let _seeded = false;

export const DEFAULT_CATEGORIES: Category[] = [
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

  // ── Categories: dedup then add missing ──────────────────────────────────
  const allCats = await db.categories.toArray();

  // Remove duplicates (keep first occurrence of each name+type)
  const seen = new Set<string>();
  const toDelete: number[] = [];
  for (const cat of allCats) {
    const key = `${cat.type}::${cat.name}`;
    if (seen.has(key)) {
      if (cat.id != null) toDelete.push(cat.id);
    } else {
      seen.add(key);
    }
  }
  if (toDelete.length > 0) {
    await db.categories.bulkDelete(toDelete);
  }

  // Add any missing default categories and fix missing icons
  const existingCats = await db.categories.toArray();
  const existingKeys = new Set(existingCats.map((c) => `${c.type}::${c.name}`));

  for (const c of existingCats) {
    if (!c.icon || c.icon === "Tag") {
      const def = DEFAULT_CATEGORIES.find(d => d.name === c.name && d.type === c.type);
      if (def && c.id != null) {
        await db.categories.update(c.id, { icon: def.icon, colorClass: def.colorClass });
      }
    }
  }

  const missingCats = DEFAULT_CATEGORIES.filter(
    (c) => !existingKeys.has(`${c.type}::${c.name}`)
  );
  if (missingCats.length > 0) {
    await db.categories.bulkAdd(missingCats);
  }

  // ── Wallets: seed only if empty ─────────────────────────────────────────
  const walletCount = await db.wallets.count();
  if (walletCount === 0) {
    await db.wallets.bulkAdd([
      { name: "Kas", currency: "IDR", colorClass: "brutal-lime", balance: 0 },
      // { name: "Bank BCA", currency: "IDR", colorClass: "brutal-cyan", balance: 0 },
    ]);
  }
}
