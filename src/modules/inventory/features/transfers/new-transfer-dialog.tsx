import React, { useState, useMemo } from "react";
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
import { inventoryActions, defaultUnitOfWork } from "../../application/actions/action-container";
import { useObraMZStore } from "@/store/obramz-store";
import { inventoryStoreManager } from "../../store/inventory-store";
import { MaterialCombobox, InventoryLocationSelector } from "../../components/selectors";
import {
  toTenantId,
  toCompanyId,
  toStockTransferId,
  toInventoryLocationId,
} from "../../core/shared/primitives";
import { ArrowLeftRight, Loader2, CheckCircle2, AlertTriangle, Truck } from "lucide-react";

interface NewTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewTransferDialog({ open, onOpenChange }: NewTransferDialogProps) {
  const activeCompanyId = useObraMZStore((s) => s.activeCompanyId);
  const activeTenantId = useObraMZStore((s) => s.activeTenantId);

  const materials = useObraMZStore((s) => s.materials || []);
  const warehouses = useObraMZStore((s) => s.warehouses || []);
  const obras = useObraMZStore((s) => s.obras || []);

  const [storeState, setStoreState] = useState(inventoryStoreManager.getState());

  useEffect(() => {
    return inventoryStoreManager.subscribe(setStoreState);
  }, []);

  const defaultDestLoc = obras[0]?.id
    ? `LOC-PROJ-${obras[0].id}`
    : warehouses[1]?.id || warehouses[0]?.id || "WH-MAIN";

  const [selectedMaterialId, setSelectedMaterialId] = useState(materials[0]?.id || "MAT-CEMENT");
  const [sourceLocationId, setSourceLocationId] = useState(warehouses[0]?.id || "WH-MAIN");
  const [destinationLocationId, setDestinationLocationId] = useState(defaultDestLoc);
  const [quantityInput, setQuantityInput] = useState("10");

  const isSameLocation = sourceLocationId.trim() === destinationLocationId.trim();

  // Stock disponível na origem (reativo)
  const sourceAvailableStock = useMemo(() => {
    const balances = Object.values(storeState.balances);
    const sourceBal = balances.find(
      (b) => b.materialId === selectedMaterialId && b.locationId === sourceLocationId
    );
    return sourceBal ? Math.max(0, sourceBal.onHandQuantity - sourceBal.reservedQuantity) : 0;
  }, [storeState.balances, selectedMaterialId, sourceLocationId]);

  const parsedQty = parseFloat(quantityInput) || 0;

  const operation = useInventoryOperation(async (params) => {
    const transferId = `trf-${Date.now()}`;
    const transitLocationId = `LOC-TRANSIT-${transferId}`;

    // 1. Persistir o documento StockTransfer com a localização de destino real escolhida
    await defaultUnitOfWork.transfers.save({
      id: toStockTransferId(transferId),
      tenantId: toTenantId(activeTenantId),
      companyId: toCompanyId(activeCompanyId),
      transferNumber: `TRF-${Date.now().toString().slice(-6)}`,
      sourceLocationId: toInventoryLocationId(sourceLocationId),
      destinationLocationId: toInventoryLocationId(destinationLocationId),
      status: "in_transit",
      requestedAt: new Date().toISOString(),
      dispatchedAt: new Date().toISOString(),
      correlationId: transferId as any,
      idempotencyKey: params.idempotencyKey as any,
    });

    // 2. Executar saída do stock da origem para a localização virtual em trânsito
    return inventoryActions.transferStock({
      tenantId: toTenantId(activeTenantId),
      companyId: toCompanyId(activeCompanyId),
      correlationId: transferId,
      idempotencyKey: params.idempotencyKey,
      timestamp: new Date().toISOString(),
      sourceModule: "transfers_ui_dispatch",
      materialId: selectedMaterialId,
      sourceLocationId,
      destinationLocationId: transitLocationId,
      quantity: parsedQty,
    });
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSameLocation) {
      alert("A localização de origem deve ser diferente do destino.");
      return;
    }
    if (parsedQty <= 0) {
      alert("A quantidade a transferir deve ser positiva.");
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
            <ArrowLeftRight className="w-5 h-5 text-blue-600" />
            <span>Despacho de Transferência Interna (Etapa 1)</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Despache stock da origem para a localização em trânsito. O destino confirmará a chegada na Etapa 2.
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
              <span>Despacho enviado para localização em trânsito com sucesso!</span>
            </Alert>
          )}

          {isSameLocation && (
            <Alert variant="destructive" className="py-2 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Origem e Destino não podem ser idênticos.</span>
            </Alert>
          )}

          {/* Selecionar Material com Combobox Real */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Material *</Label>
            <MaterialCombobox value={selectedMaterialId} onValueChange={setSelectedMaterialId} />
          </div>

          {/* Selecionar Origem e Destino com LocationSelector Real */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Origem *</Label>
              <InventoryLocationSelector value={sourceLocationId} onValueChange={setSourceLocationId} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Destino Final *</Label>
              <InventoryLocationSelector value={destinationLocationId} onValueChange={setDestinationLocationId} />
            </div>
          </div>

          {/* Quantidade a Transferir */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-semibold">Quantidade a Despachar *</Label>
              <span className="text-[11px] text-muted-foreground">
                Disponível na Origem: <strong className="text-foreground">{sourceAvailableStock}</strong>
              </span>
            </div>
            <Input
              type="number"
              step="any"
              min="0.0001"
              value={quantityInput}
              onChange={(e) => setQuantityInput(e.target.value)}
              required
              className="text-xs font-mono"
            />
          </div>

          <div className="p-3 bg-muted/40 rounded-lg border text-[11px] text-muted-foreground flex items-center gap-2">
            <Truck className="w-4 h-4 text-amber-500 shrink-0" />
            <span>O stock sairá imediatamente da origem e ficará retido em trânsito até ser recebido no destino.</span>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={operation.loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={operation.loading || isSameLocation || parsedQty <= 0} className="gap-2">
              {operation.loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Confirmar Despacho em Trânsito</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
