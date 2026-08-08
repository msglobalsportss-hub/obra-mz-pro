import React from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PurchaseOrderStatusBadge } from "@/components/purchases/purchase-order-status-badge";
import { formatMZN, formatDate } from "@/lib/format";
import type { PurchaseOrder } from "@/lib/purchases";
import type { Supplier } from "@/lib/suppliers";
import type { Obra } from "@/lib/mock-data";
import { AlertTriangle, ShieldCheck, HardHat, ExternalLink } from "lucide-react";

interface DelayedDeliveriesCardProps {
  overdueOrders: PurchaseOrder[];
  suppliers: Supplier[];
  obras: Obra[];
}

export function DelayedDeliveriesCard({
  overdueOrders,
  suppliers,
  obras,
}: DelayedDeliveriesCardProps) {
  const navigate = useNavigate();
  const overdueCount = overdueOrders.length;

  return (
    <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <div className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <AlertTriangle className={`w-4 h-4 ${overdueCount > 0 ? "text-rose-500" : "text-emerald-500"}`} />
          <span>Entregas Atrasadas ({overdueCount})</span>
        </div>
        <span className="text-[11px] text-slate-400">Impacto em obra & prazos</span>
      </div>

      {overdueOrders.length === 0 ? (
        <div className="text-center py-6 px-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg border border-emerald-100 dark:border-emerald-900/40 space-y-1">
          <ShieldCheck className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
          <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            Nenhuma entrega atrasada!
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
            Todas as encomendas em curso estão dentro dos prazos previstos.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {overdueOrders.map((po) => {
            const supp = suppliers.find((s) => s.id === po.supplierId);
            const proj = po.destinationProjectId ? obras.find((o) => o.id === po.destinationProjectId) : null;
            const expectedDate = new Date(po.expectedDeliveryDate!);
            const diffTime = Math.abs(new Date().getTime() - expectedDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return (
              <div
                key={po.id}
                onClick={() => navigate({ to: "/app/compras/$purchaseOrderId", params: { purchaseOrderId: po.id } })}
                className="p-3 border border-rose-100 dark:border-rose-950 bg-rose-50/40 dark:bg-rose-950/20 rounded-lg flex items-center justify-between gap-3 hover:border-rose-300 hover:shadow-sm cursor-pointer transition-all group"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-rose-700 dark:text-rose-400 group-hover:underline">
                      {po.orderNumber}
                    </span>
                    <PurchaseOrderStatusBadge status={po.status} />
                  </div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {supp?.name || "Fornecedor"}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                      <HardHat className="w-3 h-3 text-amber-500 shrink-0" />
                      {po.destinationType === "central_stock" ? "Stock Central" : proj?.nome || "Obra"}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {formatMZN(po.totalAmount)}
                    </span>
                  </div>

                  <div className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">
                    Atrasado há {diffDays} {diffDays === 1 ? "dia" : "dias"} (Previsto: {formatDate(po.expectedDeliveryDate)})
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  asChild
                  onClick={(e) => e.stopPropagation()}
                  className="h-8 text-xs shrink-0 bg-white dark:bg-slate-900 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/50"
                >
                  <Link to="/app/compras/$purchaseOrderId" params={{ purchaseOrderId: po.id }}>
                    <ExternalLink className="w-3.5 h-3.5 mr-1" /> Abrir
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
