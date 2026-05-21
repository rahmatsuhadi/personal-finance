import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/atoms/AppHeader";
// import { db } from "@/db/db";
import { cn } from "@/lib/utils";
import { Send, } from "lucide-react";
// import { id as idLocale } from "date-fns/locale";
import MessageBubble from "@/components/molecules/chat-ai/MessageBubble";
import TypingIndicator from "@/components/molecules/chat-ai/TypingIndicator";
// import { parseTransactionQuery } from "@/utlis/aiParser";
import type { Message, } from "@/types";
// import { financialContextLib } from "@/lib/financialContextLib";
import { generateAiResponseExtended } from "@/lib/aiEngineWrapper";

// ─── Helpers ──────────────────────────────────────────────────────────────────


function mkId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}


// ─── Recommended Prompts ──────────────────────────────────────────────────────

const RECOMMENDED_PROMPTS = [
  "Berapa transaksi hari ini?",
  "Total saldo dompetku",
  "Pengeluaran bulan ini",
  "Pemasukan bulan ini",
  "Pengeluaran terbesar",
  "Tips hemat uang",
];


// ─── AIChatbotScreen ──────────────────────────────────────────────────────────

export function AIChatbotScreen() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: mkId(),
      role: "ai",
      content:
        "👋 Halo! Aku **Fin**, asisten keuangan pintarmu. Aku bisa bantu kamu memahami kondisi keuanganmu.\n\nApa yang ingin kamu tanyakan hari ini?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  async function sendMessage(text: string) {
    if (!text.trim() || isTyping) return;

    const userMsg: Message = {
      id: mkId(),
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate AI thinking delay (800–1600ms)
    const delay = 800 + Math.random() * 800;
    await new Promise((r) => setTimeout(r, delay));

    const responseText = await generateAiResponseExtended(text);

    const aiMsg: Message = {
      id: mkId(),
      role: "ai",
      content: responseText.text,
      metadata: responseText.metadata,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, aiMsg]);
    setIsTyping(false);
  }

  function handleSend() {
    sendMessage(input);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }


  return (
    <div
      className="flex flex-col h-dvh bg-brutal-bg"
      style={{ paddingTop: "var(--safe-top)" }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <AppHeader
        title="Fin — AI Asisten Keuangan"
        bgColor="bg-brutal-purple"
        onBack={() => navigate(-1)}
        // action={
        //   <div className="flex h-8 w-8 items-center justify-center border-2 border-brutal-lime bg-transparent">
        //     <Sparkles size={14} strokeWidth={2.5} className="text-brutal-lime" />
        //   </div>
        // }
      />

      {/* AI badge */}
      {/* <div className="flex items-center gap-2 border-b-2 border-brutal-black bg-brutal-purple/10 px-4 py-2">
        <div className="h-2 w-2 bg-brutal-emerald border border-brutal-black" />
        <p className="text-[10px] font-bold uppercase tracking-wider text-brutal-purple">
          Fin AI · Membaca data lokalmu secara real-time
        </p>
      </div> */}

      {/* ── Messages ────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {isTyping && <TypingIndicator />}

        <div ref={bottomRef} />
      </div>

      {/* ── Recommended Prompts ──────────────────────────────────────────────── */}
      {messages.length <= 2 && !isTyping && (
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 no-scrollbar">
          {RECOMMENDED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => sendMessage(prompt)}
              className={cn(
                "shrink-0 border-2 border-brutal-black bg-brutal-white px-3 py-2",
                "text-xs font-bold brutal-press shadow-brutal-sm whitespace-nowrap"
              )}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* ── Input Bar ────────────────────────────────────────────────────────── */}
      <div
        className="flex gap-2 border-t-2 border-brutal-black bg-brutal-bg px-4 py-3"
        style={{ paddingBottom: "calc(var(--safe-bottom) + 12px)" }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tanya sesuatu tentang keuanganmu..."
          disabled={isTyping}
          className={cn(
            "flex-1 border-2 border-brutal-black bg-brutal-white px-4 py-3",
            "text-sm font-medium placeholder:text-brutal-black/40",
            "shadow-brutal-sm outline-none",
            "focus:shadow-none focus:translate-x-0.5 focus:translate-y-0.5 transition-all duration-75",
            isTyping && "opacity-50"
          )}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center",
            "border-2 border-brutal-black shadow-brutal-sm brutal-press",
            input.trim() && !isTyping
              ? "bg-brutal-purple"
              : "bg-brutal-bg opacity-40"
          )}
        >
          <Send
            size={16}
            strokeWidth={2.5}
            className={input.trim() && !isTyping ? "text-white" : "text-brutal-black"}
          />
        </button>
      </div>
    </div>
  );
}
