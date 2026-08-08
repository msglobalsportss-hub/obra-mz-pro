import React from "react";
import { Badge } from "@/components/ui/badge";
import type { StatusConfig, StatusTone } from "@/lib/status-configs";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  config?: StatusConfig;
  tone?: StatusTone;
  label?: string;
  className?: string;
  icon?: React.ReactNode;
}

export function StatusBadge({
  config,
  tone: toneProp,
  label: labelProp,
  className,
  icon,
}: StatusBadgeProps) {
  const tone = config?.tone || toneProp || "neutral";
  const label = config?.label || labelProp || "N/A";

  const map: Record<StatusTone, string> = {
    success: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
    warning: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
    destructive: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
    info: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
    primary: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800",
    neutral: "border-slate-300 text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  };

  const dotMap: Record<StatusTone, string> = {
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    destructive: "bg-rose-500",
    info: "bg-blue-500",
    primary: "bg-orange-500",
    neutral: "bg-slate-400",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center font-medium px-2.5 py-0.5 text-xs rounded-full transition-colors",
        map[tone],
        className
      )}
    >
      {icon ? (
        icon
      ) : (
        <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5 shrink-0", dotMap[tone])} />
      )}
      <span>{label}</span>
    </Badge>
  );
}
