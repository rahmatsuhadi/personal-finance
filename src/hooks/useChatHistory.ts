import { useState, useRef, useEffect, useCallback } from "react";
import type { Message } from "@/types";
import { generateAiResponseStream } from "@/lib/aiEngineWrapper";
import { dispatchIntent } from "@/lib/ai/intentDispatcher";

function mkId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useChatHistory() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: mkId(),
      role: "ai",
      content:
        "Halo! Aku **Luna**, asisten keuangan pintarmu. Aku bisa bantu kamu memahami kondisi keuanganmu.\n\nApa yang ingin kamu tanyakan hari ini?",
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isTyping) return;

      const userMsg: Message = {
        id: mkId(),
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
      };

      const aiMsgId = mkId();
      const aiMsgPlaceholder: Message = {
        id: aiMsgId,
        role: "ai",
        content: "",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg, aiMsgPlaceholder]);
      setIsTyping(true);

      // Siapkan history untuk konteks obrolan berkelanjutan
      const historyContext = messages
        .filter((m) => m.content.trim().length > 0)
        .map((m) => ({
          role: m.role === "ai" ? "assistant" : "user",
          content: m.content,
        }));

      try {
        let currentContent = "";

        const finalResult = await generateAiResponseStream(
          text,
          {
            onDelta: (chunk) => {
              currentContent += chunk;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMsgId ? { ...m, content: currentContent } : m
                )
              );
            },
          },
          historyContext
        );

        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? {
                  ...m,
                  // Hindari bubble kosong tersisa setelah request selesai
                  content:
                    finalResult.text ||
                    currentContent ||
                    "Maaf, Luna belum bisa menjawab pertanyaan tersebut.",
                  metadata: finalResult.metadata,
                }
              : m
          )
        );
      } catch (error) {
        console.error("[Chat] Error streaming AI response:", error);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? {
                  ...m,
                  content:
                    "Maaf, sepertinya aku sedang mengalami gangguan. Coba lagi nanti ya.",
                }
              : m
          )
        );
      } finally {
        setIsTyping(false);
      }
    },
    [isTyping, messages]
  );

  const confirmTransaction = useCallback(
    async (messageId: string) => {
      const msg = messages.find((m) => m.id === messageId);
      if (!msg || msg.metadata?.type !== "transaction_confirmation" || msg.metadata.isApproved) return;

      try {
        const data = msg.metadata.data;

        const payload = {
          type: "ADD_TX" as const,
          data: {
            type: data.type,
            amount: data.amount,
            description: data.description,
            category: data.category || "Lainnya",
            walletName: data.walletName,
          },
        };

        await dispatchIntent(payload);

        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === messageId && m.metadata) {
              return {
                ...m,
                metadata: {
                  type: "transaction_confirmation" as const,
                  data: m.metadata.data,
                  isApproved: true,
                },
              };
            }
            return m;
          })
        );

        const sysMsg: Message = {
          id: mkId(),
          role: "ai",
          content: `Transaksi "${data.description}" sebesar ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(data.amount)} berhasil dicatat ke dompet ${data.walletName || "Kas"}!`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, sysMsg]);
      } catch (err: any) {
        console.error("[Chat] Confirm transaction failed:", err);
        const errMsg: Message = {
          id: mkId(),
          role: "ai",
          content: `Gagal mencatat transaksi: ${err.message || err}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errMsg]);
      }
    },
    [messages]
  );

  const cancelTransaction = useCallback((messageId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, metadata: undefined, content: "Pencatatan transaksi dibatalkan." }
          : m
      )
    );
  }, []);

  return {
    messages,
    isTyping,
    bottomRef,
    sendMessage,
    confirmTransaction,
    cancelTransaction,
  };
}
