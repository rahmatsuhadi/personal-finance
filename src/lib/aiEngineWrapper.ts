import { db } from "@/db/db";
import type { AiResponseResult } from "@/types";
import { parseTransactionQuery } from "@/utils/aiParser";
import { generateResponse } from "@/utils/localParser";
import { getLowTokenSnapshot, getWeeklyExpenseAggregate } from "@/lib/ai/contextAggregator";
import { getAiConfig, sendBackendChat } from "@/lib/aiConfig";
import { streamBackendChat, type StreamEventCallbacks } from "@/lib/ai/streamEngine";

// Eksekusi streaming chat dengan fallback offline-first
export async function generateAiResponseStream(
  query: string,
  callbacks: StreamEventCallbacks,
  history: Array<{ role: string; content?: string | null }> = []
): Promise<AiResponseResult> {
  // 1. Cek format pencatatan transaksi lokal (Struktur Regex)
  const parsed = await parseTransactionQuery(query);
  if (parsed && parsed.amount > 0) {
    const text = "Aku mendeteksi kamu ingin mencatat transaksi baru. Harap konfirmasi detail di bawah ini ya!";
    callbacks.onDelta?.(text);
    return {
      text,
      metadata: {
        type: "transaction_confirmation",
        data: parsed,
        isApproved: false,
      },
    };
  }

  // 2. Cek kecocokan rules teks lokal (Saldo, Pengeluaran, dll)
  const localText = await generateResponse(query);
  if (localText !== "__LOCAL_FALLBACK__") {
    callbacks.onDelta?.(localText);
    return { text: localText };
  }

  // 3. Cek apakah integrasi backend AI aktif
  const aiConfig = getAiConfig();
  if (!aiConfig.enabled || !aiConfig.apiKey.trim()) {
    const notice =
      "⚠️ Mode AI saat ini terbatas (hanya perintah dasar lokal). Aktifkan integrasi dan masukkan API Key di menu Pengaturan untuk membuka kemampuan analitis Fin secara penuh.";
    callbacks.onDelta?.(notice);
    return { text: notice };
  }

  // 4. Stream ke backend dengan native SSE & tool execution
  try {
    const userProfile = await db.user_profile.get(1);
    const localUserName = userProfile?.name || "User";
    const localFinancialContext = await getLowTokenSnapshot();

    let confirmationMetadata: any = undefined;

    const streamResult = await streamBackendChat(
      {
        message: query,
        userName: localUserName,
        financialContext: localFinancialContext as unknown as Record<string, unknown>,
        history,
      },
      {
        onDelta: callbacks.onDelta,
        onToolCall: (tc) => {
          callbacks.onToolCall?.(tc);
          if (tc.name === "prepareTransaction") {
            try {
              const parsedArgs = JSON.parse(tc.arguments);
              confirmationMetadata = {
                type: "transaction_confirmation",
                data: {
                  type: parsedArgs.type || "expense",
                  amount: Number(parsedArgs.amount) || 0,
                  description: parsedArgs.description || "Transaksi",
                  category: parsedArgs.category || "Lainnya",
                  walletName: parsedArgs.walletName || parsedArgs.fromWalletName || "",
                },
                isApproved: false,
              };
            } catch {
              // Abaikan jika argument parsing gagal
            }
          }
        },
      }
    );

    let finalText = streamResult.text;
    if (!finalText && confirmationMetadata) {
      finalText = `Aku mendeteksi kamu ingin mencatat transaksi baru: "${confirmationMetadata.data.description}". Apakah detail ini sudah sesuai?`;
      callbacks.onDelta?.(finalText);
    }

    return {
      text: finalText,
      metadata: confirmationMetadata,
    };
  } catch (error) {
    console.error("Stream Backend Chat Failed:", error);
    const errMsg = error instanceof Error ? error.message : "Terjadi kesalahan saat memanggil AI.";
    const failText = `🤔 Fin mengalami kendala saat streaming AI: ${errMsg}`;
    callbacks.onDelta?.(failText);
    return { text: failText };
  }
}

// Proses query user batch (non-streaming fallback)
export async function generateAiResponseExtended(query: string): Promise<AiResponseResult> {
  // 1. Cek format pencatatan transaksi lokal (Struktur Regex)
  const parsed = await parseTransactionQuery(query);
  if (parsed && parsed.amount > 0) {
    return {
      text: "Aku mendeteksi kamu ingin mencatat transaksi baru. Harap konfirmasi detail di bawah ini ya!",
      metadata: {
        type: "transaction_confirmation",
        data: parsed,
        isApproved: false,
      },
    };
  }

  // 2. Cek kecocokan rules teks lokal (Saldo, Pengeluaran, dll)
  const localText = await generateResponse(query);
  if (localText !== "__LOCAL_FALLBACK__") {
    return { text: localText };
  }

  // 3. Cek apakah integrasi backend AI aktif
  const aiConfig = getAiConfig();
  if (!aiConfig.enabled || !aiConfig.apiKey.trim()) {
    return {
      text: "⚠️ Mode AI saat ini terbatas (hanya perintah dasar lokal). Aktifkan integrasi dan masukkan API Key di menu Pengaturan untuk membuka kemampuan analitis Fin secara penuh.",
    };
  }

  // 4. Panggil Backend API Persona Finance
  try {
    const userProfile = await db.user_profile.get(1);
    const localUserName = userProfile?.name || "User";

    // Ambil low-token context snapshot
    const localFinancialContext = await getLowTokenSnapshot();

    // Cek jika user menanyakan tentang analisis biaya / boros
    let additionalContext = {};
    const lowerQuery = query.toLowerCase();
    if (
      lowerQuery.includes("boros") ||
      lowerQuery.includes("analisis") ||
      lowerQuery.includes("pengeluaran minggu")
    ) {
      additionalContext = {
        weeklyExpenseAggregate: await getWeeklyExpenseAggregate(),
      };
    }

    const res = await sendBackendChat({
      message: query,
      userName: localUserName,
      financialContext: { ...localFinancialContext, ...additionalContext },
    });

    return {
      text: res.text,
      metadata: res.metadata,
    };
  } catch (error) {
    console.error("Backend Chat API Failed:", error);
    const errMsg = error instanceof Error ? error.message : "Terjadi kesalahan saat memanggil AI.";
    return {
      text: `🤔 Fin mengalami kendala saat menghubungi AI: ${errMsg}\n\nPastikan API Key di Pengaturan sudah tepat dan backend server sedang berjalan.`,
    };
  }
}
