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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useObraMZStore } from "@/store/obramz-store";
import { formatMZN } from "@/lib/format";
import { PurchaseOrderItemForm } from "./purchase-order-item-form";
import type { DestinationType, PaymentTermType, PurchaseOrder } from "@/lib/purchases";
import { PAYMENT_TERM_LABELS } from "@/lib/suppliers/supplier-utils";
import { Trash2 } from "lucide-react";

interface PurchaseOrderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderToEdit?: PurchaseOrder;
  initialDuplicateData?: any;
}

export function PurchaseOrderFormDialog({
  open,
  onOpenChange,
  orderToEdit,
  initialDuplicateData,
}: PurchaseOrderFormDialogProps) {
  const suppliers = useObraMZStore((s) => s.suppliers);
  const obras = useObraMZStore((s) => s.obras);
  const addPurchaseOrder = useObraMZStore((s) => s.addPurchaseOrder);
  const updatePurchaseOrder = useObraMZStore((s) => s.updatePurchaseOrder);
  const addPurchaseOrderItem = useObraMZStore((s) => s.addPurchaseOrderItem);
  const removePurchaseOrderItem = useObraMZStore((s) => s.removePurchaseOrderItem);
  const existingOrderItems = useObraMZStore((s) => s.purchaseOrderItems);

  const [supplierId, setSupplierId] = useState<string>("");
  const [supplierReference, setSupplierReference] = useState<string>("");
  const [destinationType, setDestinationType] = useState<DestinationType>("central_stock");
  const [destinationProjectId, setDestinationProjectId] = useState<string>("");
  const [orderDate, setOrderDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>("");
  const [paymentTermType, setPaymentTermType] = useState<PaymentTermType | undefined>(undefined);
  const [commercialConditions, setCommercialConditions] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [internalNotes, setInternalNotes] = useState<string>("");

  // Lista local de itens para modo de criação/duplicação
  const [draftItems, setDraftItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!orderToEdit;

  useEffect(() => {
    if (!open) return;

    if (orderToEdit) {
      setSupplierId(orderToEdit.supplierId);
      setSupplierReference(orderToEdit.supplierReference || "");
      setDestinationType(orderToEdit.destinationType);
      setDestinationProjectId(orderToEdit.destinationProjectId || "");
      setOrderDate(orderToEdit.orderDate ? orderToEdit.orderDate.slice(0, 10) : "");
      setExpectedDeliveryDate(orderToEdit.expectedDeliveryDate ? orderToEdit.expectedDeliveryDate.slice(0, 10) : "");
      setPaymentTermType(orderToEdit.paymentTermType);
      setCommercialConditions(orderToEdit.commercialConditions || "");
      setNotes(orderToEdit.notes || "");
      setInternalNotes(orderToEdit.internalNotes || "");
    } else if (initialDuplicateData) {
      setSupplierId(initialDuplicateData.supplierId || "");
      setSupplierReference(initialDuplicateData.supplierReference || "");
      setDestinationType(initialDuplicateData.destinationType || "central_stock");
      setDestinationProjectId(initialDuplicateData.destinationProjectId || "");
      setOrderDate(initialDuplicateData.orderDate || new Date().toISOString().slice(0, 10));
      setExpectedDeliveryDate("");
      setPaymentTermType(initialDuplicateData.paymentTermType);
      setCommercialConditions(initialDuplicateData.commercialConditions || "");
      setNotes(initialDuplicateData.notes || "");
      setInternalNotes(initialDuplicateData.internalNotes || "");
      setDraftItems(initialDuplicateData.items || []);
    } else {
      setSupplierId("");
      setSupplierReference("");
      setDestinationType("central_stock");
      setDestinationProjectId("");
      setOrderDate(new Date().toISOString().slice(0, 10));
      setExpectedDeliveryDate("");
      setPaymentTermType(undefined);
      setCommercialConditions("");
      setNotes("");
      setInternalNotes("");
      setDraftItems([]);
    }
    setError(null);
  }, [open, orderToEdit, initialDuplicateData]);

  // Atualizar condições do fornecedor quando selecionado
  const handleSupplierChange = (val: string) => {
    setSupplierId(val);
    const supp = suppliers.find((s) => s.id === val);
    if (supp) {
      if (supp.paymentTermType) setPaymentTermType(supp.paymentTermType);
    }
  };

  const handleAddDraftItem = (item: any) => {
    if (isEditing && orderToEdit) {
      // Se estamos a editar um pedido persistido, adiciona logo ao store
      try {
        addPurchaseOrderItem({
          ...item,
          purchaseOrderId: orderToEdit.id,
        });
      } catch (err: any) {
        setError(err.message);
      }
    } else {
      setDraftItems((prev) => [...prev, { ...item, id: `draft-${Date.now()}-${Math.random()}` }]);
    }
  };

  const handleRemoveDraftItem = (indexOrId: number | string) => {
    if (isEditing && typeof indexOrId === "string") {
      try {
        removePurchaseOrderItem(indexOrId);
      } catch (err: any) {
        setError(err.message);
      }
    } else if (typeof indexOrId === "number") {
      setDraftItems((prev) => prev.filter((_, idx) => idx !== indexOrId));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const activeItems = isEditing && orderToEdit
      ? existingOrderItems.filter((i) => i.purchaseOrderId === orderToEdit.id)
      : draftItems;

    if (activeItems.length === 0) {
      setError("O pedido de compra deve ter pelo menos um item.");
      return;
    }

    try {
      if (isEditing && orderToEdit) {
        updatePurchaseOrder(orderToEdit.id, {
          supplierId,
          supplierReference: supplierReference.trim() || undefined,
          destinationType,
          destinationProjectId: destinationType !== "central_stock" ? destinationProjectId : undefined,
          orderDate,
          expectedDeliveryDate: expectedDeliveryDate || undefined,
          paymentTermType,
          commercialConditions: commercialConditions.trim() || undefined,
          notes: notes.trim() || undefined,
          internalNotes: internalNotes.trim() || undefined,
        });
      } else {
        // Criar pedido no store
        const createdPO = addPurchaseOrder({
          supplierId,
          supplierReference: supplierReference.trim() || undefined,
          destinationType,
          destinationProjectId: destinationType !== "central_stock" ? destinationProjectId : undefined,
          orderDate,
          expectedDeliveryDate: expectedDeliveryDate || undefined,
          status: "draft",
          currency: "MZN",
          paymentTermType,
          commercialConditions: commercialConditions.trim() || undefined,
          notes: notes.trim() || undefined,
          internalNotes: internalNotes.trim() || undefined,
        });

        // Adicionar todos os itens da lista rascunho
        for (const item of draftItems) {
          addPurchaseOrderItem({
            purchaseOrderId: createdPO.id,
            materialId: item.materialId,
            supplierMaterialId: item.supplierMaterialId,
            descriptionSnapshot: item.descriptionSnapshot,
            brandSnapshot: item.brandSnapshot,
            purchaseUnitId: item.purchaseUnitId,
            purchaseUnitSymbolSnapshot: item.purchaseUnitSymbolSnapshot,
            baseUnitId: item.baseUnitId,
            baseUnitSymbolSnapshot: item.baseUnitSymbolSnapshot,
            conversionFactor: item.conversionFactor,
            orderedPurchaseQuantity: item.orderedPurchaseQuantity,
            unitPrice: item.unitPrice,
            notes: item.notes,
          });
        }
      }

      onOpenChange(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const activeItems = isEditing && orderToEdit
    ? existingOrderItems.filter((i) => i.purchaseOrderId === orderToEdit.id)
    : draftItems;

  const currentSubtotal = activeItems.reduce(
    (sum, item) => sum + (item.lineTotal || (item.orderedPurchaseQuantity * item.unitPrice)),
    0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {isEditing ? `Editar Pedido ${orderToEdit?.orderNumber}` : "Novo Pedido de Compra"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          {error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-300 rounded border border-rose-200 dark:border-rose-900">
              {error}
            </div>
          )}

          {/* Dados Cabecalho */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Fornecedor *</Label>
              <Select value={supplierId} onValueChange={handleSupplierChange} disabled={isEditing}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Selecione o fornecedor..." />
                </SelectTrigger>
                <SelectContent>
                  {suppliers
                    .filter((s) => s.status === "active" || s.id === supplierId)
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-xs">
                        {s.name} ({s.province})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Ref. Cotação do Fornecedor</Label>
              <Input
                placeholder="Ex: QT-2026-0042"
                className="text-xs"
                value={supplierReference}
                onChange={(e) => setSupplierReference(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Destino da Compra *</Label>
              <Select
                value={destinationType}
                onValueChange={(val: DestinationType) => setDestinationType(val)}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="central_stock" className="text-xs">Stock Central</SelectItem>
                  <SelectItem value="project" className="text-xs">Obra Específica</SelectItem>
                  <SelectItem value="supplier_direct" className="text-xs">Entrega Direta na Obra</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {destinationType !== "central_stock" && (
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs">Obra de Destino *</Label>
                <Select value={destinationProjectId} onValueChange={setDestinationProjectId}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Selecione a obra..." />
                  </SelectTrigger>
                  <SelectContent>
                    {obras.map((o) => (
                      <SelectItem key={o.id} value={o.id} className="text-xs">
                        {o.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {destinationType === "central_stock" && (
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs">Data do Pedido *</Label>
                <Input
                  type="date"
                  className="text-xs"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {destinationType !== "central_stock" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Data do Pedido *</Label>
                <Input
                  type="date"
                  className="text-xs"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">Previsão de Entrega</Label>
              <Input
                type="date"
                className="text-xs"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Condições de Pagamento</Label>
              <Select
                value={paymentTermType || "none"}
                onValueChange={(v) => setPaymentTermType(v === "none" ? undefined : (v as PaymentTermType))}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Selecione a condição..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs">Não especificada</SelectItem>
                  {Object.entries(PAYMENT_TERM_LABELS).map(([k, label]) => (
                    <SelectItem key={k} value={k} className="text-xs">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Subcomponente para adicionar itens */}
          <PurchaseOrderItemForm
            supplierId={supplierId}
            purchaseOrderId={isEditing ? orderToEdit?.id : undefined}
            onAddItemDirect={handleAddDraftItem}
          />

          {/* Tabela de Itens Adicionados */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>Itens no Pedido ({activeItems.length})</span>
              <span>Subtotal: {formatMZN(currentSubtotal)}</span>
            </div>

            {activeItems.length === 0 ? (
              <div className="text-xs text-slate-500 text-center py-6 border border-dashed rounded-lg">
                Nenhum item adicionado ao pedido ainda.
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="p-2.5">Material</th>
                      <th className="p-2.5 text-right">Qtd</th>
                      <th className="p-2.5 text-right">Preço Un.</th>
                      <th className="p-2.5 text-right">Subtotal</th>
                      <th className="p-2.5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {activeItems.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                        <td className="p-2.5 font-medium">
                          {item.descriptionSnapshot || item.materialId}
                          {item.brandSnapshot && (
                            <span className="text-[10px] text-slate-400 block font-normal">Marca: {item.brandSnapshot}</span>
                          )}
                        </td>
                        <td className="p-2.5 text-right">
                          {item.orderedPurchaseQuantity} {item.purchaseUnitSymbolSnapshot}
                        </td>
                        <td className="p-2.5 text-right">{formatMZN(item.unitPrice)}</td>
                        <td className="p-2.5 text-right font-semibold">
                          {formatMZN(item.lineTotal || (item.orderedPurchaseQuantity * item.unitPrice))}
                        </td>
                        <td className="p-2.5 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            onClick={() => handleRemoveDraftItem(isEditing ? item.id : idx)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Observações do Pedido</Label>
            <Textarea
              placeholder="Notas comerciais para o fornecedor..."
              className="text-xs min-h-[60px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
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
            <Button type="submit" size="sm" disabled={activeItems.length === 0}>
              {isEditing ? "Guardar Alterações" : "Criar Pedido de Compra"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
