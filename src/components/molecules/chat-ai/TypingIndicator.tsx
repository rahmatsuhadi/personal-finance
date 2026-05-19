import { Bot } from "lucide-react";

export default function TypingIndicator() {
  return (
    <div className="flex gap-2 px-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-brutal-black bg-brutal-purple">
        <Bot size={14} strokeWidth={2.5} className="text-white" />
      </div>
      <div className="border-2 border-brutal-black bg-brutal-white px-4 py-3 shadow-brutal-sm flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2 w-2 bg-brutal-purple border border-brutal-black"
            style={{
              animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}