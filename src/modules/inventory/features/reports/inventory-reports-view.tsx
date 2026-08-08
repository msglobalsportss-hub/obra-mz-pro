/**
 * Relatórios de Inventário: InventoryReportsView
 * Categoria: features/reports
 *
 * Gráficos e análises visuais de valor por localização, evolução de WAC e tipos de movimento (Seção 19).
 */

import React, { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { PageContainer } from "@/components/shared/page-container";
import { InventoryPermissionState } from "../../components/inventory-permission-state";
import { useInventoryPermissions } from "../../hooks/use-inventory-permissions";
import { inventoryStoreManager } from "../../store/inventory-store";
import { formatMZN } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const CHART_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#64748b"];

export function InventoryReportsView() {
  const permissions = useInventoryPermissions();
  const [storeState, setStoreState] = useState(inventoryStoreManager.getState());

  useEffect(() => {
    const unsubscribe = inventoryStoreManager.subscribe((s) => setStoreState(s));
    return () => unsubscribe();
  }, []);

  const balances = Object.values(storeState.balances);
  const movements = storeState.movements;

  // 1. Dados de Valor por Localização
  const valueByLocationData = useMemo(() => {
    const map: Record<string, number> = {};
    balances.forEach((b) => {
      map[b.locationId] = (map[b.locationId] || 0) + b.totalValue;
    });
    return Object.entries(map).map(([location, totalValue]) => ({ location, totalValue }));
  }, [balances]);

  // 2. Dados de Movimentos por Tipo
  const movementsByTypeData = useMemo(() => {
    const map: Record<string, number> = {};
    movements.forEach((m) => {
      map[m.movementType] = (map[m.movementType] || 0) + 1;
    });
    return Object.entries(map).map(([type, count]) => ({ type, count }));
  }, [movements]);

  if (!permissions.canViewReports) {
    return <InventoryPermissionState />;
  }

  return (
    <PageContainer>
      <PageHeader
        title="Relatórios & Análise de Inventário"
        description="Análise gráfica de distribuição de valor, volume de stock e tendência de custos médios"
        breadcrumbs={[
          { label: "Início", href: "/app" },
          { label: "Inventário", href: "/app/inventory" },
          { label: "Relatórios" },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Gráfico 1: Valor por Localização */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Valor do Inventário por Localização (MZN)
            </CardTitle>
            <CardDescription className="text-xs">
              Distribuição financeira total acumulada em cada armazém/obra
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pt-2">
            {valueByLocationData.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center pt-24">
                Sem dados de saldo disponíveis.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={valueByLocationData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="location" textAnchor="end" height={50} tick={{ fontSize: 11 }} />
                  <YAxis
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip formatter={(value: number) => [formatMZN(value), "Valor Total"]} />
                  <Bar dataKey="totalValue" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Gráfico 2: Movimentos por Tipo */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Distribuição de Transações por Tipo
            </CardTitle>
            <CardDescription className="text-xs">
              Frequência de entradas, saídas, transferências e ajustes
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pt-2">
            {movementsByTypeData.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center pt-24">
                Sem movimentos registados.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={movementsByTypeData}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {movementsByTypeData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
