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
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useInventoryOperation } from "../../hooks/use-inventory-operation";
import { inventoryActions } from "../../application/actions/action-container";
import { useObraMZStore } from "@/store/obramz-store";
import { toTenantId, toCompanyId } from "../../core/shared/primitives";
import { getMaterialDisplay, getLocationDisplay, getSupplierDisplay } from "../../utils/inventory-display";
import { Truck, CheckCircle2, Loader2, FileText, Lock, AlertTriangle } from "lucide-react";
import type { Delivery, ReceiptBatch, ReceiptBatchItem, DeliveryStatus } from "@/lib/purchases";
import { toast } from "sonner";

interface DeliveryReceptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  delivery: Delivery;
}

export function DeliveryReceptionDialog({ open, onOpenChange, delivery }: DeliveryReceptionDialogProps) {
  const activeCompanyId = useObraMZStore((s) => s.activeCompanyId);
  const activeTenantId = useObraMZStore((s) => s.activeTenantId);

  const materials = useObraMZStore((s) => s.materials || []);
  const warehouses = useObraMZStore((s) => s.warehouses || []);
  const obras = useObraMZStore((s) => s.obras || []);
  const suppliers = useObraMZStore((s) => s.suppliers || []);
  const purchaseOrders = useObraMZStore((s) => s.purchaseOrders || []);
  const deliveryItems = useObraMZStore((s) => s.deliveryItems || []);
  const updateDeliveryStore = useObraMZStore((s) => (s as any).updateDelivery || s.confirmDelivery);

  const po = purchaseOrders.find((p) => p.id === delivery.purchaseOrderId);
  const supplierDisplay = po ? getSupplierDisplay(po.supplierId, suppliers) : { name: "Fornecedor", nuit: "" };

  const destLocationId =
    delivery.destinationType === "central_stock"
      ? delivery.destinationWarehouseId || "WH-MAIN"
      : `LOC-PROJ-${delivery.destinationProjectId || "PROJ-1"}`;
  const destLocationDisplay = getLocationDisplay(destLocationId, warehouses, obras);

  // Itens da Entrega
  const items = deliveryItems.filter((di) => di.deliveryId === delivery.id);

  // Estados dos Formulários
  const [acceptedQuantities, setAcceptedQuantities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    items.forEach((item) => {
      initial[item.id] = item.quantityDelivered || item.quantityExpected;
    });
    return initial;
  });

  const [rejectedQuantities, setRejectedQuantities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    items.forEach((item) => {
      initial[item.id] = item.quantityRejected || 0;
    });
    return initial;
  });

  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [observations, setObservations] = useState(delivery.notes || "");
  const [attachmentName, setAttachmentName] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentName(file.name);
    }
  };

  const operation = useInventoryOperation(async () => {
    const batchMovementIds: string[] = [];
    const batchItems: ReceiptBatchItem[] = [];

    const batchIndex = (delivery.batches?.length || 0) + 1;
    const timestamp = new Date().toISOString();

    // 1. Postagem Atómica Imediata para cada item aceite
    for (const item of items) {
      const acceptedQty = acceptedQuantities[item.id] || 0;
      const rejectedQty = rejectedQuantities[item.id] || 0;

      if (acceptedQty > 0) {
        const idempotencyKey = `batch-${delivery.id}-${batchIndex}-${item.id}`;
        const res = await inventoryActions.receiveStock({
          tenantId: toTenantId(activeTenantId),
          companyId: toCompanyId(activeCompanyId),
          correlationId: delivery.id,
          idempotencyKey,
          timestamp,
          sourceModule: "delivery_reception_ui",
          materialId: item.materialId,
          locationId: destLocationId,
          quantity: acceptedQty,
          unitCost: item.unitPrice || 0,
        });

        if (res && res.movementIds) {
          batchMovementIds.push(...res.movementIds);
        }
      }

      batchItems.push({
        id: `bitem-${Date.now()}-${item.id}`,
        batchId: `batch-${delivery.id}-${batchIndex}`,
        materialId: item.materialId,
        purchaseOrderItemId: item.purchaseOrderItemId,
        deliveredQuantity: acceptedQty + rejectedQty,
        acceptedQuantity: acceptedQty,
        rejectedQuantity: rejectedQty,
        rejectionReason: rejectionReasons[item.id] || "",
        unitPrice: item.unitPrice,
      });
    }

    // 2. Criar Objeto do Lote de Receção (ReceiptBatch)
    const newBatch: ReceiptBatch = {
      id: `batch-${delivery.id}-${batchIndex}-${Date.now()}`,
      deliveryId: delivery.id,
      batchNumber: `LOTE-${batchIndex.toString().padStart(3, "0")}`,
      receivedAt: timestamp,
      receivedByUserId: "USER-1",
      receivedByUserName: "Fiel de Armazém",
      items: batchItems,
      movementIds: batchMovementIds,
      correlationId: delivery.id,
      idempotencyKey: `batch-corr-${delivery.id}-${batchIndex}`,
      notes: observations,
    };

    // 3. Atualizar Entidade Canónica Delivery
    const updatedBatches = [...(delivery.batches || []), newBatch];
    const updatedMovements = [...(delivery.movementIds || []), ...batchMovementIds];

    // Calcular estado final da entrega
    const hasRejections = batchItems.some((b) => (b.rejectedQuantity || 0) > 0);
    const totalDelivered = batchItems.reduce((acc, b) => acc + b.acceptedQuantity, 0);
    const totalExpected = items.reduce((acc, i) => acc + (i.quantityExpected || 100), 0);

    let nextStatus: DeliveryStatus = "received";
    if (totalDelivered < totalExpected) {
      nextStatus = "partially_received";
    } else if (hasRejections) {
      nextStatus = "received_with_divergence";
    }

    delivery.batches = updatedBatches;
    delivery.movementIds = updatedMovements;
    delivery.status = nextStatus;
    delivery.inventoryProcessedAt = timestamp;
    delivery.updatedAt = timestamp;

    toast.success(`Lote ${newBatch.batchNumber} processado com sucesso! ${batchMovementIds.length} movimentos criados.`);
    return { success: true };
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await operation.execute();
    if (res && res.success) {
      setTimeout(() => onOpenChange(false), 800);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            <span>Conferência de Carga por Lote: {delivery.deliveryNumber}</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Pedido de Compra: <strong className="font-mono text-foreground">{po?.orderNumber}</strong> | Fornecedor: <strong>{supplierDisplay.name}</strong>
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
              <span>Lote conferido e movimentos de stock registados com sucesso!</span>
            </Alert>
          )}

          {/* Destino Herdado e Congelado */}
          <div className="p-3 bg-muted/40 rounded-lg border border-border/60 flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="text-muted-foreground block text-[11px] uppercase font-bold">Destino Herdado do Pedido de Compra</span>
              <span className="font-semibold text-foreground">{destLocationDisplay.label}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground bg-background px-2 py-1 rounded border">
              <Lock className="w-3 h-3 text-muted-foreground" />
              <span>Destino Congelado</span>
            </div>
          </div>

          {/* Tabela de Conferência dos Itens */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Conferência Item a Item do Lote Atual</Label>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs">Material</TableHead>
                    <TableHead className="text-xs text-right">Qtd Entregue</TableHead>
                    <TableHead className="text-xs text-right">Qtd Aceite</TableHead>
                    <TableHead className="text-xs text-right">Qtd Rejeitada</TableHead>
                    <TableHead className="text-xs">Motivo da Rejeição (opcional)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-xs text-muted-foreground">
                        Nenhum item individual registado nesta guia. A receção será processada pela ordem total.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => {
                      const matName = getMaterialDisplay(item.materialId, materials).name;
                      return (
                        <TableRow key={item.id} className="text-xs">
                          <TableCell className="font-medium">{matName}</TableCell>
                          <TableCell className="text-right font-mono">{item.quantityDelivered}</TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              min="0"
                              max={item.quantityDelivered}
                              value={acceptedQuantities[item.id] || 0}
                              onChange={(e) => {
                                const accepted = parseFloat(e.target.value) || 0;
                                setAcceptedQuantities({ ...acceptedQuantities, [item.id]: accepted });
                                setRejectedQuantities({ ...rejectedQuantities, [item.id]: Math.max(0, item.quantityDelivered - accepted) });
                              }}
                              className="h-7 w-20 text-xs font-mono text-right ml-auto"
                            />
                          </TableCell>
                          <TableCell className="text-right font-mono text-rose-600 font-bold">
                            {rejectedQuantities[item.id] || 0}
                          </TableCell>
                          <TableCell>
                            {(rejectedQuantities[item.id] || 0) > 0 ? (
                              <Input
                                value={rejectionReasons[item.id] || ""}
                                onChange={(e) => setRejectionReasons({ ...rejectionReasons, [item.id]: e.target.value })}
                                placeholder="Avaria, especificação errada..."
                                className="h-7 text-xs"
                              />
                            ) : (
                              <span className="text-muted-foreground text-[11px]">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Anexo de Guia de Remessa / Foto da Carga */}
          <div className="space-y-1.5 text-xs">
            <Label className="text-xs">Anexo da Guia de Remessa ou Fotografia do Lote</Label>
            <div className="flex items-center gap-2">
              <Input type="file" onChange={handleFileUpload} className="h-9 text-xs" accept=".pdf,image/*" />
              {attachmentName && (
                <Badge variant="outline" className="text-[10px] gap-1 bg-emerald-500/10 text-emerald-600">
                  <FileText className="w-3 h-3" />
                  <span>{attachmentName}</span>
                </Badge>
              )}
            </div>
          </div>

          {/* Observações do Fiel de Armazém */}
          <div className="space-y-1.5 text-xs">
            <Label className="text-xs">Observações / Notas de Conferência do Lote</Label>
            <Textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Notas relativas às condições da entrega, inspeção física e transporte..."
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
              <span>Processar Lote & Emitir Movimentos de Stock</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
