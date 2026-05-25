import { db } from "@/db/db";
import type { ParsedTransaction } from "@/types";

export async function parseTransactionQuery(query: string): Promise<ParsedTransaction | null> {
  const q = query.toLowerCase().trim();
  
  // Deteksi kata kunci pengeluaran (beli, bayar, makan, dll)
  const isExpense = q.includes("beli") || q.includes("bayar") || q.includes("makan") || q.includes("pake") || q.includes("keluar");
  const isIncome = q.includes("gaji") || q.includes("masuk") || q.includes("terima");
  
  if (!isExpense && !isIncome) return null;

  // 1. Ekstraksi Nominal Angka
  let amount = 0;
  
  // Deteksi pola: angka diikuti "ribu", "rb", "k", "juta", "jt"
  // Contoh: "10 ribu", "10rb", "10k", "1.5 juta", "100ribu"
  const suffixMatch = q.match(/(\d+(?:[.,]\d+)?)\s*(ribu|rb|k|juta|jt)\b/);
  if (suffixMatch) {
    const base = parseFloat(suffixMatch[1].replace(",", "."));
    const suffix = suffixMatch[2];
    if (suffix === "ribu" || suffix === "rb" || suffix === "k") {
      amount = base * 1000;
    } else if (suffix === "juta" || suffix === "jt") {
      amount = base * 1000000;
    }
  } else {
    // Cari angka biasa (misal: 10.000, 10000, 250000)
    const numMatches = q.match(/\b\d+[\d.,]*\b/g);
    if (numMatches) {
      // Cari angka yang bukan tahun (biasanya tahun 2020-2030)
      const nonYearMatches = numMatches.filter(n => {
        const val = parseInt(n.replace(/[.,]/g, ""));
        return val < 2020 || val > 2035;
      });
      const targetMatch = nonYearMatches.length > 0 ? nonYearMatches[0] : numMatches[0];
      amount = parseInt(targetMatch.replace(/[.,]/g, ""));
    }
  }

  // 2. Deteksi Dompet
  const activeWallets = await db.wallets.toArray();
  let walletName = activeWallets.length > 0 ? activeWallets[0].name : "Utama";

  for (const wallet of activeWallets) {
    const lowerWalletName = wallet.name.toLowerCase();
    if (q.includes(lowerWalletName)) {
      walletName = wallet.name;
      break;
    }
  }

  // 3. Ekstraksi Deskripsi
  // Ambil teks setelah kata kunci tindakan (beli/bayar/makan/gaji) dan sebelum nominal/keterangan lain
  let description = "Transaksi Otomatis";
  
  // Cari index kata kunci tindakan
  const actionMatch = q.match(/\b(beli|bayar|makan|gaji)\b/);
  if (actionMatch && actionMatch.index !== undefined) {
    const startIndex = actionMatch.index + actionMatch[0].length;
    const remainingText = q.slice(startIndex).trim();
    
    // Potong di bagian awal angka/nominal atau kata penunjuk waktu/dompet
    const stopWords = [
      /\b\d/,                    // digit
      /\bsebesar\b/,
      /\bsebanyak\b/,
      /\bke\s+dompet\b/,
      /\bdi\s+dompet\b/,
      /\bhari\s+ini\b/,
      /\bkemarin\b/,
    ];
    
    let cutIndex = remainingText.length;
    for (const pattern of stopWords) {
      const match = remainingText.match(pattern);
      if (match && match.index !== undefined && match.index < cutIndex) {
        cutIndex = match.index;
      }
    }
    
    const candidateDesc = remainingText.slice(0, cutIndex).trim();
    if (candidateDesc) {
      description = candidateDesc;
    }
  } else if (isIncome && q.includes("gaji")) {
    description = "Gaji Bulanan";
  }

  // Bersihkan karakter aneh di akhir deskripsi (seperti koma, titik, kurung siku, dll)
  description = description.replace(/[,;.:\]\s]+$/, "");

  return {
    description: description.charAt(0).toUpperCase() + description.slice(1),
    amount: amount || 0,
    walletName,
    type: isIncome ? "income" : "expense",
    date: new Date().toISOString().split("T")[0],
  };
}