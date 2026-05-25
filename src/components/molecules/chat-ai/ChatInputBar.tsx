import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export interface ChatInputBarProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

export function ChatInputBar({ onSend, disabled, className }: ChatInputBarProps) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim() || disabled) return;
    onSend(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={cn("flex gap-2 border-t-2 border-brutal-black bg-brutal-bg px-4 py-3", className)}
      style={{ paddingBottom: "calc(var(--safe-bottom) + 12px)" }}
    >
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Tanya sesuatu tentang keuanganmu..."
        disabled={disabled}
        className={cn(
          "flex-1 border-2 border-brutal-black bg-brutal-white px-4 py-3",
          "text-sm font-medium placeholder:text-brutal-black/40",
          "shadow-brutal-sm outline-none",
          "focus:shadow-none focus:translate-x-0.5 focus:translate-y-0.5 transition-all duration-75",
          disabled && "opacity-50"
        )}
      />
      <button
        onClick={handleSend}
        disabled={!input.trim() || disabled}
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center",
          "border-2 border-brutal-black shadow-brutal-sm brutal-press",
          input.trim() && !disabled
            ? "bg-brutal-purple"
            : "bg-brutal-bg opacity-40"
        )}
      >
        <Send
          size={16}
          strokeWidth={2.5}
          className={input.trim() && !disabled ? "text-white" : "text-brutal-black"}
        />
      </button>
    </div>
  );
}
