import React, { useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useObraMZStore } from "@/store/obramz-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMZN, formatDate } from "@/lib/format";
import { PurchaseOrderStatusBadge, DeliveryStatusBadge } from "@/components/purchases/purchase-order-status-badge";
import { DeliveryFormDialog } from "@/components/purchases/delivery-form-dialog";
import { DeliveryDetailsDialog } from "@/components/purchases/delivery-details-dialog";
import { PurchaseOrderFormDialog } from "@/components/purchases/purchase-order-form-dialog";
import { StockMovementList } from "@/components/purchases/stock-movement-list";
import type { Delivery } from "@/lib/purchases";
import {
  ArrowLeft,
  CheckCircle2,
  Send,
  XCircle,
  Copy,
  Truck,
  PackageCheck,
  Building2,
  FileText,
  Clock,
  Pencil,
  ShoppingCart,
  LayoutDashboard,
  Plus,
  ExternalLink,
} from "lucide-react";
import { RelatedEntitiesCard, type RelatedEntityItem } from "@/components/shared/related-entities-card";
import { BusinessContextCard } from "@/components/shared/business-context-card";
import { UnifiedTimeline } from "@/components/shared/unified-timeline";

export const Route = createFileRoute("/app/compras/$purchaseOrderId")({
  component: PurchaseOrderDetailsRoute,
});

import { inventoryStoreManager } from "@/modules/inventory/store/inventory-store";

