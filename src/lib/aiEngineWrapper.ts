// import { db } from "@/db/db";
// import { financialContextLib } from "@/lib/financialContextLib";
import type { AiResponseResult } from "@/types";
import { parseTransactionQuery } from "@/utlis/aiParser";
import { generateResponse } from "@/utlis/localParser";

export async function generateAiResponseExtended(query: string): Promise<AiResponseResult> {
    // Cek format pencatatan transaksi lokal (Struktur Regex)
    const parsed = await parseTransactionQuery(query);
    if (parsed && parsed.amount > 0) {
        return {
            text: `Aku mendeteksi kamu ingin mencatat transaksi baru. Harap konfirmasi detail di bawah ini ya!`,
            metadata: {
                type: "transaction_confirmation",
                data: parsed,
                isApproved: false
            }
        };
    }

    // 2. Cek kecocokan rules teks lokal (Saldo, Pengeluaran, dll)
    const localText = await generateResponse(query);
    if (localText !== "__LOCAL_FALLBACK__") {
        return { text: localText };
    }
    else {
        return { text: "Under Maintenance" };
    }

    // 3. CLOUD FALLBACK: Kirim ringkasan instan Dexie + chat ke server Gemini Next.js
    // try {
    //     const userProfile = await db.user_profile.get(1);
    //     const localUserName = userProfile?.name || "Guest";

    //     // Bangun snapshot parameter keuangan dinamis dari database lokal
    //     const localFinancialContext = await financialContextLib.generateSnapshot();

    //     const response = await fetch("http://miniature-train-g6wj77jqj6vcwgq9-3000.app.github.dev/api/chat", {
    //         method: "POST",
    //         // headers: { "Content-Type": "application/json" },
    //         body: JSON.stringify({
    //             message: query,
    //             userName: localUserName,
    //             context: localFinancialContext
    //         }),
    //     });

    //     const result = await response.json();
    //     if (!response.ok) throw new Error(result.error || "Server AI error");

    //     return {
    //         text: result.data.content,
    //         metadata: result.metadata
    //     };

    // } catch (error) {
    //     console.error("Cloud Fallback Failed:", error);
    //     return {
    //         text: `🤔 Hmm, Fin belum memahami pertanyaan tersebut karena kamu sedang offline. Jika ingin menganalisis mendalam atau memperbaiki transaksi, pastikan kamu terhubung ke internet ya!\n\nKamu tetap bisa tanya info lokal seperti: "Total saldo dompetku" atau "Transaksi hari ini".`
    //     };
    // }
}