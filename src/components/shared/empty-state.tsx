import React, { type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PackageOpen, Plus, RotateCcw } from "lucide-react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: ReactNode;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon = <PackageOpen className="w-8 h-8 text-slate-400" />,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon = <Plus className="w-4 h-4" />,
  secondaryActionLabel,
  onSecondaryAction,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center space-y-3",
        compact ? "py-6 px-4" : "py-12 px-6",
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
        {icon}
      </div>

      <div className="space-y-1 max-w-sm">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{title}</h3>
        {description && <p className="text-xs text-slate-500">{description}</p>}
      </div>

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {actionLabel && onAction && (
            <Button size="sm" onClick={onAction} className="gap-2 text-xs bg-orange-600 hover:bg-orange-700 text-white">
              {actionIcon}
              <span>{actionLabel}</span>
            </Button>
          )}

          {secondaryActionLabel && onSecondaryAction && (
            <Button size="sm" variant="outline" onClick={onSecondaryAction} className="gap-1.5 text-xs">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{secondaryActionLabel}</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
