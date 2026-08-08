/**
 * Modal de Reversão: ReverseMovementDialog
 * Categoria: features/reversals
 *
 * Diálogo de confirmação para criar um movimento compensatório de estorno (Seção 14).
 */

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useInventoryOperation } from "../../hooks/use-inventory-operation";
import { inventoryActions } from "../../application/actions/action-container";
import { toStockMovementId, toTenantId, toCompanyId } from "../../core/shared/primitives";
import { formatMZN } from "@/lib/format";
import { RotateCcw, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { StockMovementView } from "../../store/inventory-store.types";

interface ReverseMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movement: StockMovementView;
}

export function ReverseMovementDialog({
  open,
  onOpenChange,
  movement,
}: ReverseMovementDialogProps) {
  const [reasonCode, setReasonCode] = useState("data_entry_error");
  const [reasonDescription, setReasonDescription] = useState("");

  const operation = useInventoryOperation(async (params) => {
    return inventoryActions.reverseMovement({
      tenantId: toTenantId(movement.tenantId),
      companyId: toCompanyId(movement.companyId),
      correlationId: `corr-rev-${Date.now()}`,
      idempotencyKey: params.idempotencyKey,
      timestamp: new Date().toISOString(),
      sourceModule: "reversals_ui",
      originalMovementId: toStockMovementId(movement.id),
      reasonCode,
      reasonDescription,
    });
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonDescription.trim()) {
      alert("A descrição da razão do estorno é obrigatória.");
      return;
    }

    const res = await operation.execute();
    if (res && res.success) {
      setTimeout(() => onOpenChange(false), 1200);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <RotateCcw className="w-5 h-5" />
            <span>Reverter Movimento: {movement.id}</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Esta ação criará um movimento de estorno compensatório permanente. O movimento original
            continuará registado para auditoria.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {operation.error && (
            <Alert variant="destructive" className="py-2 text-xs">
              <AlertDescription>{operation.error}</AlertDescription>
            </Alert>
          )}

          {operation.status === "completed" && (
            <Alert className="py-2 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Movimento compensatório de reversão criado com sucesso!</span>
            </Alert>
          )}

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1.5 text-xs text-amber-800 dark:text-amber-300">
            <div className="font-semibold">Resumo do Movimento Original:</div>
            <div>Material: {movement.materialId}</div>
            <div>
              Quantidade: {movement.quantity} un | Custo Total: {formatMZN(movement.totalCost)}
            </div>
            <div>Tipo: {movement.movementType}</div>
          </div>

          <div className="space-y-1.5 text-xs">
            <Label className="text-xs">Código do Motivo do Estorno</Label>
            <Select value={reasonCode} onValueChange={setReasonCode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="data_entry_error">
                  Erro de Digitção / Lançamento Manual
                </SelectItem>
                <SelectItem value="quantity_mistake">Erro de Quantidade</SelectItem>
                <SelectItem value="wrong_location">Localização Incorreta</SelectItem>
                <SelectItem value="duplicate_transaction">Transação Duplicada</SelectItem>
                <SelectItem value="administrative_cancellation">
                  Cancelamento Administrativo
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 text-xs">
            <Label className="text-xs">Descrição Obrigatória da Razão</Label>
            <Input
              value={reasonDescription}
              onChange={(e) => setReasonDescription(e.target.value)}
              placeholder="Explica a razão do estorno administrativo deste movimento..."
              required
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={operation.loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={operation.loading}
              className="gap-2"
            >
              {operation.loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Confirmar Estorno</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
