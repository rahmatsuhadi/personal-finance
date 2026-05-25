import React from "react";
import { AppHeader } from "@/components/atoms/AppHeader";

export interface FormPageTemplateProps {
  title: string;
  onBack?: () => void;
  headerAction?: React.ReactNode;
  headerBg?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function FormPageTemplate({
  title,
  onBack,
  headerAction,
  headerBg = "bg-brutal-black",
  children,
  footer,
}: FormPageTemplateProps) {
  return (
    <div className="flex flex-col min-h-full bg-brutal-bg">
      <AppHeader
        title={title}
        onBack={onBack}
        action={headerAction}
        bgColor={headerBg}
      />
      <div className="flex-1 flex flex-col">
        {children}
      </div>
      {footer && (
        <div className="sticky bottom-0 bg-brutal-bg border-t-2 border-brutal-black p-4 pb-[calc(var(--safe-bottom)+16px)]">
          {footer}
        </div>
      )}
    </div>
  );
}
