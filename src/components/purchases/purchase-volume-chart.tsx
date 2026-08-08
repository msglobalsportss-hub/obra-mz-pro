import React, { useState, useMemo, memo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatMZN } from "@/lib/format";
import type { PurchaseOrder } from "@/lib/purchases";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from "recharts";
import { TrendingUp, BarChart2, Plus } from "lucide-react";

interface PurchaseVolumeChartProps {
  purchaseOrders: PurchaseOrder[];
  onNewOrder?: () => void;
}

export const PurchaseVolumeChart = memo(function PurchaseVolumeChart({
  purchaseOrders,
  onNewOrder,
}: PurchaseVolumeChartProps) {
  const [period, setPeriod] = useState<"mensal" | "trimestral" | "anual">("mensal");

  const validOrders = useMemo(
    () => purchaseOrders.filter((po) => po.orderDate && po.status !== "cancelled"),
    [purchaseOrders]
  );

  // Agrupamento dinâmico e inteligente com base no período selecionado e dados reais
  const chartData = useMemo(() => {
    if (validOrders.length === 0) return [];

    if (period === "mensal") {
      const groups = new Map<string, { label: string; valor: number; volume: number; key: string }>();

      validOrders.forEach((po) => {
        const d = new Date(po.orderDate);
        if (isNaN(d.getTime())) return;
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const key = `${year}-${month}`;
        const monthLabel = d.toLocaleDateString("pt-PT", { month: "short" });
        const label = `${monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)} ${year}`;

        const curr = groups.get(key) || { label, valor: 0, volume: 0, key };
        curr.valor += po.totalAmount || 0;
        curr.volume += 1;
        groups.set(key, curr);
      });

      return Array.from(groups.values()).sort((a, b) => a.key.localeCompare(b.key));
    }

    if (period === "trimestral") {
      const groups = new Map<string, { label: string; valor: number; volume: number; key: string }>();

      validOrders.forEach((po) => {
        const d = new Date(po.orderDate);
        if (isNaN(d.getTime())) return;
        const year = d.getFullYear();
        const quarter = Math.floor(d.getMonth() / 3) + 1;
        const key = `${year}-Q${quarter}`;
        const label = `T${quarter} ${year}`;

        const curr = groups.get(key) || { label, valor: 0, volume: 0, key };
        curr.valor += po.totalAmount || 0;
        curr.volume += 1;
        groups.set(key, curr);
      });

      return Array.from(groups.values()).sort((a, b) => a.key.localeCompare(b.key));
    }

    // Period === "anual"
    const groups = new Map<string, { label: string; valor: number; volume: number; key: string }>();

    validOrders.forEach((po) => {
      const d = new Date(po.orderDate);
      if (isNaN(d.getTime())) return;
      const year = d.getFullYear().toString();
      const label = year;

      const curr = groups.get(year) || { label, valor: 0, volume: 0, key: year };
      curr.valor += po.totalAmount || 0;
      curr.volume += 1;
      groups.set(year, curr);
    });

    return Array.from(groups.values()).sort((a, b) => a.key.localeCompare(b.key));
  }, [validOrders, period]);

  return (
    <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Evolução do Volume de Compras (MZN)
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Volume financeiro contratado ao longo do tempo (Eixo X dinâmico com dados reais)
          </p>
        </div>

        {/* Seletor de Período do Gráfico — Todos Funcionais com Dados Reais */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <Button
            size="sm"
            variant={period === "mensal" ? "default" : "ghost"}
            onClick={() => setPeriod("mensal")}
            className="h-7 text-xs px-3"
          >
            Mensal
          </Button>

          <Button
            size="sm"
            variant={period === "trimestral" ? "default" : "ghost"}
            onClick={() => setPeriod("trimestral")}
            className="h-7 text-xs px-3"
          >
            Trimestral
          </Button>

          <Button
            size="sm"
            variant={period === "anual" ? "default" : "ghost"}
            onClick={() => setPeriod("anual")}
            className="h-7 text-xs px-3"
          >
            Anual
          </Button>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="text-center py-10 px-4 bg-slate-50/50 dark:bg-slate-800/40 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
          <BarChart2 className="w-8 h-8 text-slate-400 mx-auto" />
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Ainda não existem compras suficientes para gerar estatísticas.
          </div>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
            Registe o seu primeiro pedido de compra para visualizar a evolução financeira em tempo real.
          </p>
          {onNewOrder && (
            <Button size="sm" onClick={onNewOrder} className="gap-1.5 text-xs mt-2">
              <Plus className="w-3.5 h-3.5" /> Criar Primeiro Pedido
            </Button>
          )}
        </div>
      ) : (
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k MZN`}
              />
              <RechartsTooltip
                isAnimationActive={true}
                formatter={(val: any, name: any, item: any) => [
                  formatMZN(Number(val)),
                  `Volume (${item.payload.volume} ${item.payload.volume === 1 ? "pedido" : "pedidos"})`,
                ]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              />
              <Bar
                dataKey="valor"
                radius={[4, 4, 0, 0]}
                fill="#2563eb"
                className="hover:opacity-85 transition-opacity"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
});
