/**
 * Estado Vazio: InventoryEmptyState
 * Categoria: components
 */

import React, { ReactNode } from "react";
import { Package, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InventoryEmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ElementType;
  action?: ReactNode;
}

export function InventoryEmptyState({
  title = "Nenhum registo de inventário encontrado",
  description = "Não existem dados de inventário para os filtros selecionados.",
  icon: Icon = Inbox,
  action,
}: InventoryEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 bg-card border border-border/60 rounded-xl my-4">
      <div className="p-4 bg-muted/60 rounded-full text-muted-foreground mb-4">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
