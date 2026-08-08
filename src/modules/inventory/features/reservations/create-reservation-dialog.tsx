/**
 * Criar Reserva: CreateReservationDialog
 * Categoria: features/reservations
 *
 * Diálogo para reservar stock para uma obra ou finalidade específica (Seção 11.3).
 * Exibe stock físico, reservado, disponível e impacto previsto.
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
import { useObraMZStore } from "@/store/obramz-store";
import {
  toMaterialId,
  toInventoryLocationId,
  toTenantId,
  toCompanyId,
} from "../../core/shared/primitives";
import { Clock, Loader2, CheckCircle2 } from "lucide-react";

interface CreateReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateReservationDialog({ open, onOpenChange }: CreateReservationDialogProps) {
  const activeCompanyId = useObraMZStore((s) => s.activeCompanyId) ?? "COMP-1";
  const activeTenantId = useObraMZStore((s) => s.activeTenantId) ?? "TENANT-A";

  const [materialIdInput, setMaterialIdInput] = useState("MAT-STEEL");
  const [locationIdInput, setLocationIdInput] = useState("LOC-MAIN-WH");
  const [quantityInput, setQuantityInput] = useState("20");
  const [purpose, setPurpose] = useState("Reserva para Fase de Estrutura da Obra");

  const operation = useInventoryOperation(async (params) => {
    return inventoryActions.reserveStock({
      tenantId: toTenantId(activeTenantId),
      companyId: toCompanyId(activeCompanyId),
      correlationId: `corr-res-${Date.now()}`,
      idempotencyKey: params.idempotencyKey,
      timestamp: new Date().toISOString(),
      sourceModule: "reservations_ui",
      materialId: materialIdInput,
      locationId: locationIdInput,
      quantity: parseFloat(quantityInput),
      notes: purpose,
    });
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(quantityInput);
    if (isNaN(qty) || qty <= 0) {
      alert("A quantidade reservada deve ser um número positivo.");
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
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span>Criar Reserva de Stock</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Aloca quantidade disponível para garantia de fornecimento sem reduzir o stock físico
            imediato.
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
              <span>Reserva efetuada com sucesso!</span>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs">Código do Material / SKU</Label>
              <Input
                value={materialIdInput}
                onChange={(e) => setMaterialIdInput(e.target.value)}
                placeholder="Ex: MAT-STEEL"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Localização</Label>
              <Input
                value={locationIdInput}
                onChange={(e) => setLocationIdInput(e.target.value)}
                placeholder="Ex: LOC-MAIN-WH"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <Label className="text-xs">Quantidade a Reservar</Label>
            <Input
              type="number"
              step="any"
              min="0.0001"
              value={quantityInput}
              onChange={(e) => setQuantityInput(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5 text-xs">
            <Label className="text-xs">Finalidade / Obra de Destino</Label>
            <Input
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Ex: Obra do Estádio - Etapa 2"
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
              <span>Criar Reserva</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
