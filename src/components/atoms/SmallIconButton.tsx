import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface SmallIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  variant?: "lime" | "rose" | "purple" | "cyan" | "yellow" | "transparent" | "white" | "black";
  size?: "xs" | "sm" | "md" | "lg";
  shadow?: boolean;
  strokeWidth?: number;
}

export const SmallIconButton = forwardRef<HTMLButtonElement, SmallIconButtonProps>(
  (
    {
      icon: Icon,
      variant = "white",
      size = "sm",
      shadow = true,
      strokeWidth = 2.5,
      className,
      ...props
    },
    ref
  ) => {
    const baseClass = cn(
      "flex items-center justify-center border-2 border-brutal-black brutal-press shrink-0 select-none",
      "disabled:opacity-50 disabled:pointer-events-none transition-all duration-75"
    );

    const variants = {
      lime: "bg-brutal-lime text-brutal-black",
      rose: "bg-brutal-rose text-white",
      purple: "bg-brutal-purple text-white border-brutal-purple",
      cyan: "bg-brutal-cyan text-brutal-black",
      yellow: "bg-brutal-yellow text-brutal-black",
      transparent: "bg-transparent",
      white: "bg-white text-brutal-black",
      black: "bg-brutal-black text-white",
    };

    const sizes = {
      xs: "h-7 w-7",
      sm: "h-8 w-8",
      md: "h-9 w-9",
      lg: "h-10 w-10",
    };

    const iconSizes = {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
    };

    const shadowClass = shadow ? "shadow-brutal-sm" : "";

    return (
      <button
        ref={ref}
        className={cn(
          baseClass,
          variants[variant],
          sizes[size],
          shadowClass,
          className
        )}
        {...props}
      >
        <Icon size={iconSizes[size]} strokeWidth={strokeWidth} />
      </button>
    );
  }
);

SmallIconButton.displayName = "SmallIconButton";
