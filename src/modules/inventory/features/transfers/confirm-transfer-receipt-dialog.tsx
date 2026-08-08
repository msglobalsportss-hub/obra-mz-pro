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
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useInventoryOperation } from "../../hooks/use-inventory-operation";
import { inventoryActions } from "../../application/actions/action-container";
import { useObraMZStore } from "@/store/obramz-store";
import { toTenantId, toCompanyId } from "../../core/shared/primitives";
import { getMaterialDisplay, getLocationDisplay } from "../../utils/inventory-display";
import { ArrowLeftRight, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";

interface ConfirmTransferReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transfer: {
    id: string;
    sourceLocationId: string;
    destinationLocationId: string;
    materialId: string;
    quantitySent: number;
  };
}

export function ConfirmTransferReceiptDialog({ open, onOpenChange, transfer }: ConfirmTransferReceiptDialogProps) {
  const activeCompanyId = useObraMZStore((s) => s.activeCompanyId) ?? "COMP-1";
  const activeTenantId = useObraMZStore((s) => s.activeTenantId) ?? "TENANT-A";

  const materials = useObraMZStore((s) => s.materials || []);
  const warehouses = useObraMZStore((s) => s.warehouses || []);
  const obras = useObraMZStore((s) => s.obras || []);

  const matDisplay = getMaterialDisplay(transfer.materialId, materials);
  const destDisplay = getLocationDisplay(transfer.destinationLocationId, warehouses, obras);

  const [receivedQtyInput, setReceivedQtyInput] = useState(transfer.quantitySent.toString());
  const [notes, setNotes] = useState("");

  const receivedQty = parseFloat(receivedQtyInput) || 0;
  const divergenceQty = Math.max(0, transfer.quantitySent - receivedQty);

  const operation = useInventoryOperation(async (params) => {
    // Transferir da localização virtual de trânsito para o destino real
    const transitLocationId = `LOC-TRANSIT-${transfer.id}`;

    return inventoryActions.transferStock({
      tenantId: toTenantId(activeTenantId),
      companyId: toCompanyId(activeCompanyId),
      correlationId: transfer.id,
      idempotencyKey: `transfer-confirm-${transfer.id}`,
      timestamp: new Date().toISOString(),
      sourceModule: "transfer_confirm_ui",
      materialId: transfer.materialId,
      sourceLocationId: transitLocationId,
      destinationLocationId: transfer.destinationLocationId,
      quantity: receivedQty,
    });
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (receivedQty <= 0) {
      alert("A quantidade recebida deve ser um número positivo.");
      return;
    }

    const res = await operation.execute();
    if (res && res.success) {
      setTimeout(() => onOpenChange(false), 1000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Confirmar Chegada da Transferência</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Destino: <strong>{destDisplay.label}</strong> | Material: <strong>{matDisplay.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-xs">
          {operation.error && (
            <Alert variant="destructive" className="py-2 text-xs">
              <AlertDescription>{operation.error}</AlertDescription>
            </Alert>
          )}

          {operation.status === "completed" && (
            <Alert className="py-2 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Entrada no destino confirmada com sucesso!</span>
            </Alert>
          )}

          <div className="p-3 bg-muted/40 rounded-lg border space-y-1">
            <span className="text-muted-foreground block text-[11px]">Quantidade Despachada da Origem:</span>
            <span className="font-mono font-bold text-sm text-foreground">{transfer.quantitySent} {matDisplay.unit}</span>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Quantidade Efetivamente Recebida *</Label>
            <Input
              type="number"
              step="any"
              min="0.0001"
              max={transfer.quantitySent}
              value={receivedQtyInput}
              onChange={(e) => setReceivedQtyInput(e.target.value)}
              required
              className="text-xs font-mono"
            />
          </div>

          {divergenceQty > 0 && (
            <Alert variant="destructive" className="py-2 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Divergência detetada: {divergenceQty} {matDisplay.unit} em falta/danificados.</span>
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">Observações / Notas de Receção</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas de conferência no destino..."
              rows={2}
              className="text-xs"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={operation.loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={operation.loading} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
              {operation.loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Confirmar Chegada no Destino</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
