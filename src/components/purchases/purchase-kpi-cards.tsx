import React, { useMemo, memo } from "react";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatMZN } from "@/lib/format";
import type { PurchaseOrder, StockMovement, Delivery } from "@/lib/purchases";
import {
  ShoppingCart,
  Clock,
  Layers,
  PackageCheck,
  Truck,
  Copy,
  Check,
  MousePointerClick,
} from "lucide-react";
import { toast } from "sonner";

export type KpiFilterType = "all" | "active" | "comprado" | "recebido" | "pendente" | "entregas";

interface PurchaseKPICardsProps {
  purchaseOrders: PurchaseOrder[];
  deliveries: Delivery[];
  stockMovements: StockMovement[];
  activeKpiFilter: KpiFilterType | null;
  onSelectKpiFilter: (filterType: KpiFilterType) => void;
}

export const PurchaseKPICards = memo(function PurchaseKPICards({
  purchaseOrders,
  deliveries,
  stockMovements,
  activeKpiFilter,
  onSelectKpiFilter,
}: PurchaseKPICardsProps) {
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  // 1. Total Pedidos
  const totalOrdersCount = purchaseOrders.length;

  // 2. Pedidos Ativos
  const activeOrdersCount = useMemo(() => {
    return purchaseOrders.filter((po) =>
      ["sent", "partially_received", "approved"].includes(po.status)
    ).length;
  }, [purchaseOrders]);

  // 3. Valor Comprado
  const totalVolumeComprado = useMemo(() => {
    return purchaseOrders.reduce(
      (sum, po) => sum + (po.status !== "cancelled" ? po.totalAmount || 0 : 0),
      0
    );
  }, [purchaseOrders]);

  // 4. Valor Recebido
  const totalValorRecebido = useMemo(() => {
    return stockMovements
      .filter((m) => m.movementType === "purchase_receipt")
      .reduce((sum, m) => sum + (m.totalCost || 0), 0);
  }, [stockMovements]);

  // 5. Valor Pendente (Comprado - Recebido)
  const totalValorPendente = useMemo(() => {
    return Math.max(0, totalVolumeComprado - totalValorRecebido);
  }, [totalVolumeComprado, totalValorRecebido]);

  // 6. Entregas Pendentes
  const pendingDeliveriesCount = useMemo(() => {
    return (
      deliveries.filter((d) => d.status === "draft").length +
      purchaseOrders.filter((po) => ["sent", "partially_received", "approved"].includes(po.status)).length
    );
  }, [deliveries, purchaseOrders]);

  // Cálculo de tendência real (últimos 30 dias vs 30 dias anteriores)
  const monthlyTrend = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const currentPeriodOrders = purchaseOrders.filter(
      (po) => po.orderDate && po.orderDate >= thirtyDaysAgo && po.status !== "cancelled"
    );
    const previousPeriodOrders = purchaseOrders.filter(
      (po) => po.orderDate && po.orderDate >= sixtyDaysAgo && po.orderDate < thirtyDaysAgo && po.status !== "cancelled"
    );

    const currentSum = currentPeriodOrders.reduce((sum, po) => sum + (po.totalAmount || 0), 0);
    const previousSum = previousPeriodOrders.reduce((sum, po) => sum + (po.totalAmount || 0), 0);

    if (previousSum === 0) return null;
    const diffPct = Math.round(((currentSum - previousSum) / previousSum) * 100);

    if (diffPct > 0) return { text: `▲ +${diffPct}%`, isPositive: true };
    if (diffPct < 0) return { text: `▼ ${diffPct}%`, isPositive: false };
    return { text: `→ Estável`, isPositive: true };
  }, [purchaseOrders]);

  const handleCopyValue = (key: string, val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    toast.success("Valor copiado para a área de transferência!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const renderMonetaryValue = (key: string, numValue: number, colorClass: string) => {
    const formatted = formatMZN(numValue);
    const fullValueStr = `${numValue.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN`;

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            onClick={(e) => handleCopyValue(key, fullValueStr, e)}
            className={`text-base sm:text-lg font-bold tracking-tight truncate cursor-pointer select-none group flex items-center justify-between ${colorClass}`}
          >
            <span className="truncate">{formatted}</span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-slate-400">
              {copiedKey === key ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {fullValueStr} (Clique no valor para copiar)
        </TooltipContent>
      </Tooltip>
    );
  };

  const getCardStyle = (type: KpiFilterType) => {
    const isActive = activeKpiFilter === type;
    return `p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm space-y-2 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-blue-400 select-none ${
      isActive ? "ring-2 ring-blue-500 border-blue-500 bg-blue-50/20 dark:bg-blue-950/20" : ""
    }`;
  };

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
        {/* KPI 1: Total Pedidos */}
        <Card
          onClick={() => onSelectKpiFilter("all")}
          role="button"
          tabIndex={0}
          aria-label="Filtrar tabela: Todos os Pedidos"
          className={getCardStyle("all")}
        >
          <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
            <span>Total Pedidos</span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {totalOrdersCount}
          </div>
          <div className="text-[10px] text-slate-500 flex items-center justify-between">
            <span>Pedidos registados</span>
            {monthlyTrend ? (
              <span className={monthlyTrend.isPositive ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold"} title="Últimos 30 dias">
                {monthlyTrend.text}
              </span>
            ) : (
              <MousePointerClick className="w-3 h-3 text-slate-400 opacity-60" />
            )}
          </div>
        </Card>

        {/* KPI 2: Pedidos Ativos */}
        <Card
          onClick={() => onSelectKpiFilter("active")}
          role="button"
          tabIndex={0}
          aria-label="Filtrar tabela: Pedidos Ativos"
          className={getCardStyle("active")}
        >
          <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
            <span>Pedidos Ativos</span>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {activeOrdersCount}
          </div>
          <div className="text-[10px] text-slate-500 flex items-center justify-between">
            <span>Em aprovação / trânsito</span>
            <MousePointerClick className="w-3 h-3 text-amber-500 opacity-60" />
          </div>
        </Card>

        {/* KPI 3: Valor Comprado */}
        <Card
          onClick={() => onSelectKpiFilter("comprado")}
          role="button"
          tabIndex={0}
          aria-label="Ordenar tabela por Valor Comprado"
          className={getCardStyle("comprado")}
        >
          <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
            <span>Valor Comprado</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          {renderMonetaryValue("comprado", totalVolumeComprado, "text-slate-900 dark:text-slate-100")}
          <div className="text-[10px] text-slate-500 flex items-center justify-between">
            <span>Volume contratado</span>
            <MousePointerClick className="w-3 h-3 text-indigo-500 opacity-60" />
          </div>
        </Card>

        {/* KPI 4: Valor Recebido */}
        <Card
          onClick={() => onSelectKpiFilter("recebido")}
          role="button"
          tabIndex={0}
          aria-label="Ordenar tabela por Valor Recebido"
          className={getCardStyle("recebido")}
        >
          <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
            <span>Valor Recebido</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          {renderMonetaryValue("recebido", totalValorRecebido, "text-emerald-600 dark:text-emerald-400")}
          <div className="text-[10px] text-slate-500 flex items-center justify-between">
            <span>Material recebido</span>
            <MousePointerClick className="w-3 h-3 text-emerald-500 opacity-60" />
          </div>
        </Card>

        {/* KPI 5: Valor Pendente */}
        <Card
          onClick={() => onSelectKpiFilter("pendente")}
          role="button"
          tabIndex={0}
          aria-label="Filtrar tabela por Valor Pendente"
          className={`${getCardStyle("pendente")} border-l-4 border-l-amber-500`}
        >
          <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
            <span>Valor Pendente</span>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          {renderMonetaryValue("pendente", totalValorPendente, "text-amber-700 dark:text-amber-300")}
          <div className="text-[10px] text-slate-500 flex items-center justify-between">
            <span>Ainda por receber</span>
            <MousePointerClick className="w-3 h-3 text-amber-600 opacity-60" />
          </div>
        </Card>

        {/* KPI 6: Entregas Pendentes */}
        <Card
          onClick={() => onSelectKpiFilter("entregas")}
          role="button"
          tabIndex={0}
          aria-label="Filtrar tabela por Entregas Pendentes"
          className={getCardStyle("entregas")}
        >
          <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
            <span>Entregas Pendentes</span>
            <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-600">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {pendingDeliveriesCount}
          </div>
          <div className="text-[10px] text-slate-500 flex items-center justify-between">
            <span>Receções agendadas</span>
            <MousePointerClick className="w-3 h-3 text-sky-500 opacity-60" />
          </div>
        </Card>
      </div>
    </TooltipProvider>
  );
});
