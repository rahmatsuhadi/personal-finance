import { useState, useRef, useEffect, useCallback } from "react";
import type { Message } from "@/types";
import { generateAiResponseExtended } from "@/lib/aiEngineWrapper";
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
        "Halo! Aku **Fin**, asisten keuangan pintarmu. Aku bisa bantu kamu memahami kondisi keuanganmu.\n\nApa yang ingin kamu tanyakan hari ini?",
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: Message = {
      id: mkId(),
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    const delay = 800 + Math.random() * 800;
    await new Promise((r) => setTimeout(r, delay));

    try {
      const responseText = await generateAiResponseExtended(text);
      const aiMsg: Message = {
        id: mkId(),
        role: "ai",
        content: responseText.text,
        metadata: responseText.metadata,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error("[Chat] Error generating AI response:", error);
      const errMsg: Message = {
        id: mkId(),
        role: "ai",
        content: "Maaf, sepertinya aku sedang mengalami gangguan. Coba lagi nanti ya.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  }, [isTyping]);

  const confirmTransaction = useCallback(async (messageId: string) => {
    const msg = messages.find(m => m.id === messageId);
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
          walletName: data.walletName
        }
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
                isApproved: true
              }
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
  }, [messages]);

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
