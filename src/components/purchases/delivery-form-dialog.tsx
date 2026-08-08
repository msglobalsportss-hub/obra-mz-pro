import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useObraMZStore } from "@/store/obramz-store";
import { formatMZN } from "@/lib/format";
import type { PurchaseOrder } from "@/lib/purchases";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface DeliveryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseOrder: PurchaseOrder;
}

export function DeliveryFormDialog({
  open,
  onOpenChange,
  purchaseOrder,
}: DeliveryFormDialogProps) {
  const addDelivery = useObraMZStore((s) => s.addDelivery);
  const addDeliveryItem = useObraMZStore((s) => s.addDeliveryItem);
  const confirmDelivery = useObraMZStore((s) => s.confirmDelivery);
  const orderItems = useObraMZStore((s) => s.purchaseOrderItems).filter(
    (i) => i.purchaseOrderId === purchaseOrder.id
  );

  const [deliveryDate, setDeliveryDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [supplierDocumentNumber, setSupplierDocumentNumber] = useState<string>("");
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState<string>("");
  const [receivedBy, setReceivedBy] = useState<string>("");
  const [receivedLocation, setReceivedLocation] = useState<string>("");
  const [vehiclePlate, setVehiclePlate] = useState<string>("");
  const [driverName, setDriverName] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [shouldConfirmNow, setShouldConfirmNow] = useState<boolean>(true);

  // Mapeamento de quantidades para cada item do pedido
  // itemValues[itemId] = { received, accepted, rejected, damaged, actualCost }
  const [itemValues, setItemValues] = useState<
    Record<
      string,
      {
        receivedPurchaseQuantity: number;
        acceptedQuantity: number;
        rejectedQuantity: number;
        damagedQuantity: number;
        actualUnitCost: number;
      }
    >
  >({});

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setDeliveryDate(new Date().toISOString().slice(0, 10));
    setSupplierDocumentNumber("");
    setInvoiceNumber("");
    setDeliveryNoteNumber("");
    setReceivedBy("");
    setReceivedLocation("");
    setVehiclePlate("");
    setDriverName("");
    setNotes("");
    setShouldConfirmNow(true);
    setError(null);

    // Inicializar valores com a quantidade restante por omissão
    const initialMap: Record<string, any> = {};
    for (const item of orderItems) {
      const rem = Math.max(0, item.remainingPurchaseQuantity);
      const remBase = rem * item.conversionFactor;
      initialMap[item.id] = {
        receivedPurchaseQuantity: rem,
        acceptedQuantity: remBase,
        rejectedQuantity: 0,
        damagedQuantity: 0,
        actualUnitCost: item.unitPrice,
      };
    }
    setItemValues(initialMap);
  }, [open, purchaseOrder, orderItems]);

  const handleItemChange = (
    itemId: string,
    field: string,
    val: number
  ) => {
    setItemValues((prev) => {
      const current = prev[itemId] || {
        receivedPurchaseQuantity: 0,
        acceptedQuantity: 0,
        rejectedQuantity: 0,
        damagedQuantity: 0,
        actualUnitCost: 0,
      };

      const updated = { ...current, [field]: val };
      const itemConfig = orderItems.find((i) => i.id === itemId);
      const cf = itemConfig?.conversionFactor || 1;

      // Se alterou a quantidade física recebida, ajustar automaticamente a aceite base
      if (field === "receivedPurchaseQuantity") {
        const newReceivedBase = val * cf;
        updated.acceptedQuantity = Math.max(0, newReceivedBase - updated.rejectedQuantity);
      } else if (field === "rejectedQuantity") {
        const receivedBase = updated.receivedPurchaseQuantity * cf;
        updated.acceptedQuantity = Math.max(0, receivedBase - val);
      }

      return { ...prev, [itemId]: updated };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Filtrar itens com quantidade fisicamente recebida > 0
    const itemsToDeliver = orderItems.filter((i) => {
      const val = itemValues[i.id];
      return val && val.receivedPurchaseQuantity > 0;
    });

    if (itemsToDeliver.length === 0) {
      setError("Indique a quantidade recebida para pelo menos um item.");
      return;
    }

    try {
      // 1. Criar a entrega em draft
      const newDelivery = addDelivery({
        purchaseOrderId: purchaseOrder.id,
        supplierId: purchaseOrder.supplierId,
        deliveryDate,
        supplierDocumentNumber: supplierDocumentNumber.trim() || undefined,
        invoiceNumber: invoiceNumber.trim() || undefined,
        deliveryNoteNumber: deliveryNoteNumber.trim() || undefined,
        status: "draft",
        receivedBy: receivedBy.trim() || undefined,
        receivedLocation: receivedLocation.trim() || undefined,
        vehiclePlate: vehiclePlate.trim() || undefined,
        driverName: driverName.trim() || undefined,
        destinationType: purchaseOrder.destinationType,
        destinationProjectId: purchaseOrder.destinationProjectId,
        notes: notes.trim() || undefined,
      });

      // 2. Adicionar os itens da entrega
      for (const poItem of itemsToDeliver) {
        const val = itemValues[poItem.id];
        addDeliveryItem({
          deliveryId: newDelivery.id,
          purchaseOrderItemId: poItem.id,
          materialId: poItem.materialId,
          purchaseUnitId: poItem.purchaseUnitId,
          conversionFactor: poItem.conversionFactor,
          receivedPurchaseQuantity: val.receivedPurchaseQuantity,
          acceptedQuantity: val.acceptedQuantity,
          rejectedQuantity: val.rejectedQuantity || undefined,
          damagedQuantity: val.damagedQuantity || undefined,
          actualUnitCost: val.actualUnitCost,
        });
      }

      // 3. Confirmar atomicamente se a opção estiver ativa
      if (shouldConfirmNow) {
        confirmDelivery(newDelivery.id);
      }

      onOpenChange(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            Registar Entrega de Material — {purchaseOrder.orderNumber}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          {error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 dark:bg-rose-950/50 rounded border border-rose-200 dark:border-rose-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Dados da Entrega */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Data da Entrega *</Label>
              <Input
                type="date"
                className="text-xs h-9"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Nº Guia de Remessa / Guia</Label>
              <Input
                placeholder="Ex: GR-2026-90"
                className="text-xs h-9"
                value={deliveryNoteNumber}
                onChange={(e) => setDeliveryNoteNumber(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Nº Fatura (opcional)</Label>
              <Input
                placeholder="Ex: FT-2026-104"
                className="text-xs h-9"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Recebido Por (Responsável)</Label>
              <Input
                placeholder="Ex: Carlos Matos"
                className="text-xs h-9"
                value={receivedBy}
                onChange={(e) => setReceivedBy(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Local de Receção</Label>
              <Input
                placeholder="Ex: Portão Principal"
                className="text-xs h-9"
                value={receivedLocation}
                onChange={(e) => setReceivedLocation(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Matrícula do Veículo</Label>
              <Input
                placeholder="Ex: MBP-12-34"
                className="text-xs h-9"
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value)}
              />
            </div>
          </div>

          {/* Tabela de Itens para Receção */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Conferência Qualitativa e Quantitativa dos Itens
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="p-2.5">Material</th>
                    <th className="p-2.5 text-center">Restante</th>
                    <th className="p-2.5 text-center">Descarregado (Físico)</th>
                    <th className="p-2.5 text-center">Aceite (Base)</th>
                    <th className="p-2.5 text-center">Rejeitado (Base)</th>
                    <th className="p-2.5 text-right">Custo Real (Un. Compra)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {orderItems.map((item) => {
                    const vals = itemValues[item.id] || {
                      receivedPurchaseQuantity: 0,
                      acceptedQuantity: 0,
                      rejectedQuantity: 0,
                      actualUnitCost: item.unitPrice,
                    };
                    const cf = item.conversionFactor || 1;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                        <td className="p-2.5">
                          <div className="font-medium">{item.descriptionSnapshot}</div>
                          <div className="text-[10px] text-slate-400">
                            Un. Compra: {item.purchaseUnitSymbolSnapshot} | Factor: {cf}
                          </div>
                        </td>
                        <td className="p-2.5 text-center font-medium text-slate-500">
                          {item.remainingPurchaseQuantity} {item.purchaseUnitSymbolSnapshot}
                        </td>
                        <td className="p-2.5 text-center w-28">
                          <Input
                            type="number"
                            min="0"
                            step="any"
                            className="text-xs h-8 text-center font-semibold"
                            value={vals.receivedPurchaseQuantity}
                            onChange={(e) =>
                              handleItemChange(
                                item.id,
                                "receivedPurchaseQuantity",
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        </td>
                        <td className="p-2.5 text-center w-28">
                          <Input
                            type="number"
                            min="0"
                            step="any"
                            className="text-xs h-8 text-center text-emerald-700 font-semibold"
                            value={vals.acceptedQuantity}
                            onChange={(e) =>
                              handleItemChange(
                                item.id,
                                "acceptedQuantity",
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                          <span className="text-[9px] text-slate-400 block">{item.baseUnitSymbolSnapshot}</span>
                        </td>
                        <td className="p-2.5 text-center w-24">
                          <Input
                            type="number"
                            min="0"
                            step="any"
                            className="text-xs h-8 text-center text-rose-600"
                            value={vals.rejectedQuantity}
                            onChange={(e) =>
                              handleItemChange(
                                item.id,
                                "rejectedQuantity",
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                          <span className="text-[9px] text-slate-400 block">{item.baseUnitSymbolSnapshot}</span>
                        </td>
                        <td className="p-2.5 text-right w-32">
                          <Input
                            type="number"
                            min="0"
                            step="any"
                            className="text-xs h-8 text-right"
                            value={vals.actualUnitCost}
                            onChange={(e) =>
                              handleItemChange(
                                item.id,
                                "actualUnitCost",
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Observações da Entrega</Label>
            <Textarea
              placeholder="Notas sobre o estado do descarregamento..."
              className="text-xs min-h-[50px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900/60 rounded border border-slate-200 dark:border-slate-800">
            <input
              type="checkbox"
              id="confirmNow"
              checked={shouldConfirmNow}
              onChange={(e) => setShouldConfirmNow(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="confirmNow" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              Confirmar entrega e atualizar stock/custo médio imediatamente ao guardar
            </label>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm">
              {shouldConfirmNow ? "Confirmar & Entrada de Stock" : "Guardar Rascunho de Entrega"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
