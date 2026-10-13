import { cn } from "@/lib/utils";

interface MascotProps {
  /** Mode animasi berpikir ketika AI sedang memproses */
  isThinking?: boolean;
  /** Ukuran maskot */
  size?: "sm" | "md" | "lg";
  /** Tampilkan indikator status online di sudut */
  showStatus?: boolean;
  className?: string;
}

// Komponen maskot kotak minimalis "" dengan animasi CSS murni
export function Mascot({
  isThinking = false,
  size = "md",
  showStatus = true,
  className,
}: MascotProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const eyeClasses = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-2.5 h-2.5",
  };

  const eyeGapClasses = {
    sm: "gap-1.5 mb-1",
    md: "gap-2 mb-1.5",
    lg: "gap-2.5 mb-2",
  };

  return (
    <div className={cn("relative shrink-0 select-none", className)}>
      {/* Box tubuh maskot */}
      <div
        className={cn(
          sizeClasses[size],
          "flex flex-col items-center justify-center border-2 border-brutal-black bg-brutal-lime shadow-brutal-sm",
          isThinking && "animate-mascot-bob"
        )}
      >
        {/* Baris mata kotak */}
        <div className={cn("flex items-center", eyeGapClasses[size])}>
          <div
            className={cn(
              eyeClasses[size],
              "bg-brutal-black origin-center",
              isThinking ? "animate-mascot-look" : "animate-mascot-blink"
            )}
          />
          <div
            className={cn(
              eyeClasses[size],
              "bg-brutal-black origin-center",
              isThinking ? "animate-mascot-look" : "animate-mascot-blink"
            )}
          />
        </div>

        {/* Mulut: garis horizontal saat idle, kotak kecil saat berpikir */}
        <div
          className={cn(
            "bg-brutal-black transition-all duration-200",
            isThinking
              ? size === "sm"
                ? "w-1 h-1"
                : "w-1.5 h-1.5"
              : size === "sm"
              ? "w-2 h-[2px]"
              : size === "lg"
              ? "w-3 h-[2.5px]"
              : "w-2.5 h-[2px]"
          )}
        />
      </div>

      {/* Titik status online */}
      {showStatus && (
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 border border-brutal-black",
            isThinking ? "bg-brutal-yellow animate-pulse" : "bg-brutal-emerald"
          )}
          title={isThinking ? "Sedang berpikir..." : "Online"}
        />
      )}
    </div>
  );
}

export default Mascot;
