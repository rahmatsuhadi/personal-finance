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
  }
}

export const db = new BrutalistFinanceDB();

// ─── Seed Default Data ───────────────────────────────────────────────────────
// Guard against StrictMode/HMR double-invoke

let _seeded = false;

const DEFAULT_CATEGORIES: { name: string; type: "income" | "expense" }[] = [
  { name: "Gaji", type: "income" },
  { name: "Bisnis", type: "income" },
  { name: "Investasi", type: "income" },
  { name: "Hadiah", type: "income" },
  { name: "Lainnya (Pemasukan)", type: "income" },
  { name: "Makanan & Minuman", type: "expense" },
  { name: "Transportasi", type: "expense" },
  { name: "Belanja", type: "expense" },
  { name: "Tagihan & Utilitas", type: "expense" },
  { name: "Hiburan", type: "expense" },
  { name: "Kesehatan", type: "expense" },
  { name: "Pendidikan", type: "expense" },
  { name: "Lainnya (Pengeluaran)", type: "expense" },
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

  // Add any missing default categories
  const existingCats = await db.categories.toArray();
  const existingKeys = new Set(existingCats.map((c) => `${c.type}::${c.name}`));
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
      { name: "Bank BCA", currency: "IDR", colorClass: "brutal-cyan", balance: 0 },
    ]);
  }
}
