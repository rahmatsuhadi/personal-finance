import { db, type Transaction } from "@/db/db";
import { transactionRepository } from "@/repositories/transactionRepository";
import { applyBalanceAdd } from "@/hooks/useTransactions";

export interface AddTxIntentData {
  type: "income" | "expense" | "transfer";
  amount: number;
  description: string;
  category: string;
  walletName?: string;
  fromWalletName?: string;
  toWalletName?: string;
}

export interface IntentPayload {
  type: "ADD_TX";
  data: AddTxIntentData;
}

function getLevenshteinDistance(a: string, b: string): number {
  const tmp: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[a.length][b.length];
}

export function fuzzyMatch(input: string, targets: string[]): string | null {
  if (!input) return null;
  const cleanInput = input.trim().toLowerCase();
  
  // 1. Check exact match (case insensitive)
  for (const target of targets) {
    if (target.trim().toLowerCase() === cleanInput) {
      return target;
    }
  }

  // 2. Check substring match
  for (const target of targets) {
    const cleanTarget = target.trim().toLowerCase();
    if (cleanTarget.includes(cleanInput) || cleanInput.includes(cleanTarget)) {
      return target;
    }
  }

  // 3. Levenshtein fallback (allow up to 2 edits)
  let bestMatch: string | null = null;
  let minDistance = Infinity;

  for (const target of targets) {
    const distance = getLevenshteinDistance(cleanInput, target.trim().toLowerCase());
    if (distance < minDistance && distance <= 2) {
      minDistance = distance;
      bestMatch = target;
    }
  }

  return bestMatch;
}

export async function dispatchIntent(intent: IntentPayload): Promise<{ id: string; transaction: Omit<Transaction, "id" | "updatedAt"> }> {
  if (intent.type !== "ADD_TX") {
    throw new Error(`Unsupported intent type: ${intent.type}`);
  }

  const { data } = intent;
  
  // Get all wallets and categories to do fuzzy matching
  const [wallets, categories] = await Promise.all([
    db.wallets.toArray(),
    db.categories.toArray()
  ]);

  const walletNames = wallets.map(w => w.name);
  const categoryNames = categories.map(c => c.name);

  // Resolve Category
  const resolvedCategory = fuzzyMatch(data.category, categoryNames) || data.category || "Lainnya";

  // Resolve Wallets
  let walletId: string | undefined;
  let fromWalletId: string | undefined;
  let toWalletId: string | undefined;

  if (data.type === "transfer") {
    const matchedFrom = data.fromWalletName ? fuzzyMatch(data.fromWalletName, walletNames) : null;
    const matchedTo = data.toWalletName ? fuzzyMatch(data.toWalletName, walletNames) : null;
    
    const fromW = matchedFrom ? wallets.find(w => w.name === matchedFrom) : null;
    const toW = matchedTo ? wallets.find(w => w.name === matchedTo) : null;

    fromWalletId = fromW?.id;
    toWalletId = toW?.id;
  } else {
    const matchedWallet = data.walletName ? fuzzyMatch(data.walletName, walletNames) : null;
    const w = matchedWallet ? wallets.find(w => w.name === matchedWallet) : null;
    walletId = w?.id || wallets[0]?.id; // Default to first wallet if not found
  }

  // Construct Transaction Object
  const tx: Omit<Transaction, "id" | "updatedAt"> = {
    type: data.type,
    amount: data.amount,
    description: data.description || "Transaksi AI",
    category: resolvedCategory,
    date: new Date().toISOString().split("T")[0],
  };

  if (walletId) tx.walletId = walletId;
  if (fromWalletId) tx.fromWalletId = fromWalletId;
  if (toWalletId) tx.toWalletId = toWalletId;

  // Add transaction to DB and apply balance
  const id = await transactionRepository.add(tx);
  await applyBalanceAdd(tx);

  return { id, transaction: tx };
}
