/**
 * DeliveryConferenceSection
 *
 * Secção de conferência operacional desacoplada.
 * Hoje renderiza inline na DeliveryDetailsView.
 * No futuro pode ser migrada para /app/inventory/deliveries/$id/conferencia
 * sem refactoring — apenas mover este componente para uma nova página.
 *
 * Contrato desacoplado: recebe delivery + items + conferenceState via props.
 * Não depende de nenhum modal nem contexto de rota.
 */

import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Package,
  ArrowLeft,
  Info,
} from "lucide-react";
import { getMaterialDisplay } from "../../utils/inventory-display";
import { useObraMZStore } from "@/store/obramz-store";
import { inventoryActions } from "../../application/actions/action-container";
import { toTenantId, toCompanyId } from "../../core/shared/primitives";
import { toast } from "sonner";
import type { Delivery, DeliveryItem, ReceiptBatch, ReceiptBatchItem, DeliveryStatus } from "@/lib/purchases";
import type { ConferenceState } from "../../store/deliveries-ui-state";

// Motivos de rejeição normalizados (sem linguagem técnica)
const REJECTION_REASONS = [
  "Quantidade inferior ao pedido",
  "Quantidade superior ao pedido",
  "Material errado (não corresponde ao pedido)",
  "Material danificado",
  "Embalagem danificada",
  "Prazo de validade expirado",
  "Outro motivo",
] as const;

interface DeliveryConferenceSectionProps {
  delivery: Delivery;
  deliveryItems: DeliveryItem[];
  conferenceState: ConferenceState | null;
  onConferenceStateChange: (state: ConferenceState) => void;
  onBatchProcessed: (batch: ReceiptBatch, newStatus: DeliveryStatus) => void;
  onOpenSummary: () => void;
  onClose: () => void;  // volta para mode: 'view'
}