function PurchaseOrderDetailsRoute() {
  const { purchaseOrderId } = useParams({ from: "/app/compras/$purchaseOrderId" });

  const hydrated = useObraMZStore((s) => s._hydrated);
  const po = useObraMZStore((s) => s.getPurchaseOrderById(purchaseOrderId));
  const supplier = useObraMZStore((s) => s.suppliers).find((s) => s.id === po?.supplierId);
  const project = useObraMZStore((s) => s.obras).find((o) => o.id === po?.destinationProjectId);
  const items = useObraMZStore((s) => s.purchaseOrderItems).filter((i) => i.purchaseOrderId === purchaseOrderId);
  const deliveries = useObraMZStore((s) => s.deliveries).filter((d) => d.purchaseOrderId === purchaseOrderId);
  const legacyMovements = useObraMZStore((s) => s.stockMovements).filter((m) => m.purchaseOrderId === purchaseOrderId);

  const [invState, setInvState] = React.useState(inventoryStoreManager.getState());
  React.useEffect(() => {
    return inventoryStoreManager.subscribe(setInvState);
  }, []);

  const engineMovements = (invState.movements || []).filter(
    (m: any) => m.referenceId === purchaseOrderId || m.correlationId === purchaseOrderId
  );
  const movements = engineMovements.length > 0 ? engineMovements : legacyMovements;

  const approvePurchaseOrder = useObraMZStore((s) => s.approvePurchaseOrder);
  const sendPurchaseOrder = useObraMZStore((s) => s.sendPurchaseOrder);
  const cancelPurchaseOrder = useObraMZStore((s) => s.cancelPurchaseOrder);
  const prepareDuplicate = useObraMZStore((s) => s.preparePurchaseOrderDuplicate);

  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [isDeliveryFormOpen, setIsDeliveryFormOpen] = useState<boolean>(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | undefined>(undefined);
  const [duplicateData, setDuplicateData] = useState<any>(null);
  const [isDuplicateOpen, setIsDuplicateOpen] = useState<boolean>(false);

  const [actionError, setActionError] = useState<string | null>(null);

  if (!hydrated) {
    return (
      <div className="p-12 text-center text-xs text-slate-500">
        A carregar dados do pedido...
      </div>
    );
  }

  if (!po) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
          <ShoppingCart className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Pedido de compra não encontrado
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            O pedido solicitado pode ter sido removido ou o endereço está incorreto.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
          <Button size="sm" variant="default" asChild className="w-full sm:w-auto text-xs">
            <Link to="/app/compras">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Voltar aos Pedidos de Compra
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild className="w-full sm:w-auto text-xs">
            <Link to="/app">
              <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" /> Ir ao Dashboard
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleApprove = () => {
    setActionError(null);
    try {
      approvePurchaseOrder(po.id);
    } catch (e: any) {
      setActionError(e.message);
    }
  };

  const handleSend = () => {
    setActionError(null);
    try {
      sendPurchaseOrder(po.id);
    } catch (e: any) {
      setActionError(e.message);
    }
  };

  const handleCancel = () => {
    if (!window.confirm("Tem a certeza que pretende cancelar este pedido de compra?")) return;
    setActionError(null);
    try {
      cancelPurchaseOrder(po.id);
    } catch (e: any) {
      setActionError(e.message);
    }
  };

  const handleDuplicate = () => {
    const data = prepareDuplicate(po.id);
    if (data) {
      setDuplicateData(data);
      setIsDuplicateOpen(true);
    }
  };

  const canEdit = po.status === "draft";
  const canApprove = po.status === "draft" || po.status === "pending_approval";
  const canSend = po.status === "approved";
  const canAddDelivery = ["approved", "sent", "partially_received"].includes(po.status);
  const canCancel = !["received", "cancelled"].includes(po.status) && !deliveries.some((d) => d.status === "confirmed");

  // Calcular progresso global da receção (em unidades de compra)
  const totalOrdered = items.reduce((sum, i) => sum + i.orderedPurchaseQuantity, 0);
  const totalReceived = items.reduce((sum, i) => sum + i.receivedPurchaseQuantity, 0);
  const progressPercent = totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Voltar e Ações do Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="w-fit text-xs gap-1.5 text-slate-600 dark:text-slate-400"
        >
          <Link to="/app/compras">
            <ArrowLeft className="w-4 h-4" /> Voltar aos Pedidos de Compra
          </Link>
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDuplicate} className="text-xs gap-1.5">
            <Copy className="w-3.5 h-3.5" /> Duplicar Pedido
          </Button>

          {canEdit && (
            <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)} className="text-xs gap-1.5">
              <Pencil className="w-3.5 h-3.5" /> Editar Pedido
            </Button>
          )}

          {canApprove && (
            <Button size="sm" onClick={handleApprove} className="text-xs gap-1.5 bg-blue-600 hover:bg-blue-700">
              <CheckCircle2 className="w-3.5 h-3.5" /> Aprovar Pedido
            </Button>
          )}

          {canSend && (
            <Button size="sm" onClick={handleSend} className="text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700">
              <Send className="w-3.5 h-3.5" /> Marcar como Enviado
            </Button>
          )}

          {canAddDelivery && (
            <Button size="sm" onClick={() => setIsDeliveryFormOpen(true)} className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700">
              <Truck className="w-3.5 h-3.5" /> Registar Entrega
            </Button>
          )}

          {canCancel && (
            <Button variant="destructive" size="sm" onClick={handleCancel} className="text-xs gap-1.5">
              <XCircle className="w-3.5 h-3.5" /> Cancelar
            </Button>
          )}
        </div>
      </div>

      {actionError && (
        <div className="p-3 text-xs text-rose-700 bg-rose-50 dark:bg-rose-950/50 rounded border border-rose-200 dark:border-rose-900">
          {actionError}
        </div>
      )}

      {/* Ficha Principal do Pedido */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {po.orderNumber}
              </h1>
              <PurchaseOrderStatusBadge status={po.status} />
            </div>
            {po.supplierReference && (
              <div className="text-xs text-slate-500 mt-0.5">
                Ref. Fornecedor: <strong className="text-slate-700 dark:text-slate-300">{po.supplierReference}</strong>
              </div>
            )}
          </div>

          <div className="text-left md:text-right">
            <div className="text-xs text-slate-500">Valor Total do Pedido</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatMZN(po.totalAmount)}
            </div>
          </div>
        </div>

        {/* Detalhes Comerciais */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block">Fornecedor</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {supplier?.name || "—"}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block">Destino da Compra</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {po.destinationType === "central_stock" ? "Stock Central" : project?.nome || "Obra"}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block">Data do Pedido</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {formatDate(po.orderDate)}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block">Previsão de Entrega</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {formatDate(po.expectedDeliveryDate)}
            </span>
          </div>
        </div>
      </div>

      {/* Cartão de Contexto Operacional do Negócio (Dinâmico por Estado da PO) */}
      <div className="mb-6 space-y-4">
        <BusinessContextCard
          type="purchase_order"
          entityId={po.id}
          purchaseOrderNumber={po.orderNumber}
          supplierName={supplier?.name}
          destinationName={po.destinationType === "central_stock" ? "Stock Central" : project?.nome}
          totalItemsCount={items.length}
          movementsCount={movements.length}
        />

        {/* Timeline Cronológica Unificada da Compra */}
        <UnifiedTimeline
          events={[
            {
              id: "evt-po-created",
              stage: "po_created",
              title: `Pedido de Compra ${po.orderNumber} Criado`,
              description: `Pedido de compra no valor de ${formatMZN(po.totalAmount)} emitido`,
              date: po.orderDate || po.createdAt,
              user: po.createdByName || "Comprador",
              status: "completed",
            },
            {
              id: "evt-po-approved",
              stage: "po_approved",
              title: `Aprovação & Confirmação do Fornecedor`,
              description: supplier ? `Confirmado por ${supplier.name}` : "Fornecedor notificado",
              date: po.updatedAt || po.createdAt,
              user: "Gestor Comercial",
              status: po.status === "draft" ? "current" : "completed",
            },
            {
              id: "evt-po-del",
              stage: "delivery_created",
              title: `Expedição & Guias de Entrega (${deliveries.length})`,
              description: deliveries.length > 0 ? `${deliveries.length} entrega(s) registada(s)` : "Aguardando envio pelo fornecedor",
              date: deliveries[0]?.createdAt,
              user: "Operações de Logística",
              status: deliveries.length > 0 ? "completed" : po.status === "approved" || po.status === "sent" ? "current" : "pending",
            },
            {
              id: "evt-po-rec",
              stage: "delivery_received",
              title: `Receção Física & Conferência de Carga`,
              description: deliveries.some(d => d.status === "confirmed") ? "Materiais conferidos e validados no destino" : "Aguardando receção",
              date: deliveries.find(d => d.status === "confirmed")?.arrivedAt,
              user: "Fiel de Armazém",
              status: deliveries.some(d => d.status === "confirmed") ? "completed" : "pending",
            },
            {
              id: "evt-po-stock",
              stage: "stock_updated",
              title: `Atualização de Stock & Primeiro Consumo na Obra`,
              description: movements.length > 0 ? `${movements.length} movimentos de stock efetuados` : "Aguardando entrada em inventário",
              date: movements[0]?.createdAt,
              user: "InventoryEngine Core",
              status: movements.length > 0 ? "completed" : "pending",
            },
          ]}
        />
      </div>

      {/* Barra de Progresso de Receção */}
      {po.status !== "draft" && po.status !== "cancelled" && (
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <PackageCheck className="w-4 h-4 text-blue-600" />
              Progresso de Receção do Pedido
            </span>
            <span>{progressPercent}% Recebido ({totalReceived} de {totalOrdered} un. compra)</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-300"
              style={{ width: `${Math.min(100, progressPercent)}%` }}
            />
          </div>
        </div>
      )}

      {/* Tabela de Itens do Pedido */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
          Itens Encomendados ({items.length})
        </div>

        <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold">
              <tr>
                <th className="p-3">Material</th>
                <th className="p-3 text-right">Qtd Pedida</th>
                <th className="p-3 text-right">Qtd Recebida</th>
                <th className="p-3 text-right">Restante</th>
                <th className="p-3 text-right">Preço Un.</th>
                <th className="p-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                  <td className="p-3 font-medium">
                    {item.descriptionSnapshot}
                    {item.brandSnapshot && (
                      <span className="text-[10px] text-slate-400 block font-normal">Marca: {item.brandSnapshot}</span>
                    )}
                  </td>
                  <td className="p-3 text-right font-medium">
                    {item.orderedPurchaseQuantity} {item.purchaseUnitSymbolSnapshot}
                  </td>
                  <td className="p-3 text-right text-emerald-600 font-semibold">
                    {item.receivedPurchaseQuantity} {item.purchaseUnitSymbolSnapshot}
                  </td>
                  <td className="p-3 text-right text-amber-600 font-medium">
                    {item.remainingPurchaseQuantity} {item.purchaseUnitSymbolSnapshot}
                  </td>
                  <td className="p-3 text-right">{formatMZN(item.unitPrice)}</td>
                  <td className="p-3 text-right font-bold">{formatMZN(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Histórico de Entregas */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Truck className="w-4 h-4 text-emerald-600" />
            Entregas Registadas ({deliveries.length})
          </div>

          {canAddDelivery && (
            <Button size="sm" variant="outline" onClick={() => setIsDeliveryFormOpen(true)} className="text-xs gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Registar Nova Entrega
            </Button>
          )}
        </div>

        {deliveries.length === 0 ? (
          <div className="text-xs text-slate-500 text-center py-6 border border-dashed rounded-lg">
            Nenhuma entrega registada para este pedido de compra ainda.
          </div>
        ) : (
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold">
                <tr>
                  <th className="p-3">Nº Entrega</th>
                  <th className="p-3">Data</th>
                  <th className="p-3">Doc. Fornecedor</th>
                  <th className="p-3">Recebido Por</th>
                  <th className="p-3 text-center">Estado</th>
                  <th className="p-3 text-right w-20">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {deliveries.map((del) => (
                  <tr key={del.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                    <td className="p-3 font-semibold text-blue-600 dark:text-blue-400">
                      <Link to="/app/inventory/deliveries/$deliveryId" params={{ deliveryId: del.id }} className="hover:underline flex items-center gap-1 font-bold">
                        <span>{del.deliveryNumber}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">
                      {formatDate(del.deliveryDate)}
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">
                      {del.deliveryNoteNumber || del.supplierDocumentNumber || "—"}
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">
                      {del.receivedBy || "—"}
                    </td>
                    <td className="p-3 text-center">
                      <DeliveryStatusBadge status={del.status} />
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1 text-primary"
                        asChild
                      >
                        <Link to="/app/inventory/deliveries/$deliveryId" params={{ deliveryId: del.id }}>
                          <span>Abrir</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Cartão de Entidades Relacionadas */}
        {(() => {
          const relatedItems: RelatedEntityItem[] = [];

          if (supplier) {
            relatedItems.push({
              type: "supplier",
              title: supplier.name,
              subtitle: supplier.nuit ? `NUIT: ${supplier.nuit}` : "Fornecedor",
              linkTo: "/app/fornecedores",
            });
          }

          if (project) {
            relatedItems.push({
              type: "project",
              title: project.nome,
              subtitle: `Obra Destino · ${project.tipo}`,
              linkTo: "/app/obras/$id",
              linkParams: { id: project.id },
            });
          }

          deliveries.forEach((d) => {
            relatedItems.push({
              type: "delivery",
              title: d.deliveryNumber,
              subtitle: d.deliveryNoteNumber ? `Guia: ${d.deliveryNoteNumber}` : "Entrega de Carga",
              statusBadge: { label: d.status },
              linkTo: "/app/inventory/deliveries_/$deliveryId",
              linkParams: { deliveryId: d.id },
            });
          });

          return <RelatedEntitiesCard title="Entidades Relacionadas com este Pedido" entities={relatedItems} />;
        })()}
      </div>

      {/* Movimentos de Stock Gerados */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <StockMovementList
          movements={movements}
          title="Movimentos de Stock Gerados por este Pedido"
          emptyMessage="Nenhum movimento de stock gerado ainda. As entradas de stock ocorrem na confirmação das entregas."
        />
      </div>

      {/* Diálogos */}
      {isEditOpen && (
        <PurchaseOrderFormDialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          orderToEdit={po}
        />
      )}

      {isDuplicateOpen && (
        <PurchaseOrderFormDialog
          open={isDuplicateOpen}
          onOpenChange={setIsDuplicateOpen}
          initialDuplicateData={duplicateData}
        />
      )}

      {isDeliveryFormOpen && (
        <DeliveryFormDialog
          open={isDeliveryFormOpen}
          onOpenChange={setIsDeliveryFormOpen}
          purchaseOrder={po}
        />
      )}

      {selectedDelivery && (
        <DeliveryDetailsDialog
          open={!!selectedDelivery}
          onOpenChange={(open) => !open && setSelectedDelivery(undefined)}
          delivery={selectedDelivery}
        />
      )}
    </div>
  );
}
