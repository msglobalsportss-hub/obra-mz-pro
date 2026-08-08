/**
 * Diálogo de Detalhes de Movimento: MovementDetailsDialog
 * Categoria: features/movements
 *
 * Exibe a auditoria e metadados completos de um movimento imutável (Seção 9.4).
 */

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { InventoryStatusBadge } from "../../components/inventory-status-badge";
import { formatMZN, formatDate } from "@/lib/format";
import { ArrowLeftRight, Calendar, User, Tag, ShieldCheck, Activity } from "lucide-react";
import type { StockMovementView } from "../../store/inventory-store.types";

interface MovementDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movement: StockMovementView;
}

export function MovementDetailsDialog({
  open,
  onOpenChange,
  movement,
}: MovementDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ArrowLeftRight className="w-5 h-5 text-primary" />
            <span>Detalhes do Movimento: {movement.id}</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Registo imutável de transação de stock auditado pela camada Core.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-xs pt-2">
          <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-xl border border-border/40">
            <div>
              <span className="text-muted-foreground block text-[11px] uppercase">
                Tipo de Transação
              </span>
              <span className="font-semibold text-foreground text-sm">{movement.movementType}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px] uppercase">
                Estado Atual
              </span>
              <InventoryStatusBadge status={movement.status} />
            </div>
          </div>

          <div className="space-y-2 border-t border-border/40 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> Material:
              </span>
              <span className="font-semibold text-foreground">{movement.materialId}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Data Efetiva (occurredAt):
              </span>
              <span className="font-mono">{formatDate(movement.occurredAt)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" /> Quantidade Movimentada:
              </span>
              <span className="font-mono font-bold text-foreground">{movement.quantity} un</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Custo Unitário (WAC):</span>
              <span className="font-mono">{formatMZN(movement.unitCost)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Custo Total da Transação:</span>
              <span className="font-mono font-bold text-foreground">
                {formatMZN(movement.totalCost)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Localização Origem/Destino:</span>
              <span className="font-mono">
                {movement.destinationLocationId || movement.sourceLocationId}
              </span>
            </div>
          </div>

          <div className="space-y-2 border-t border-border/40 pt-3 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Referência:</span>
              <span className="font-mono">
                {movement.referenceType}: {movement.referenceId}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Correlation ID:</span>
              <span className="font-mono">{movement.correlationId}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tenant / Empresa:</span>
              <span className="font-mono">
                {movement.tenantId} / {movement.companyId}
              </span>
            </div>

            {movement.reversedByMovementId && (
              <div className="p-2.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-lg border border-amber-500/20">
                <span>Estornado pelo Movimento Compensatório: {movement.reversedByMovementId}</span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
