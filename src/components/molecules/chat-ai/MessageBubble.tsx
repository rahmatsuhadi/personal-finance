import type { Message, ParsedTransaction } from "@/types";
import { Bot } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { TxConfirmCard } from "./TxConfirmCard";

interface MessageBubbleProps {
  msg: Message;
  isTyping?: boolean;
  onConfirm?: (id: string) => void;
  onCancel?: (id: string) => void;
  onEdit?: (tx: ParsedTransaction) => void;
}

export default function MessageBubble({ msg, isTyping, onConfirm, onCancel, onEdit }: MessageBubbleProps) {
  const isUser = msg.role === "user";

  const renderContent = (content: string) => {
    return content.split("\n").map((line, i) => {
      const parts = line.split(/\*\*(.+?)\*\*/g);
      return (
        <p key={i} className={i > 0 ? "mt-1" : ""}>
          {parts.map((part, j) =>
            j % 2 === 1 ? <strong key={j}>{part}</strong> : part
          )}
        </p>
      );
    });
  };

  return (
    <div
      className={cn(
        "flex gap-2 px-4",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-brutal-black bg-brutal-purple mt-1">
          <Bot size={14} strokeWidth={2.5} className="text-white" />
        </div>
      )}

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[80%] border-2 border-brutal-black px-4 py-3",
          "text-sm font-medium leading-relaxed",
          isUser
            ? "bg-brutal-lime shadow-brutal-sm text-brutal-black"
            : "bg-brutal-white shadow-brutal-sm text-brutal-black"
        )}
      >
        {msg.content ? (
          renderContent(msg.content)
        ) : isTyping ? (
          // Animasi kotak mengetik hanya ketika stream/proses masih aktif
          <div className="flex items-center gap-1.5 py-1.5" aria-label="Luna sedang mengetik">
            <div className="h-2.5 w-2.5 border border-brutal-black bg-brutal-black animate-brutal-box-1" />
            <div className="h-2.5 w-2.5 border border-brutal-black bg-brutal-black animate-brutal-box-2" />
            <div className="h-2.5 w-2.5 border border-brutal-black bg-brutal-black animate-brutal-box-3" />
          </div>
        ) : (
          // Fallback bila proses selesai tanpa isi
          <p className="italic text-neutral-500">Tidak ada tanggapan.</p>
        )}

        {msg.metadata?.type === "transaction_confirmation" && (
          <TxConfirmCard
            tx={msg.metadata.data}
            isApproved={msg.metadata.isApproved}
            onCancel={() => onCancel?.(msg.id)}
            onConfirm={() => onConfirm?.(msg.id)}
            onEdit={() => onEdit?.(msg.metadata!.data)}
          />
        )}

        <p className="text-[10px] font-bold opacity-40 mt-1.5">
          {format(msg.timestamp, "HH:mm")}
        </p>
      </div>
    </div>
  );
}