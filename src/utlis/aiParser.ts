import { db } from "@/db/db";
import type { ParsedTransaction } from "@/types";

export async function parseTransactionQuery(query: string): Promise<ParsedTransaction | null> {
  const q = query.toLowerCase().trim();
  
  // Deteksi kata kunci pengeluaran  (beli, bayar, makan, dll)
  const isExpense = q.includes("beli") || q.includes("bayar") || q.includes("makan") || q.includes("pake") || q.includes("keluar");
  const isIncome = q.includes("gaji") || q.includes("masuk") || q.includes("terima");
  
  if (!isExpense && !isIncome) return null;

  // Ekstraksi Nominal Angka (10k -> 10000, 50.000 -> 50000)
  let amount = 0;
  const kMatch = q.match(/(\d+)\s*k/);
  if (kMatch) {
    amount = parseInt(kMatch[1]) * 1000;
  } else {
    const numMatch = q.match(/\b\d+[\d.,]*\b/);
    if (numMatch) {
      amount = parseInt(numMatch[0].replace(/[.,]/g, ""));
    }
  }

  const activeWallets = await db.wallets.toArray();

  let walletName = activeWallets.length > 0 ? activeWallets[0].name : "Utama";

  for (const wallet of activeWallets) {
    const lowerWalletName = wallet.name.toLowerCase();
    
    // Jika kalimat user mengandung nama dompet di database (misal user punya dompet bernama "Bank Jago")
    if (q.includes(lowerWalletName)) {
      walletName = wallet.name; // Kunci nama aslinya sesuai casing di DB (e.g., "Bank Jago")
      break;
    }
  }
  

  //  Ekstraksi Deskripsi (Ambil kata setelah beli/bayar atau sebelum angka)
  let description = "Transaksi Otomatis";
  const descMatch = q.match(/(?:beli|bayar)\s+([^0-9k\s]+(?:\s+[^0-9k\s]+)*)/);
  if (descMatch) {
    description = descMatch[1].trim();
  } else if (isIncome && q.includes("gaji")) {
    description = "Gaji Bulanan";
  }

  return {
    description: description.charAt(0).toUpperCase() + description.slice(1),
    amount: amount || 0,
    walletName,
    type: isIncome ? "income" : "expense",
    date: new Date().toISOString().split("T")[0], // Hari ini
  };
}