import { db } from "@/db/db";

export interface LowTokenSnapshot {
  currentDate: string;
  wallets: Array<{ id: string; name: string; balance: number }>;
  categories: string[];
  recentTransactions: Array<{ date: string; type: string; amount: number; desc: string }>;
}

export async function getLowTokenSnapshot(): Promise<LowTokenSnapshot> {
  const [wallets, categories, recentTransactions] = await Promise.all([
    db.wallets.toArray(),
    db.categories.toArray(),
    db.transactions.orderBy("date").reverse().limit(10).toArray(),
  ]);

  return {
    currentDate: new Date().toISOString().split("T")[0],
    wallets: wallets.map((w) => ({ id: w.id, name: w.name, balance: w.balance })),
    categories: categories.map((c) => c.name),
    recentTransactions: recentTransactions.map((t) => ({
      date: t.date,
      type: t.type,
      amount: t.amount,
      desc: t.description || "",
    })),
  };
}

export async function getWeeklyExpenseAggregate(): Promise<Record<string, number>> {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const limitDateString = oneWeekAgo.toISOString().split("T")[0];

  // Dexie query for transactions in last 7 days of type expense
  const recentExpenses = await db.transactions
    .where("date")
    .aboveOrEqual(limitDateString)
    .filter((t) => t.type === "expense")
    .toArray();

  const aggregate: Record<string, number> = {};
  for (const t of recentExpenses) {
    const cat = t.category || "Lainnya";
    aggregate[cat] = (aggregate[cat] || 0) + t.amount;
  }
  return aggregate;
}
