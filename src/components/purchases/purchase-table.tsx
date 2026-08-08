import React from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PurchaseOrderStatusBadge } from "@/components/purchases/purchase-order-status-badge";
import { formatMZN, formatDate } from "@/lib/format";
import type { PurchaseOrder, PurchaseOrderItem } from "@/lib/purchases";
import { destinationTypeLabel } from "@/lib/purchases";
import type { Supplier } from "@/lib/suppliers";
import type { Obra } from "@/lib/mock-data";
import {
  ShoppingCart,
  Plus,
  RotateCcw,
  Eye,
  Truck,
  Pencil,
  Copy,
  XCircle,
  MoreHorizontal,
} from "lucide-react";

interface PurchaseTableProps {
  filteredOrders: PurchaseOrder[];
  totalOrdersCount: number;
  purchaseOrderItems: PurchaseOrderItem[];
  suppliers: Supplier[];
  obras: Obra[];
  onNewOrder: () => void;
  onClearFilters: () => void;
  onEditOrder: (po: PurchaseOrder) => void;
  onRegisterDelivery: (po: PurchaseOrder) => void;
  onDuplicateOrder: (poId: string) => void;
  onCancelOrder: (poId: string) => void;
}

export function PurchaseTable({
  filteredOrders,
  totalOrdersCount,
  purchaseOrderItems,
  suppliers,
  obras,
  onNewOrder,
  onClearFilters,
  onEditOrder,
  onRegisterDelivery,
  onDuplicateOrder,
  onCancelOrder,
}: PurchaseTableProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 px-4 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {totalOrdersCount === 0
                ? "Nenhum pedido de compra registado ainda"
                : "Nenhum pedido encontrado com os filtros selecionados"}
            </div>
            <p className="text-xs text-slate-500">
              {totalOrdersCount === 0
                ? "Crie a sua primeira ordem de fornecimento para gerir compras e stock."
                : "Tente redefinir a barra de pesquisa ou os filtros de estado e destino."}
            </p>
          </div>

          {totalOrdersCount === 0 ? (
            <Button size="sm" onClick={onNewOrder} className="gap-2 text-xs">
              <Plus className="w-4 h-4" /> Criar Primeiro Pedido
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={onClearFilters} className="text-xs gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" /> Limpar Filtros
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5">Nº Pedido</th>
                <th className="p-3.5">Fornecedor</th>
                <th className="p-3.5">Destino</th>
                <th className="p-3.5">Data / Prazo</th>
                <th className="p-3.5 text-center w-36">Progresso Recebido</th>
                <th className="p-3.5 text-center">Estado</th>
                <th className="p-3.5 text-right">Valor Total</th>
                <th className="p-3.5 text-right w-16">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredOrders.map((po) => {
                const supp = suppliers.find((s) => s.id === po.supplierId);
                const proj = po.destinationProjectId ? obras.find((o) => o.id === po.destinationProjectId) : null;
                const itemsList = purchaseOrderItems.filter((i) => i.purchaseOrderId === po.id);

                const totalOrderedQty = itemsList.reduce((sum, i) => sum + (i.orderedPurchaseQuantity || 0), 0);
                const totalReceivedQty = itemsList.reduce((sum, i) => sum + (i.receivedPurchaseQuantity || 0), 0);
                const progressPct =
                  totalOrderedQty > 0 ? Math.min(100, Math.round((totalReceivedQty / totalOrderedQty) * 100)) : 0;

                const canEdit = po.status === "draft";
                const canAddDel = ["approved", "sent", "partially_received"].includes(po.status);
                const canCancel = !["received", "cancelled"].includes(po.status);

                return (
                  <tr
                    key={po.id}
                    onClick={() => navigate({ to: "/app/compras/$purchaseOrderId", params: { purchaseOrderId: po.id } })}
                    className="hover:bg-blue-50/50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
                  >
                    <td className="p-3.5 font-bold">
                      <span className="text-blue-600 dark:text-blue-400 group-hover:underline flex items-center gap-1.5">
                        {po.orderNumber}
                      </span>
                      {po.supplierReference && (
                        <span className="block text-[10px] text-slate-400 font-normal">
                          Ref: {po.supplierReference}
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 font-medium text-slate-900 dark:text-slate-100">
                      {supp?.name || "Fornecedor Removido"}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {itemsList.length} {itemsList.length === 1 ? "item" : "itens"}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {destinationTypeLabel[po.destinationType] || po.destinationType}
                      </span>
                      {proj && (
                        <span className="block text-[10px] text-slate-400 font-normal truncate max-w-[140px]">
                          {proj.nome}
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 text-slate-600 dark:text-slate-400">
                      <div>{formatDate(po.orderDate)}</div>
                      {po.expectedDeliveryDate && (
                        <span className="text-[10px] text-slate-400 block">
                          Previsto: {formatDate(po.expectedDeliveryDate)}
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 text-center">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                          <span>{progressPct}%</span>
                          <span>{totalReceivedQty}/{totalOrderedQty}</span>
                        </div>
                        <Progress value={progressPct} className="h-1.5" />
                      </div>
                    </td>

                    <td className="p-3.5 text-center">
                      <PurchaseOrderStatusBadge status={po.status} />
                    </td>

                    <td className="p-3.5 text-right font-bold text-slate-900 dark:text-slate-100">
                      {formatMZN(po.totalAmount)}
                    </td>

                    <td className="p-3.5 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <MoreHorizontal className="w-4 h-4 text-slate-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-xs">
                          <DropdownMenuItem asChild>
                            <Link to="/app/compras/$purchaseOrderId" params={{ purchaseOrderId: po.id }}>
                              <Eye className="w-3.5 h-3.5 mr-2 text-blue-600" /> Ver Detalhes
                            </Link>
                          </DropdownMenuItem>

                          {canAddDel && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onRegisterDelivery(po);
                              }}
                            >
                              <Truck className="w-3.5 h-3.5 mr-2 text-emerald-600" /> Registar Entrega
                            </DropdownMenuItem>
                          )}

                          {canEdit && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditOrder(po);
                              }}
                            >
                              <Pencil className="w-3.5 h-3.5 mr-2 text-amber-600" /> Editar Pedido
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onDuplicateOrder(po.id);
                            }}
                          >
                            <Copy className="w-3.5 h-3.5 mr-2 text-indigo-600" /> Duplicar
                          </DropdownMenuItem>

                          {canCancel && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onCancelOrder(po.id);
                                }}
                                className="text-rose-600"
                              >
                                <XCircle className="w-3.5 h-3.5 mr-2" /> Cancelar Pedido
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