export function DeliveryConferenceSection({
  delivery,
  deliveryItems,
  conferenceState,
  onConferenceStateChange,
  onBatchProcessed,
  onOpenSummary,
  onClose,
}: DeliveryConferenceSectionProps) {
  const activeCompanyId = useObraMZStore((s) => s.activeCompanyId) ?? "COMP-1";
  const activeTenantId = useObraMZStore((s) => s.activeTenantId) ?? "TENANT-A";
  const materials = useObraMZStore((s) => s.materials || []);
  const warehouses = useObraMZStore((s) => s.warehouses || []);
  const obras = useObraMZStore((s) => s.obras || []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [globalNotes, setGlobalNotes] = useState(delivery.notes || "");

  const destLocationId =
    delivery.destinationType === "central_stock"
      ? (delivery as any).destinationWarehouseId || "WH-MAIN"
      : `LOC-PROJ-${delivery.destinationProjectId || "PROJ-1"}`;

  // Inicializar quantidades a partir do conferenceState persistido ou dos defaults
  const getDelivered = useCallback((itemId: string, item: DeliveryItem): number => {
    if (conferenceState?.deliveredQuantities?.[itemId] !== undefined) {
      return conferenceState.deliveredQuantities[itemId];
    }
    return item.receivedBaseQuantity || item.quantityExpected || 0;
  }, [conferenceState]);

  const getAccepted = useCallback((itemId: string, item: DeliveryItem): number => {
    if (conferenceState?.acceptedQuantities?.[itemId] !== undefined) {
      return conferenceState.acceptedQuantities[itemId];
    }
    return item.acceptedQuantity || item.receivedBaseQuantity || item.quantityExpected || 0;
  }, [conferenceState]);

  const getRejectionReason = useCallback((itemId: string): string => {
    return conferenceState?.rejectionReasons?.[itemId] || "";
  }, [conferenceState]);

  const getObservation = useCallback((itemId: string): string => {
    return conferenceState?.observations?.[itemId] || "";
  }, [conferenceState]);

  // Actualizar campo no conferenceState persistido (com debounce implícito via onChange)
  const updateField = useCallback((
    field: keyof Omit<ConferenceState, "deliveryId" | "startedAt" | "lastUpdatedAt">,
    itemId: string,
    value: number | string
  ) => {
    const now = new Date().toISOString();
    const current = conferenceState;
    const updated: ConferenceState = {
      deliveryId: delivery.id,
      deliveredQuantities: { ...(current?.deliveredQuantities || {}) },
      acceptedQuantities: { ...(current?.acceptedQuantities || {}) },
      rejectionReasons: { ...(current?.rejectionReasons || {}) },
      observations: { ...(current?.observations || {}) },
      startedAt: current?.startedAt || now,
      lastUpdatedAt: now,
    };
    (updated[field] as Record<string, unknown>)[itemId] = value;
    onConferenceStateChange(updated);
  }, [conferenceState, delivery.id, onConferenceStateChange]);

  // Calcular itens concluídos para mostrar progresso
  const completedItems = deliveryItems.filter((item) => {
    const accepted = getAccepted(item.id, item);
    return accepted > 0;
  }).length;
  const totalItems = deliveryItems.length;
  const progressPct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Processar Lote de Receção
  const handleProcessBatch = async () => {
    setLoading(true);
    setError(null);
    try {
      const batchMovementIds: string[] = [];
      const batchItems: ReceiptBatchItem[] = [];
      const batchIndex = (delivery.batches?.length || 0) + 1;
      const timestamp = new Date().toISOString();
      const idempotencyBase = `batch-${delivery.id}-${batchIndex}`;

      for (const item of deliveryItems) {
        const acceptedQty = getAccepted(item.id, item);
        const deliveredQty = getDelivered(item.id, item);
        const rejectedQty = Math.max(0, deliveredQty - acceptedQty);

        if (acceptedQty > 0) {
          const idempotencyKey = `${idempotencyBase}-${item.id}`;
          try {
            const res = await inventoryActions.receiveStock({
              tenantId: toTenantId(activeTenantId),
              companyId: toCompanyId(activeCompanyId),
              correlationId: delivery.id,
              idempotencyKey,
              timestamp,
              sourceModule: "delivery_conference_section",
              materialId: item.materialId,
              locationId: destLocationId,
              quantity: acceptedQty,
              unitCost: item.actualUnitCost || item.unitPrice || 0,
            });
            if (res?.movementIds) batchMovementIds.push(...res.movementIds);
          } catch (err) {
            console.warn(`[ConferenceSection] Erro ao registar movimento para item ${item.id}:`, err);
          }
        }

        batchItems.push({
          id: `bitem-${Date.now()}-${item.id}`,
          batchId: `${idempotencyBase}`,
          materialId: item.materialId,
          purchaseOrderItemId: item.purchaseOrderItemId,
          deliveredQuantity: deliveredQty,
          acceptedQuantity: acceptedQty,
          rejectedQuantity: rejectedQty,
          rejectionReason: getRejectionReason(item.id),
          unitPrice: item.actualUnitCost || item.unitPrice,
          notes: getObservation(item.id),
        });
      }

      const newBatch: ReceiptBatch = {
        id: `${idempotencyBase}-${Date.now()}`,
        deliveryId: delivery.id,
        batchNumber: `LOTE-${batchIndex.toString().padStart(3, "0")}`,
        receivedAt: timestamp,
        receivedByUserId: "USER-1",
        receivedByUserName: delivery.receivedByUserName || "Fiel de Armazém",
        items: batchItems,
        movementIds: batchMovementIds,
        correlationId: delivery.id,
        idempotencyKey: `${idempotencyBase}-corr`,
        notes: globalNotes,
      };

      // Calcular novo estado da entrega
      const totalAccepted = batchItems.reduce((s, b) => s + b.acceptedQuantity, 0);
      const totalExpected = deliveryItems.reduce((s, i) => s + (i.quantityExpected || 0), 0);
      const hasRejections = batchItems.some((b) => (b.rejectedQuantity || 0) > 0);

      let nextStatus: DeliveryStatus = "received";
      if (totalAccepted < totalExpected) {
        nextStatus = "partially_received";
      } else if (hasRejections) {
        nextStatus = "received_with_divergence";
      }

      toast.success(
        `${newBatch.batchNumber} processado! ${batchMovementIds.length} movimento(s) de stock criado(s).`
      );

      onBatchProcessed(newBatch, nextStatus);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao processar lote.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Cabeçalho da Secção */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-blue-600" />
          <div>
            <h2 className="text-sm font-bold text-foreground">Conferência de Carga</h2>
            <p className="text-xs text-muted-foreground">
              Registe as quantidades reais de cada item. O lote será processado e o stock atualizado imediatamente.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono">
            {completedItems}/{totalItems} itens · {progressPct}%
          </span>
          <Button size="sm" variant="ghost" onClick={onClose} className="gap-1.5 h-7 text-xs">
            <ArrowLeft className="w-3 h-3" />
            Voltar à Ficha
          </Button>
        </div>
      </div>

      {/* Informação do destino */}
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50/60 border border-blue-200/60 rounded-lg text-xs text-blue-700">
        <Info className="w-3.5 h-3.5 shrink-0" />
        <span>
          Destino congelado:{" "}
          <strong>
            {delivery.destinationType === "central_stock" ? "Stock Central / Armazém" : `Obra · ${delivery.destinationProjectId || "—"}`}
          </strong>
          {" "}— Este destino é herdado do Pedido de Compra e não pode ser alterado.
        </span>
      </div>

      {/* Erro */}
      {error && (
        <Alert variant="destructive" className="py-2 text-xs">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabela de Conferência */}
      <Card className="border-border/60">
        <CardHeader className="py-3 px-4 bg-muted/20 border-b border-border/60">
          <CardTitle className="text-xs font-bold flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            <span>Conferência Item a Item — {deliveryItems.length} material(is)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/10 hover:bg-transparent">
                  <TableHead className="text-xs w-[200px]">Material</TableHead>
                  <TableHead className="text-xs text-right w-[100px]">Pedido</TableHead>
                  <TableHead className="text-xs text-right w-[120px]">Qtd Entregue</TableHead>
                  <TableHead className="text-xs text-right w-[120px]">Qtd Aceite</TableHead>
                  <TableHead className="text-xs text-right w-[100px]">Rejeitado</TableHead>
                  <TableHead className="text-xs w-[200px]">Motivo da Rejeição</TableHead>
                  <TableHead className="text-xs w-[180px]">Observações</TableHead>
                  <TableHead className="text-xs w-[90px]">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveryItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-xs text-muted-foreground">
                      Nenhum item registado nesta entrega.
                    </TableCell>
                  </TableRow>
                ) : (
                  deliveryItems.map((item) => {
                    const matDisplay = getMaterialDisplay(item.materialId, materials);
                    const delivered = getDelivered(item.id, item);
                    const accepted = getAccepted(item.id, item);
                    const rejected = Math.max(0, delivered - accepted);
                    const reason = getRejectionReason(item.id);
                    const obs = getObservation(item.id);
                    const isCompleted = accepted >= (item.quantityExpected || 1);
                    const isPartial = accepted > 0 && !isCompleted;
                    const isRejected = accepted === 0 && rejected > 0;

                    return (
                      <TableRow key={item.id} className="text-xs hover:bg-muted/20">
                        <TableCell className="font-medium py-2">
                          <div className="font-semibold text-foreground">{matDisplay.name}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">{matDisplay.sku}</div>
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold py-2">
                          {item.quantityExpected}
                          <span className="text-[10px] text-muted-foreground ml-1">{matDisplay.unit}</span>
                        </TableCell>

                        {/* Qtd Entregue (editável) */}
                        <TableCell className="py-2">
                          <Input
                            type="number"
                            min="0"
                            value={delivered}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              updateField("deliveredQuantities", item.id, val);
                              // Auto-ajustar aceite para não exceder entregue
                              if (getAccepted(item.id, item) > val) {
                                updateField("acceptedQuantities", item.id, val);
                              }
                            }}
                            className="h-7 w-20 text-xs font-mono text-right ml-auto"
                          />
                        </TableCell>

                        {/* Qtd Aceite (editável) */}
                        <TableCell className="py-2">
                          <Input
                            type="number"
                            min="0"
                            max={delivered}
                            value={accepted}
                            onChange={(e) => {
                              const val = Math.min(parseFloat(e.target.value) || 0, delivered);
                              updateField("acceptedQuantities", item.id, val);
                            }}
                            className="h-7 w-20 text-xs font-mono text-right ml-auto text-emerald-700"
                          />
                        </TableCell>

                        {/* Qtd Rejeitada (calculada) */}
                        <TableCell className="text-right font-mono py-2">
                          <span className={rejected > 0 ? "text-rose-600 font-bold" : "text-muted-foreground"}>
                            {rejected}
                          </span>
                        </TableCell>

                        {/* Motivo de Rejeição */}
                        <TableCell className="py-2">
                          {rejected > 0 ? (
                            <Select value={reason} onValueChange={(v) => updateField("rejectionReasons", item.id, v)}>
                              <SelectTrigger className="h-7 text-xs w-full">
                                <SelectValue placeholder="Selecionar motivo..." />
                              </SelectTrigger>
                              <SelectContent>
                                {REJECTION_REASONS.map((r) => (
                                  <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-muted-foreground text-[11px]">—</span>
                          )}
                        </TableCell>

                        {/* Observações */}
                        <TableCell className="py-2">
                          <Input
                            value={obs}
                            onChange={(e) => updateField("observations", item.id, e.target.value)}
                            placeholder="Nota opcional..."
                            className="h-7 text-xs w-full"
                          />
                        </TableCell>

                        {/* Estado */}
                        <TableCell className="py-2">
                          {isCompleted ? (
                            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                              <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> Concluído
                            </Badge>
                          ) : isPartial ? (
                            <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">
                              Parcial
                            </Badge>
                          ) : isRejected ? (
                            <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-600 border-rose-500/20">
                              Rejeitado
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] bg-slate-500/10 text-slate-500 border-slate-500/20">
                              Pendente
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Observações Gerais do Lote */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Observações Gerais da Conferência</Label>
        <Textarea
          value={globalNotes}
          onChange={(e) => setGlobalNotes(e.target.value)}
          placeholder="Condições gerais da entrega, estado do veículo, local de descarga, temperatura..."
          rows={2}
          className="text-xs resize-none"
        />
      </div>

      {/* Barra de Ações da Conferência */}
      <div className="flex items-center justify-between pt-2 border-t border-border/60">
        <Button size="sm" variant="outline" onClick={onClose} className="gap-1.5 h-8 text-xs">
          <ArrowLeft className="w-3.5 h-3.5" />
          Cancelar e Voltar
        </Button>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenSummary}
            disabled={loading || completedItems === 0}
            className="gap-1.5 h-8 text-xs"
          >
            Rever Resumo Final
          </Button>
          <Button
            size="sm"
            onClick={handleProcessBatch}
            disabled={loading || completedItems === 0}
            className="gap-1.5 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            id="btn-processar-lote"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            Processar Lote & Atualizar Stock
          </Button>
        </div>
      </div>
    </div>
  );
}
