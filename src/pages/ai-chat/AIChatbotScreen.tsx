import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/atoms/AppHeader";
import { cn } from "@/lib/utils";

import MessageBubble from "@/components/molecules/chat-ai/MessageBubble";
import TypingIndicator from "@/components/molecules/chat-ai/TypingIndicator";
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

  return (
    <div
      className="flex flex-col h-dvh bg-brutal-bg"
      style={{ paddingTop: "var(--safe-top)" }}
    >
      <AppHeader
        title="Fin — AI Asisten Keuangan"
        bgColor="bg-brutal-purple"
        onBack={() => navigate(-1)}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {chat.messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {chat.isTyping && <TypingIndicator />}

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
