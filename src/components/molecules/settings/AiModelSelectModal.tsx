import { useState, useMemo } from "react";
import { Search, Sparkles, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface AiModelSelectModalProps {
  open: boolean;
  models: string[];
  selectedModel: string;
  onSelect: (model: string) => void;
  onClose: () => void;
}

export function AiModelSelectModal({
  open,
  models,
  selectedModel,
  onSelect,
  onClose,
}: AiModelSelectModalProps) {
  const [search, setSearch] = useState("");

  const filteredModels = useMemo(() => {
    if (!search.trim()) return models;
    const lower = search.toLowerCase();
    return models.filter((m) => m.toLowerCase().includes(lower));
  }, [models, search]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[70] bg-brutal-black/70 animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        className={cn(
          "fixed left-1/2 top-1/2 z-[80] w-[calc(100%-32px)] max-w-md",
          "-translate-x-1/2 -translate-y-1/2",
          "border-4 border-brutal-black bg-brutal-bg shadow-brutal-lg flex flex-col max-h-[85vh]",
          "animate-in fade-in zoom-in-95 duration-150"
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-4 border-brutal-black bg-brutal-purple px-4 py-3 text-white">
          <div className="flex items-center gap-2">
            <Sparkles size={18} strokeWidth={2.5} />
            <h3 className="text-sm font-black uppercase tracking-wider">
              Daftar Model AI ({models.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center border-2 border-brutal-black bg-brutal-white text-brutal-black brutal-press"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b-2 border-brutal-black bg-brutal-white">
          <div className="relative flex items-center">
            <Search
              size={16}
              className="absolute left-3 text-brutal-black/50 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Cari model (mis. gpt-4o, claude, llama)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border-2 border-brutal-black py-2 pl-9 pr-3 text-xs font-bold outline-none placeholder:text-brutal-black/40 focus:bg-brutal-yellow/10"
              autoFocus
            />
          </div>
        </div>

        {/* Model List */}
        <div className="flex-1 overflow-y-auto p-3 divide-y divide-brutal-black/10">
          {filteredModels.length === 0 ? (
            <div className="py-8 text-center text-xs font-bold text-brutal-black/50">
              Tidak ada model yang cocok dengan pencarian.
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {filteredModels.map((m) => {
                const isSelected = m === selectedModel;
                return (
                  <button
                    key={m}
                    onClick={() => {
                      onSelect(m);
                      onClose();
                    }}
                    className={cn(
                      "w-full flex items-center justify-between border-2 border-brutal-black p-2.5 text-left text-xs font-bold transition-all brutal-press shadow-brutal-sm",
                      isSelected
                        ? "bg-brutal-lime text-brutal-black"
                        : "bg-brutal-white hover:bg-brutal-yellow/20"
                    )}
                  >
                    <span className="font-mono break-all">{m}</span>
                    {isSelected && (
                      <span className="shrink-0 ml-2 rounded-full border border-brutal-black bg-brutal-black p-0.5 text-white">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t-4 border-brutal-black p-3 bg-brutal-white flex justify-end">
          <button
            onClick={onClose}
            className="border-2 border-brutal-black bg-brutal-white px-4 py-2 text-xs font-black uppercase brutal-press shadow-brutal-sm"
          >
            Tutup
          </button>
        </div>
      </div>
    </>
  );
}
