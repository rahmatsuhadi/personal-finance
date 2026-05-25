import React from "react";
import { cn } from "@/lib/utils";

export interface MainPageTemplateProps {
  title?: string;
  headerSubtitle?: string;
  headerIcon?: React.ReactNode;
  headerActions?: React.ReactNode;
  headerBg?: string;
  headerContent?: React.ReactNode;
  topSection?: React.ReactNode;
  children: React.ReactNode;
  bottomPadding?: "standard" | "large" | "none";
}

export function MainPageTemplate({
  title,
  headerSubtitle,
  headerIcon,
  headerActions,
  headerBg = "bg-brutal-black",
  headerContent,
  topSection,
  children,
  bottomPadding = "standard",
}: MainPageTemplateProps) {
  return (
    <div
      className={cn(
        "flex flex-col min-h-full bg-brutal-bg",
        bottomPadding === "standard" && "pb-20",
        bottomPadding === "large" && "pb-24"
      )}
      style={{ paddingTop: "var(--safe-top)" }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        className={cn(
          "border-b-4 border-brutal-black px-4",
          headerBg,
          headerContent ? "pt-4 pb-4" : "py-4"
        )}
      >
        {headerContent ? (
          headerContent
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              {headerSubtitle && (
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-0.5">
                  {headerSubtitle}
                </p>
              )}
              <div className="flex items-center gap-2">
                {headerIcon && (
                  <div className="flex h-7 w-7 items-center justify-center border-2 border-brutal-black bg-white shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)]">
                    {headerIcon}
                  </div>
                )}
                <h1 className="text-xl font-black text-white uppercase tracking-tight">
                  {title}
                </h1>
              </div>
            </div>
            {headerActions && (
              <div className="flex items-center gap-2">
                {headerActions}
              </div>
            )}
          </div>
        )}
      </div>

      {topSection && (
        <div className="border-b-2 border-brutal-black">
          {topSection}
        </div>
      )}

      {children}
    </div>
  );
}
