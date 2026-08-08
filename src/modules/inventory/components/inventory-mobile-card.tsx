/**
 * Componente Mobile: InventoryMobileCard
 * Categoria: components
 *
 * Cartão responsivo para exibição de itens de inventário em ecrãs móveis (Seção 7.5 & 28).
 */

import React, { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface InventoryMobileCardProps {
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  metrics: Array<{ label: string; value: ReactNode }>;
  actions?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function InventoryMobileCard({
  title,
  subtitle,
  badge,
  metrics,
  actions,
  onClick,
  className,
}: InventoryMobileCardProps) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "border-border/60 shadow-2xs transition-all duration-200",
        onClick && "cursor-pointer hover:border-primary/40 active:scale-[0.99]",
        className,
      )}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground truncate">{title}</div>
            {subtitle && <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>}
          </div>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40 text-xs">
          {metrics.map((m, idx) => (
            <div key={idx} className="space-y-0.5">
              <span className="text-muted-foreground block text-[11px] uppercase tracking-wider">
                {m.label}
              </span>
              <span className="font-semibold text-foreground">{m.value}</span>
            </div>
          ))}
        </div>

        {actions && (
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-border/40">
            {actions}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
