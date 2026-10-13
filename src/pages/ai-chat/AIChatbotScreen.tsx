import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Mascot } from "@/components/atoms/Mascot";

import MessageBubble from "@/components/molecules/chat-ai/MessageBubble";
import { ChatInputBar } from "@/components/molecules/chat-ai/ChatInputBar";

import { useChatHistory } from "@/hooks/useChatHistory";

const RECOMMENDED_PROMPTS = [
  "Berapa transaksi hari ini?",
  "Total saldo dompetku",
  "Pengeluaran bulan ini",
  "Pemasukan bulan ini",
  "Pengeluaran terbesar",
  "Tips hemat uang",
];

export function AIChatbotScreen() {
  const navigate = useNavigate();
  const chat = useChatHistory();

  const handleEdit = (tx: any) => {
    navigate("/add", { state: { initialTx: tx } });
  };

  return (
    <div className="flex flex-col h-dvh bg-brutal-bg">
      {/* Header Maskot Luna & Status (Neo-Brutalism) */}
      <header
        className={cn(
          "sticky top-0 z-50 flex items-center justify-between border-b-4 border-brutal-black px-4",
          "bg-brutal-white pt-[calc(var(--safe-top)+12px)] pb-3"
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Mascot isThinking={chat.isTyping} size="md" />
          <div className="flex flex-col min-w-0">
            <h1 className="text-base font-black uppercase tracking-wider text-brutal-black leading-tight truncate">
              Luna
            </h1>
            <span
              className={cn(
                "text-xs font-bold leading-none mt-0.5",
                chat.isTyping ? "text-brutal-purple animate-pulse" : "text-neutral-500"
              )}
            >
              {chat.isTyping ? "Sedang berpikir..." : "Online"}
            </span>
          </div>
        </div>

        {/* Tombol Tutup Chat */}
        <button
          onClick={() => navigate(-1)}
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center",
            "border-2 border-brutal-black bg-brutal-white",
            "shadow-brutal-sm brutal-press cursor-pointer"
          )}
          aria-label="Tutup Chat"
        >
          <X size={18} strokeWidth={2.5} className="text-brutal-black" />
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {chat.messages.map((msg, index) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            isTyping={chat.isTyping && index === chat.messages.length - 1}
            onConfirm={chat.confirmTransaction}
            onCancel={chat.cancelTransaction}
            onEdit={handleEdit}
          />
        ))}

        <div ref={chat.bottomRef} />
      </div>

      {/* Recommended Prompts */}
      {chat.messages.length <= 2 && !chat.isTyping && (
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 no-scrollbar">
          {RECOMMENDED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => chat.sendMessage(prompt)}
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

      {/* Input Bar */}
      <ChatInputBar
        onSend={chat.sendMessage}
        disabled={chat.isTyping}
      />
    </div>
  );
}
