import { db } from "@/db/db";
import { formatIDR } from "@/lib/utils";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export async function generateResponse(query: string): Promise<string> {
  const q = query.toLowerCase().trim();
  const today = format(new Date(), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");
  const todayLabel = format(new Date(), "d MMMM yyyy", { locale: idLocale });
  const monthLabel = format(new Date(), "MMMM yyyy", { locale: idLocale });

  // ── Transaksi hari ini ──────────────────────────────────────────────────────
  if (q.includes("hari ini") && (q.includes("transaksi") || q.includes("berapa"))) {
    const txs = await db.transactions.where("date").equals(today).toArray();
    if (txs.length === 0) {
      return `📅 Hari ini (${todayLabel}) kamu belum punya transaksi sama sekali. Yuk catat pengeluaran atau pemasukan pertamamu!`;
    }
    const income = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return `📊 **Transaksi Hari Ini** (${todayLabel}):\n\n• Total transaksi: **${txs.length} transaksi**\n• Pemasukan: ${formatIDR(income)}\n• Pengeluaran: ${formatIDR(expense)}\n• Selisih: ${formatIDR(income - expense)}\n\n${txs.slice(0, 3).map((t) => `  – ${t.description}: ${formatIDR(t.amount)}`).join("\n")}${txs.length > 3 ? `\n  ... dan ${txs.length - 3} transaksi lainnya.` : ""}`;
  }

  // ── Total saldo ─────────────────────────────────────────────────────────────
  if (q.includes("saldo") || q.includes("dompet")) {
    const wallets = await db.wallets.toArray();
    if (wallets.length === 0) {
      return "💳 Kamu belum punya dompet. Buka tab **Profil** lalu tambah dompet pertamamu!";
    }
    const total = wallets.reduce((s, w) => s + w.balance, 0);
    const detail = wallets.map((w) => `  • ${w.name}: ${formatIDR(w.balance)}`).join("\n");
    return `💰 **Total Saldo Semua Dompet**: ${formatIDR(total)}\n\nRincian:\n${detail}`;
  }

  // ── Pengeluaran bulan ini ───────────────────────────────────────────────────
  if (q.includes("pengeluaran") || q.includes("keluar")) {
    const txs = await db.transactions.where("date").between(monthStart, monthEnd, true, true).filter((t) => t.type === "expense").toArray();
    const total = txs.reduce((s, t) => s + t.amount, 0);
    const catMap = new Map<string, number>();
    txs.forEach((t) => catMap.set(t.category, (catMap.get(t.category) ?? 0) + t.amount));
    const sorted = [...catMap.entries()].sort(([, a], [, b]) => b - a);
    if (total === 0) return `🎉 Belum ada pengeluaran di bulan ${monthLabel}. Finansialmu aman!`;
    const catLines = sorted.slice(0, 5).map(([cat, amt]) => `  • ${cat}: ${formatIDR(amt)}`).join("\n");
    return `📉 **Pengeluaran Bulan ${monthLabel}**: ${formatIDR(total)}\n\nKategori terbesar:\n${catLines}`;
  }

  // ── Pemasukan bulan ini ─────────────────────────────────────────────────────
  if (q.includes("pemasukan") || q.includes("masuk") || q.includes("gaji")) {
    const txs = await db.transactions.where("date").between(monthStart, monthEnd, true, true).filter((t) => t.type === "income").toArray();
    const total = txs.reduce((s, t) => s + t.amount, 0);
    if (total === 0) return `📥 Belum ada pemasukan tercatat di bulan ${monthLabel}. Yuk catat gaji atau pendapatan kamu!`;
    return `📈 **Pemasukan Bulan ${monthLabel}**: ${formatIDR(total)}\nDari **${txs.length} transaksi** pemasukan.`;
  }

  // ── Transaksi terbesar ──────────────────────────────────────────────────────
  if (q.includes("terbesar") || q.includes("paling besar") || q.includes("terbanyak")) {
    const txs = await db.transactions.where("date").between(monthStart, monthEnd, true, true).filter((t) => t.type === "expense").sortBy("amount");
    const top = txs.reverse().slice(0, 3);
    if (top.length === 0) return "📊 Belum ada data pengeluaran bulan ini.";
    const lines = top.map((t, i) => `  ${i + 1}. ${t.description} (${t.category}): ${formatIDR(t.amount)}`).join("\n");
    return `🏆 **Pengeluaran Terbesar Bulan Ini**:\n${lines}`;
  }

  // ── Tips keuangan ───────────────────────────────────────────────────────────
  if (q.includes("tips") || q.includes("saran") || q.includes("hemat") || q.includes("nabung")) {
    const txs = await db.transactions.where("date").between(monthStart, monthEnd, true, true).toArray();
    const income = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const ratio = income > 0 ? Math.round((expense / income) * 100) : 0;
    return `💡 **Tips Keuangan untuk Kamu**:\n\n${income > 0 ? `• Bulan ini kamu menggunakan **${ratio}%** dari pemasukan untuk pengeluaran.\n` : ""}• Idealnya pengeluaran ≤ **70%** dari pemasukan.\n• Sisihkan minimal **20%** untuk tabungan atau investasi.\n• **10%** untuk kebutuhan tak terduga.\n\nAturan ini dikenal sebagai metode **70/20/10** 📊`;
  }

  // ── Kategori ────────────────────────────────────────────────────────────────
  if (q.includes("kategori")) {
    const txs = await db.transactions.where("date").between(monthStart, monthEnd, true, true).filter((t) => t.type === "expense").toArray();
    if (txs.length === 0) return "📂 Belum ada pengeluaran bulan ini.";
    const catMap = new Map<string, number>();
    txs.forEach((t) => catMap.set(t.category, (catMap.get(t.category) ?? 0) + t.amount));
    const sorted = [...catMap.entries()].sort(([, a], [, b]) => b - a);
    const lines = sorted.map(([c, a]) => `  • ${c}: ${formatIDR(a)}`).join("\n");
    return `📂 **Pengeluaran per Kategori** (${monthLabel}):\n${lines}`;
  }

  // ── Halo / greeting ─────────────────────────────────────────────────────────
  if (q.includes("halo") || q.includes("hai") || q.includes("hi") || q.includes("hello")) {
    const user = await db.user_profile.get(1);
    return `👋 Halo ${user?.name ?? ""}! Aku adalah asisten keuanganmu. Kamu bisa tanya:\n\n• "Berapa transaksi hari ini?"\n• "Total saldo dompetku"\n• "Pengeluaran bulan ini"\n• "Tips hemat uang"\n• "Pengeluaran terbesar"`;
  }

  return "__LOCAL_FALLBACK__";
}