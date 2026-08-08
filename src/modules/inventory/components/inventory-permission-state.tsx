/**
 * Estado de Sem Permissão: InventoryPermissionState
 * Categoria: components
 */

import React from "react";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InventoryPermissionState({
  title = "Acesso Restrito",
  description = "Não possuis permissões suficientes para aceder a esta funcionalidade de inventário.",
  onBack,
}: {
  title?: string;
  description?: string;
  onBack?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 bg-card border border-amber-500/20 rounded-xl my-6">
      <div className="p-4 bg-amber-500/10 rounded-full text-amber-600 mb-4">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>
      {onBack && (
        <Button variant="outline" onClick={onBack} className="mt-6">
          Voltar
        </Button>
      )}
    </div>
  );
}
