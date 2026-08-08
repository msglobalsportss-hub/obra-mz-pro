import React, { memo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, RotateCcw, Filter } from "lucide-react";
import type { KpiFilterType } from "@/components/purchases/purchase-kpi-cards";

interface PurchaseFiltersProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusChange: (val: string) => void;
  destinationFilter: string;
  onDestinationChange: (val: string) => void;
  activeKpiFilter: KpiFilterType | null;
  onClearKpiFilter: () => void;
  onClearFilters: () => void;
  isFiltered: boolean;
}

const kpiLabels: Record<KpiFilterType, string> = {
  all: "Todos os Pedidos",
  active: "Pedidos Ativos",
  comprado: "Ordenado por Valor Comprado",
  recebido: "Ordenado por Valor Recebido",
  pendente: "Valor Pendente",
  entregas: "Entregas Pendentes",
};

export const PurchaseFilters = memo(function PurchaseFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  destinationFilter,
  onDestinationChange,
  activeKpiFilter,
  onClearKpiFilter,
  onClearFilters,
  isFiltered,
}: PurchaseFiltersProps) {
  return (
    <div
      id="tabela-pedidos"
      className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
    >
      {activeKpiFilter && activeKpiFilter !== "all" && (
        <div className="flex items-center justify-between bg-blue-50/80 dark:bg-blue-950/40 p-2.5 rounded-lg border border-blue-200 dark:border-blue-800 text-xs">
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-medium">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Filtro Contextual de KPI:</span>
            <Badge variant="outline" className="bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 border-blue-300 font-bold">
              {kpiLabels[activeKpiFilter]}
            </Badge>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={onClearKpiFilter}
            className="h-6 text-[11px] px-2 text-blue-700 hover:text-blue-900 hover:bg-blue-100 dark:hover:bg-blue-900"
          >
            Remover Filtro de KPI
          </Button>
        </div>
      )}

      <div className="md:flex md:items-center justify-between gap-4 space-y-3 md:space-y-0">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Pesquisar por número do pedido, fornecedor, referência ou obra..."
            className="pl-9 text-xs"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="text-xs w-[170px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">Todos os Estados</SelectItem>
              <SelectItem value="draft" className="text-xs">Rascunho</SelectItem>
              <SelectItem value="approved" className="text-xs">Aprovado</SelectItem>
              <SelectItem value="sent" className="text-xs">Enviado</SelectItem>
              <SelectItem value="partially_received" className="text-xs">Parcialmente Recebido</SelectItem>
              <SelectItem value="received" className="text-xs">Recebido 100%</SelectItem>
              <SelectItem value="cancelled" className="text-xs">Cancelado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={destinationFilter} onValueChange={onDestinationChange}>
            <SelectTrigger className="text-xs w-[170px]">
              <SelectValue placeholder="Destino" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">Todos os Destinos</SelectItem>
              <SelectItem value="central_stock" className="text-xs">Stock Central</SelectItem>
              <SelectItem value="project" className="text-xs">Obra Específica</SelectItem>
              <SelectItem value="supplier_direct" className="text-xs">Entrega Direta na Obra</SelectItem>
            </SelectContent>
          </Select>

          {(isFiltered || activeKpiFilter !== null) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onClearFilters}
              className="h-9 text-xs gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Limpar Filtros
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});
