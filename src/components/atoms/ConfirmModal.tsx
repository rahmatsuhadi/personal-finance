import { useState } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, Trash2, X } from "lucide-react";

// ─── ConfirmModal ─────────────────────────────────────────────────────────────
// Centered dialog untuk konfirmasi aksi destruktif.
// Gunakan sebagai pengganti `window.confirm()` untuk UX yang lebih baik.

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  /** Called when user clicks confirm. Can be async. */
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Ya, Hapus",
  cancelLabel = "Batal",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  }

  const iconBg = variant === "danger" ? "bg-brutal-rose" : "bg-brutal-yellow";
  const confirmBg =
    variant === "danger"
      ? "bg-brutal-rose text-white hover:opacity-90"
      : "bg-brutal-yellow text-brutal-black";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-brutal-black/70"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        className={cn(
          "fixed left-1/2 top-1/2 z-[70] w-[calc(100%-40px)] max-w-sm",
          "-translate-x-1/2 -translate-y-1/2",
          "border-4 border-brutal-black bg-brutal-bg shadow-brutal-lg",
          "animate-in fade-in zoom-in-95 duration-150"
        )}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        {/* Header */}
        <div
          className={cn(
            "flex items-center gap-3 border-b-4 border-brutal-black px-5 py-4",
            iconBg
          )}
        >
          {variant === "danger" ? (
            <Trash2 size={20} strokeWidth={2.5} className="shrink-0" />
          ) : (
            <AlertTriangle size={20} strokeWidth={2.5} className="shrink-0" />
          )}
          <h2
            id="confirm-title"
            className="flex-1 text-base font-black uppercase tracking-tight"
          >
            {title}
          </h2>
          <button
            onClick={onCancel}
            className="flex h-7 w-7 shrink-0 items-center justify-center border-2 border-brutal-black bg-brutal-white/80 brutal-press"
          >
            <X size={13} strokeWidth={2.5} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5">
          <p className="text-sm font-medium leading-relaxed text-brutal-black">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex border-t-4 border-brutal-black divide-x-4 divide-brutal-black">
          <button
            onClick={onCancel}
            disabled={loading}
            className={cn(
              "flex-1 py-4 text-sm font-black uppercase tracking-wider brutal-press",
              "bg-brutal-white text-brutal-black",
              loading && "opacity-50"
            )}
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              "flex-1 py-4 text-sm font-black uppercase tracking-wider brutal-press",
              confirmBg,
              loading && "opacity-70"
            )}
          >
            {loading ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}
