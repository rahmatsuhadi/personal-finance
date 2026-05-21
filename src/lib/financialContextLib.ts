import { db } from "@/db/db";
import { format, startOfMonth, endOfMonth, differenceInDays } from "date-fns";

export interface FinancialContextSnapshot {
  totalBalance: number;
  walletDetails: string;
  expenseToday: number;
  incomeToday: number;
  totalTransactionsToday: number;
  monthlySummary: {
    totalExpense: number;
    totalIncome: number;
    topExpenseCategories: string;
    biggestExpenseItem: string;
  };
  // ─── METRIK CANGGIH TAMBAHAN ──────────────────────────────────────────
  advancedMetrics: {
    savingsRate: number;         // Persentase uang yang berhasil ditabung bulan ini
    dailySafeBudget: number;     // Jatah jajan aman per hari untuk sisa bulan ini
    emergencyFundRatio: number;  // Rasio kesiapan dana darurat (berapakah x pengeluaran bulanan)
    financialRunwayDays: number; // Berapa hari user bisa bertahan hidup jika hari ini berhenti kerja
  };
  deviceMetadata: {
    currentDateLabel: string;
    currentTime: string;
  };
}

export const financialContextLib = {
  async generateSnapshot(): Promise<FinancialContextSnapshot> {
    const now = new Date();
    const todayStr = format(now, "yyyy-MM-dd");
    const monthStartStr = format(startOfMonth(now), "yyyy-MM-dd");
    const monthEndStr = format(endOfMonth(now), "yyyy-MM-dd");

    // 1. Ambil Data Dasar Dompet & Transaksi (Sama seperti sebelumnya)
    const wallets = await db.wallets.toArray();
    const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
    const walletDetails = wallets.map((w) => `${w.name}: Rp ${w.balance.toLocaleString("id-ID")}`).join(", ");

    const txsToday = await db.transactions.where("date").equals(todayStr).toArray();
    const expenseToday = txsToday.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
    const incomeToday = txsToday.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);

    const txsMonth = await db.transactions.where("date").between(monthStartStr, monthEndStr, true, true).toArray();
    const totalExpenseMonth = txsMonth.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
    const totalIncomeMonth = txsMonth.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);

    // Kategori & Item Terbesar (Sama seperti sebelumnya)
    const catMap = new Map<string, number>();
    const expenseTxsMonth = txsMonth.filter((t) => t.type === "expense");
    expenseTxsMonth.forEach((t) => catMap.set(t.category, (catMap.get(t.category) ?? 0) + t.amount));
    const sortedCategories = [...catMap.entries()].sort(([, a], [, b]) => b - a).slice(0, 3).map(([cat, amt]) => `${cat} (Rp ${amt.toLocaleString("id-ID")})`).join(", ");
    let biggestExpenseItem = "Tidak ada pengeluaran";
    if (expenseTxsMonth.length > 0) {
      const topTx = expenseTxsMonth.sort((a, b) => b.amount - a.amount)[0];
      biggestExpenseItem = `${topTx.description} (Rp ${topTx.amount.toLocaleString("id-ID")})`;
    }

    // 2. ─── LOGIKA KALKULASI METRIK CANGGIH (ADVANCED FINANCIAL METRICS) ───
    
    // RUMUS A: Savings Rate (Idealnya > 20%)
    // Berapa persen pendapatan bulan ini yang tersisa setelah dikurangi pengeluaran
    let savingsRate = 0;
    if (totalIncomeMonth > 0) {
      const savings = totalIncomeMonth - totalExpenseMonth;
      savingsRate = Math.round((savings / totalIncomeMonth) * 100);
    }

    // RUMUS B: Daily Safe Budget
    // (Sisa Saldo Dompet) dibagi (Sisa Jumlah Hari di Bulan Ini)
    const totalDaysInMonth = differenceInDays(new Date(monthEndStr), new Date(monthStartStr)) + 1;
    const currentDayOfMonths = now.getDate();
    const daysRemaining = totalDaysInMonth - currentDayOfMonths + 1;
    const dailySafeBudget = daysRemaining > 0 ? Math.round(totalBalance / daysRemaining) : totalBalance;

    // RUMUS C: Kesiapan Dana Darurat & Runway Time
    // Menggunakan asumsi rata-rata pengeluaran bulanan user. Jika data bulanan masih baru, kita gunakan default minimum
    const averageMonthlyExpense = totalExpenseMonth > 0 ? totalExpenseMonth : 1500000; 
    
    // Emergency Fund Ratio: Menghitung kekuatan total saldo jika dikonversi menjadi cadangan biaya hidup bulanan
    const emergencyFundRatio = parseFloat((totalBalance / averageMonthlyExpense).toFixed(1));

    // Financial Runway Days: Prediksi sisa waktu bertahan hidup (dalam hari) jika hari ini user kehilangan pendapatan
    // Rumus: (Total Saldo saat ini) / (Rata-rata pengeluaran harian bulan ini)
    const dailyExpenseRate = totalExpenseMonth > 0 ? (totalExpenseMonth / currentDayOfMonths) : 50000;
    const financialRunwayDays = dailyExpenseRate > 0 ? Math.round(totalBalance / dailyExpenseRate) : 30;


    // 3. Rakit Final Object Snapshot
    return {
      totalBalance,
      walletDetails: walletDetails || "Tidak ada dompet tercatat",
      expenseToday,
      incomeToday,
      totalTransactionsToday: txsToday.length,
      monthlySummary: {
        totalExpense: totalExpenseMonth,
        totalIncome: totalIncomeMonth,
        topExpenseCategories: sortedCategories || "Belum ada kategori pengeluaran",
        biggestExpenseItem,
      },
      // Pasang metrik baru ke dalam payload pengiriman
      advancedMetrics: {
        savingsRate,
        dailySafeBudget,
        emergencyFundRatio,
        financialRunwayDays
      },
      deviceMetadata: {
        currentDateLabel: format(now, "eeee, d MMMM yyyy"),
        currentTime: format(now, "HH:mm"),
      },
    };
  }
};