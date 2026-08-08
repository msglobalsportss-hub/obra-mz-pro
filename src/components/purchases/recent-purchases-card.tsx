import React from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PurchaseOrderStatusBadge } from "@/components/purchases/purchase-order-status-badge";
import { formatMZN, formatDate } from "@/lib/format";
import type { PurchaseOrder, PurchaseOrderItem } from "@/lib/purchases";
import type { Supplier } from "@/lib/suppliers";
import { Clock, ExternalLink } from "lucide-react";

interface RecentPurchasesCardProps {
  recentOrders: PurchaseOrder[];
  purchaseOrderItems: PurchaseOrderItem[];
  suppliers: Supplier[];
}

export function RecentPurchasesCard({
  recentOrders,
  purchaseOrderItems,
  suppliers,
}: RecentPurchasesCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <div className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <span>Compras Recentes</span>
        </div>
        <span className="text-[11px] text-slate-400">Últimos 5 pedidos</span>
      </div>

      <div className="space-y-2.5">
        {recentOrders.map((po) => {
          const supp = suppliers.find((s) => s.id === po.supplierId);
          const itemsList = purchaseOrderItems.filter((i) => i.purchaseOrderId === po.id);
          const totalOrderedQty = itemsList.reduce((sum, i) => sum + (i.orderedPurchaseQuantity || 0), 0);
          const totalReceivedQty = itemsList.reduce((sum, i) => sum + (i.receivedPurchaseQuantity || 0), 0);
          const progressPct = totalOrderedQty > 0 ? Math.min(100, Math.round((totalReceivedQty / totalOrderedQty) * 100)) : 0;

          return (
            <div
              key={po.id}
              onClick={() => navigate({ to: "/app/compras/$purchaseOrderId", params: { purchaseOrderId: po.id } })}
              className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:shadow-sm cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-blue-600 dark:text-blue-400 group-hover:underline">
                      {po.orderNumber}
                    </span>
                    <PurchaseOrderStatusBadge status={po.status} />
                  </div>
                  <div className="text-xs text-slate-700 dark:text-slate-300 truncate font-medium">
                    {supp?.name || "Fornecedor"}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-right">
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      {formatMZN(po.totalAmount)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {formatDate(po.orderDate)}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    asChild
                    onClick={(e) => e.stopPropagation()}
                    className="h-7 w-7 p-0 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                  >
                    <Link to="/app/compras/$purchaseOrderId" params={{ purchaseOrderId: po.id }}>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Barra de Progresso Enriquecida */}
              <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                  <span>Recebido: {progressPct}%</span>
                  <span>{totalReceivedQty} de {totalOrderedQty} un.</span>
                </div>
                <Progress value={progressPct} className="h-1.5" />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
