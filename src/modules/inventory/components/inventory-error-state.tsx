/**
 * Estado de Erro: InventoryErrorState
 * Categoria: components
 */

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface InventoryErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function InventoryErrorState({
  title = "Erro de Inventário",
  message,
  onRetry,
}: InventoryErrorStateProps) {
  return (
    <Alert variant="destructive" className="my-4 border-destructive/30 bg-destructive/10">
      <AlertCircle className="h-5 w-5" />
      <AlertTitle className="font-semibold text-destructive">{title}</AlertTitle>
      <AlertDescription className="mt-1 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <span>{message}</span>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="border-destructive/30 hover:bg-destructive/20 text-destructive gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Tentar Novamente</span>
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
