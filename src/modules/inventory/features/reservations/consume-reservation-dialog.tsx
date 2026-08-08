/**
 * Consumir Reserva: ConsumeReservationDialog
 * Categoria: features/reservations
 *
 * Consumir quantidade reservada reduzindo tanto a reserva como o stock físico (Seção 11.5).
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useInventoryOperation } from "../../hooks/use-inventory-operation";
import { inventoryActions } from "../../application/actions/action-container";
import { toInventoryReservationId, toTenantId, toCompanyId } from "../../core/shared/primitives";
import { Loader2, CheckCircle2 } from "lucide-react";
import type { InventoryReservationView } from "../../store/inventory-store.types";

interface ConsumeReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: InventoryReservationView;
}

export function ConsumeReservationDialog({
  open,
  onOpenChange,
  reservation,
}: ConsumeReservationDialogProps) {
  const [quantityInput, setQuantityInput] = useState(String(reservation.remainingQuantity));

  const operation = useInventoryOperation(async (params) => {
    return inventoryActions.consumeReservation({
      tenantId: toTenantId(reservation.tenantId),
      companyId: toCompanyId(reservation.companyId),
      correlationId: `corr-con-${Date.now()}`,
      idempotencyKey: params.idempotencyKey,
      timestamp: new Date().toISOString(),
      sourceModule: "reservations_ui",
      reservationId: toInventoryReservationId(reservation.id),
      quantityToConsume: parseFloat(quantityInput),
    });
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await operation.execute();
    if (res && res.success) {
      setTimeout(() => onOpenChange(false), 1200);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Consumir Reserva: {reservation.id}</DialogTitle>
          <DialogDescription className="text-xs">
            Aplica a reserva como consumo efetivo em obra. Reduz a reserva e o stock físico.
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
              <span>Reserva consumida com sucesso em obra!</span>
            </Alert>
          )}

          <div className="space-y-1.5 text-xs">
            <Label className="text-xs">
              Quantidade a Consumir (Restante na Reserva: {reservation.remainingQuantity})
            </Label>
            <Input
              type="number"
              step="any"
              max={reservation.remainingQuantity}
              value={quantityInput}
              onChange={(e) => setQuantityInput(e.target.value)}
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
            <Button type="submit" disabled={operation.loading} className="gap-2">
              {operation.loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Confirmar Consumo</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
