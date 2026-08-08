import React, { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: "default" | "full" | "narrow";
}

export function PageContainer({
  children,
  className,
  maxWidth = "default",
}: PageContainerProps) {
  const maxWidthClass = {
    default: "max-w-7xl",
    full: "max-w-full",
    narrow: "max-w-5xl",
  }[maxWidth];

  return (
    <div
      className={cn(
        "mx-auto w-full space-y-6 p-4 sm:p-6 transition-all duration-200",
        maxWidthClass,
        className
      )}
    >
      {children}
    </div>
  );
}
