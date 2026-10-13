import { db } from "@/db/db";

export interface QueryFinancialDataArgs {
  startDate: string;
  endDate: string;
  type?: "all" | "expense" | "income" | "transfer";
  category?: string;
  groupBy?: "category" | "month" | "none";
}

export interface BudgetStatusArgs {
  category?: string;
  cycle?: "weekly" | "monthly" | "yearly";
}

// Eksekusi tool queryFinancialData langsung di lokal IndexedDB / Dexie
export async function executeQueryFinancialData(args: QueryFinancialDataArgs) {
  const { startDate, endDate, type = "all", category, groupBy = "none" } = args;

  // Filter transaksi berdasarkan range tanggal
  let txs = await db.transactions
    .where("date")
    .between(startDate, endDate, true, true)
    .toArray();

  if (type !== "all") {
    txs = txs.filter((t) => t.type === type);
  }

  if (category) {
    const cleanCat = category.trim().toLowerCase();
    txs = txs.filter((t) => t.category?.toLowerCase().includes(cleanCat));
  }

  const totalCount = txs.length;
  const totalAmount = txs.reduce((sum, t) => sum + t.amount, 0);

  // Hitung pengelompokan jika diminta
  const grouped: Record<string, number> = {};
  if (groupBy === "category") {
    for (const t of txs) {
      const cat = t.category || "Lainnya";
      grouped[cat] = (grouped[cat] || 0) + t.amount;
    }
  } else if (groupBy === "month") {
    for (const t of txs) {
      const monthKey = t.date.slice(0, 7); // YYYY-MM
      grouped[monthKey] = (grouped[monthKey] || 0) + t.amount;
    }
  }

  // Ambil transaksi terbesar sebagai highlight ringkas
  const topTransactions = [...txs]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((t) => ({
      date: t.date,
      desc: t.description,
      amount: t.amount,
      category: t.category,
    }));

  return {
    queryRange: { startDate, endDate, type, category },
    totalTransactions: totalCount,
    totalAmount,
    breakdown: Object.keys(grouped).length > 0 ? grouped : undefined,
    topTransactions,
  };
}

// Eksekusi tool getBudgetStatus di lokal IndexedDB / Dexie
export async function executeGetBudgetStatus(args: BudgetStatusArgs) {
  const budgets = await db.budgets.toArray();
  const categories = await db.categories.toArray();

  const currentDate = new Date();
  const currentMonth = currentDate.toISOString().slice(0, 7); // YYYY-MM

  // Ambil pengeluaran bulan berjalan
  const monthlyExpenses = await db.transactions
    .where("date")
    .between(`${currentMonth}-01`, `${currentMonth}-31`, true, true)
    .filter((t) => t.type === "expense")
    .toArray();

  const categoryMap = new Map<string, string>();
  for (const c of categories) {
    categoryMap.set(c.id, c.name);
  }

  const results = [];

  for (const b of budgets) {
    if (args.cycle && b.cycle !== args.cycle) continue;

    const budgetCatNames = b.categoryIds
      .map((id) => categoryMap.get(id))
      .filter(Boolean) as string[];

    if (
      args.category &&
      !budgetCatNames.some((c) => c.toLowerCase().includes(args.category!.toLowerCase()))
    ) {
      continue;
    }

    const spent = monthlyExpenses
      .filter((t) => budgetCatNames.includes(t.category))
      .reduce((sum, t) => sum + t.amount, 0);

    const remaining = b.amount - spent;
    const percentage = Math.round((spent / b.amount) * 100);

    results.push({
      budgetName: b.name,
      cycle: b.cycle,
      allocatedAmount: b.amount,
      spentAmount: spent,
      remainingAmount: remaining,
      usagePercentage: `${percentage}%`,
      isOverBudget: remaining < 0,
    });
  }

  return {
    period: currentMonth,
    budgets: results,
  };
}
