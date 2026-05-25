import type { Message, ParsedTransaction } from "@/types";
import { Bot } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { TxConfirmCard } from "./TxConfirmCard";

interface MessageBubbleProps {
  msg: Message;
  onConfirm?: (id: string) => void;
  onCancel?: (id: string) => void;
  onEdit?: (tx: ParsedTransaction) => void;
}

export default function MessageBubble({ msg, onConfirm, onCancel, onEdit }: MessageBubbleProps) {
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
        {renderContent(msg.content)}

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