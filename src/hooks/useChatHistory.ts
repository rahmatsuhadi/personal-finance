import { useState, useRef, useEffect, useCallback } from "react";
import type { Message } from "@/types";
import { generateAiResponseExtended } from "@/lib/aiEngineWrapper";

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

  return {
    messages,
    isTyping,
    bottomRef,
    sendMessage,
  };
}
