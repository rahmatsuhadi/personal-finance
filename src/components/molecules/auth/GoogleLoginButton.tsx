import { Globe2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GoogleLoginButtonProps {
  isGoogleLoading: boolean;
  onClick: () => void;
}

export function GoogleLoginButton({ isGoogleLoading, onClick }: GoogleLoginButtonProps) {
  return (
    <div className="w-full max-w-sm mb-4">
      <button
        id="onboarding-google-login"
        onClick={onClick}
        disabled={isGoogleLoading}
        className={cn(
          "w-full flex items-center justify-center gap-3",
          "border-2 border-brutal-black bg-white px-4 py-3",
          "shadow-brutal-sm font-bold uppercase tracking-wide text-sm",
          "active:shadow-none active:translate-x-[2px] active:translate-y-[2px]",
          "transition-all duration-100",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        {isGoogleLoading ? (
          <span className="animate-spin h-4 w-4 border-2 border-brutal-black border-t-transparent rounded-full" />
        ) : (
          <Globe2 size={18} strokeWidth={2} />
        )}
        {isGoogleLoading ? "Mengarahkan..." : "Lanjutkan dengan Google"}
      </button>
    </div>
  );
}
