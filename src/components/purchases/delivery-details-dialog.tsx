import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useObraMZStore } from "@/store/obramz-store";
import { formatMZN, formatDate } from "@/lib/format";
import type { Delivery } from "@/lib/purchases";
import { DeliveryStatusBadge } from "./purchase-order-status-badge";
import { Truck, CheckCircle2, FileText, User } from "lucide-react";

interface DeliveryDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  delivery?: Delivery;
}

export function DeliveryDetailsDialog({
  open,
  onOpenChange,
  delivery,
}: DeliveryDetailsDialogProps) {
  const deliveryItems = useObraMZStore((s) => s.deliveryItems).filter(
    (i) => delivery && i.deliveryId === delivery.id
  );
  const purchaseOrder = useObraMZStore((s) => s.purchaseOrders).find(
    (o) => delivery && o.id === delivery.purchaseOrderId
  );
  const supplier = useObraMZStore((s) => s.suppliers).find(
    (s) => delivery && s.id === delivery.supplierId
  );
  const project = useObraMZStore((s) => s.obras).find(
    (o) => delivery && o.id === delivery.destinationProjectId
  );

  if (!delivery) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              Entrega {delivery.deliveryNumber}
            </DialogTitle>
            <DeliveryStatusBadge status={delivery.status} />
          </div>
        </DialogHeader>

        <div className="space-y-5 py-2 text-xs">
          {/* Ficha Resumo */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-slate-500 block">Pedido de Compra</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {purchaseOrder?.orderNumber || "—"}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Fornecedor</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {supplier?.name || "—"}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Data da Entrega</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {formatDate(delivery.deliveryDate)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Destino</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {delivery.destinationType === "central_stock"
                  ? "Stock Central"
                  : project?.nome || "Obra"}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Nº Guia de Remessa</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {delivery.deliveryNoteNumber || delivery.supplierDocumentNumber || "—"}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Nº Fatura</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {delivery.invoiceNumber || "—"}
              </span>
            </div>
          </div>

          {/* Dados Logísticos */}
          {(delivery.receivedBy || delivery.receivedLocation || delivery.vehiclePlate) && (
            <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg space-y-1.5 bg-white dark:bg-slate-950">
              <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                Dados Logísticos da Receção
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-slate-600 dark:text-slate-400">
                {delivery.receivedBy && (
                  <div>
                    <span className="text-slate-400">Recebido por:</span> {delivery.receivedBy}
                  </div>
                )}
                {delivery.receivedLocation && (
                  <div>
                    <span className="text-slate-400">Local:</span> {delivery.receivedLocation}
                  </div>
                )}
                {delivery.vehiclePlate && (
                  <div>
                    <span className="text-slate-400">Matrícula:</span> {delivery.vehiclePlate}
                  </div>
                )}
                {delivery.driverName && (
                  <div>
                    <span className="text-slate-400">Motorista:</span> {delivery.driverName}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Itens Recebidos */}
          <div className="space-y-2">
            <div className="font-semibold text-slate-700 dark:text-slate-300">
              Itens da Entrega ({deliveryItems.length})
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="p-2.5">Material</th>
                    <th className="p-2.5 text-right">Físico Descarregado</th>
                    <th className="p-2.5 text-right">Aceite (Base)</th>
                    <th className="p-2.5 text-right">Rejeitado</th>
                    <th className="p-2.5 text-right">Custo Real Un.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {deliveryItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                      <td className="p-2.5 font-medium">{item.materialId}</td>
                      <td className="p-2.5 text-right">
                        {item.receivedPurchaseQuantity}
                      </td>
                      <td className="p-2.5 text-right font-semibold text-emerald-600">
                        {item.acceptedQuantity}
                      </td>
                      <td className="p-2.5 text-right text-rose-500">
                        {item.rejectedQuantity || 0}
                      </td>
                      <td className="p-2.5 text-right">{formatMZN(item.actualUnitCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {delivery.notes && (
            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-200 dark:border-slate-800">
              <span className="font-semibold block mb-0.5 text-slate-700 dark:text-slate-300">Observações:</span>
              <p className="text-slate-600 dark:text-slate-400">{delivery.notes}</p>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button size="sm" variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
