import { db } from "@/db/db";
import type { AiResponseResult } from "@/types";
import { parseTransactionQuery } from "@/utils/aiParser";
import { generateResponse } from "@/utils/localParser";
import { getLowTokenSnapshot, getWeeklyExpenseAggregate } from "@/lib/ai/contextAggregator";
import { apiClient } from "@/lib/apiClient";
import { CONFIG } from "@/config";

export async function generateAiResponseExtended(query: string): Promise<AiResponseResult> {
    // 1. Cek format pencatatan transaksi lokal (Struktur Regex)
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

    // 3. CLOUD FALLBACK: Kirim ringkasan instan Dexie + chat ke server Gemini
    try {
        const userProfile = await db.user_profile.get(1);
        const localUserName = userProfile?.name || "Guest";

        // Ambil low-token context snapshot
        const localFinancialContext = await getLowTokenSnapshot();

        // Cek jika user menanyakan tentang analisis biaya / boros
        let additionalContext = {};
        const lowerQuery = query.toLowerCase();
        if (lowerQuery.includes("boros") || lowerQuery.includes("analisis") || lowerQuery.includes("pengeluaran minggu")) {
            additionalContext = {
                weeklyExpenseAggregate: await getWeeklyExpenseAggregate()
            };
        }

        // System prompt dioptimalkan dengan Constraint-based Prompting
        const systemInstruction = 
          `You are Fin, a helpful financial assistant. Today is ${localFinancialContext.currentDate}. ` +
          "Constraint Guidelines:\n" +
          "- If the user asks to record/add a transaction, reply ONLY with a JSON object of type ADD_TX. Do not include any conversational text. Format:\n" +
          "  {\"type\": \"ADD_TX\", \"data\": {\"type\": \"income\"|\"expense\"|\"transfer\", \"amount\": number, \"description\": \"...\", \"category\": \"...\", \"walletName\": \"...\"}}\n" +
          "- If the user asks to analyze their financial data, answer in at most 3 sentences based on the provided local context.\n" +
          "- Keep all responses extremely concise to minimize token usage.";

        const result = await apiClient.post(CONFIG.ENDPOINTS.AI_CHAT, {
            message: query,
            userName: localUserName,
            systemInstruction,
            context: {
                ...localFinancialContext,
                ...additionalContext
            }
        });

        // Backend response format: result.data.content or result.text
        const textResponse = result.data?.content || result.text || "";
        
        // Coba parsing jika AI mengembalikan JSON ADD_TX
        try {
            const cleanText = textResponse.trim();
            if (cleanText.startsWith("{") && cleanText.endsWith("}")) {
                const parsedJson = JSON.parse(cleanText);
                if (parsedJson.type === "ADD_TX") {
                    return {
                        text: `Aku mendeteksi kamu ingin mencatat transaksi baru: "${parsedJson.data.description || "Transaksi"}". Apakah detail ini sudah sesuai?`,
                        metadata: {
                            type: "transaction_confirmation",
                            data: {
                                type: parsedJson.data.type || "expense",
                                amount: parsedJson.data.amount || 0,
                                description: parsedJson.data.description || "",
                                category: parsedJson.data.category || "Lainnya",
                                walletName: parsedJson.data.walletName || parsedJson.data.fromWalletName || ""
                            },
                            isApproved: false
                        }
                    };
                }
            }
        } catch (e) {
            console.warn("Response was not JSON or parsing failed:", e);
        }

        return {
            text: textResponse,
            metadata: result.metadata
        };

    } catch (error) {
        console.error("Cloud Fallback Failed:", error);
        return {
            text: `🤔 Hmm, Fin belum memahami pertanyaan tersebut karena kamu sedang offline atau server sedang tidak terjangkau. Jika ingin menganalisis mendalam atau memperbaiki transaksi, pastikan kamu terhubung ke internet ya!\n\nKamu tetap bisa tanya info lokal seperti: "Total saldo dompetku" atau "Transaksi hari ini".`
        };
    }
}