import { useState, useRef, useEffect } from "react";
import { useStack } from "@/navigation/StackNavigator";
import { AppHeader } from "@/components/atoms/AppHeader";
import { db } from "@/db/db";
import { cn } from "@/lib/utils";
import { Send, Sparkles, } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import MessageBubble from "@/components/molecules/chat-ai/MessageBubble";
import TypingIndicator from "@/components/molecules/chat-ai/TypingIndicator";
import { parseTransactionQuery } from "@/utlis/aiParser";
import type { Message, } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatIDR(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

function mkId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// ─── Dummy AI Engine (reads real DB data) ─────────────────────────────────────

async function generateResponse(query: string): Promise<string> {
  const q = query.toLowerCase().trim();
  const today = format(new Date(), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");
  const todayLabel = format(new Date(), "d MMMM yyyy", { locale: idLocale });
  const monthLabel = format(new Date(), "MMMM yyyy", { locale: idLocale });

  // ── Transaksi hari ini ──────────────────────────────────────────────────────
  if (q.includes("hari ini") && (q.includes("transaksi") || q.includes("berapa"))) {
    const txs = await db.transactions
      .where("date")
      .equals(today)
      .toArray();

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
    const txs = await db.transactions
      .where("date")
      .between(monthStart, monthEnd, true, true)
      .filter((t) => t.type === "expense")
      .toArray();

    const total = txs.reduce((s, t) => s + t.amount, 0);
    const catMap = new Map<string, number>();
    txs.forEach((t) => catMap.set(t.category, (catMap.get(t.category) ?? 0) + t.amount));
    const sorted = [...catMap.entries()].sort(([, a], [, b]) => b - a);

    if (total === 0) {
      return `🎉 Belum ada pengeluaran di bulan ${monthLabel}. Finansialmu aman!`;
    }

    const catLines = sorted.slice(0, 5).map(([cat, amt]) => `  • ${cat}: ${formatIDR(amt)}`).join("\n");
    return `📉 **Pengeluaran Bulan ${monthLabel}**: ${formatIDR(total)}\n\nKategori terbesar:\n${catLines}`;
  }

  // ── Pemasukan bulan ini ─────────────────────────────────────────────────────
  if (q.includes("pemasukan") || q.includes("masuk") || q.includes("gaji")) {
    const txs = await db.transactions
      .where("date")
      .between(monthStart, monthEnd, true, true)
      .filter((t) => t.type === "income")
      .toArray();

    const total = txs.reduce((s, t) => s + t.amount, 0);

    if (total === 0) {
      return `📥 Belum ada pemasukan tercatat di bulan ${monthLabel}. Yuk catat gaji atau pendapatan kamu!`;
    }

    return `📈 **Pemasukan Bulan ${monthLabel}**: ${formatIDR(total)}\nDari **${txs.length} transaksi** pemasukan.`;
  }

  // ── Transaksi terbesar ──────────────────────────────────────────────────────
  if (q.includes("terbesar") || q.includes("paling besar") || q.includes("terbanyak")) {
    const txs = await db.transactions
      .where("date")
      .between(monthStart, monthEnd, true, true)
      .filter((t) => t.type === "expense")
      .sortBy("amount");

    const top = txs.reverse().slice(0, 3);
    if (top.length === 0) return "📊 Belum ada data pengeluaran bulan ini.";

    const lines = top.map((t, i) => `  ${i + 1}. ${t.description} (${t.category}): ${formatIDR(t.amount)}`).join("\n");
    return `🏆 **Pengeluaran Terbesar Bulan Ini**:\n${lines}`;
  }

  // ── Tips keuangan ───────────────────────────────────────────────────────────
  if (q.includes("tips") || q.includes("saran") || q.includes("hemat") || q.includes("nabung")) {
    const txs = await db.transactions
      .where("date")
      .between(monthStart, monthEnd, true, true)
      .toArray();

    const income = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const ratio = income > 0 ? Math.round((expense / income) * 100) : 0;

    return `💡 **Tips Keuangan untuk Kamu**:\n\n${income > 0 ? `• Bulan ini kamu menggunakan **${ratio}%** dari pemasukan untuk pengeluaran.\n` : ""}• Idealnya pengeluaran ≤ **70%** dari pemasukan.\n• Sisihkan minimal **20%** untuk tabungan atau investasi.\n• **10%** untuk kebutuhan tak terduga.\n\nAturan ini dikenal sebagai metode **70/20/10** 📊`;
  }

  // ── Kategori ────────────────────────────────────────────────────────────────
  if (q.includes("kategori")) {
    const txs = await db.transactions
      .where("date")
      .between(monthStart, monthEnd, true, true)
      .filter((t) => t.type === "expense")
      .toArray();

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

  // ── Default ─────────────────────────────────────────────────────────────────
  return `🤔 Hmm, aku belum paham pertanyaan itu. Coba tanya:\n\n• "Berapa transaksi hari ini?"\n• "Total saldo dompetku"\n• "Pengeluaran bulan ini"\n• "Pemasukan bulan ini"\n• "Pengeluaran terbesar"\n• "Tips hemat uang"`;
}

async function generateAiResponseExtended(query: string): Promise<{ text: string; metadata?: any }> {
  const parsed = parseTransactionQuery(query);

  // Jika terdeteksi ini adalah input pencatatan transaksional
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

  // Jika bukan pencatatan, fallback ke Dummy AI Engine bawaan kamu yang lama
  const text = await generateResponse(query);
  return { text };
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
  const { pop } = useStack();
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
        onBack={pop}
        action={
          <div className="flex h-8 w-8 items-center justify-center border-2 border-brutal-lime bg-transparent">
            <Sparkles size={14} strokeWidth={2.5} className="text-brutal-lime" />
          </div>
        }
      />

      {/* AI badge */}
      <div className="flex items-center gap-2 border-b-2 border-brutal-black bg-brutal-purple/10 px-4 py-2">
        <div className="h-2 w-2 bg-brutal-emerald border border-brutal-black" />
        <p className="text-[10px] font-bold uppercase tracking-wider text-brutal-purple">
          Fin AI · Membaca data lokalmu secara real-time
        </p>
      </div>

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
