import React, { memo } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sparkles,
  Plus,
  Truck,
  Building2,
  ListFilter,
  FileText,
  ChevronDown,
  FileSpreadsheet,
  FileCode2,
} from "lucide-react";

interface QuickActionsProps {
  onNewOrder: () => void;
  onQuickDelivery: () => void;
  onScrollToTable: () => void;
}

export const QuickActions = memo(function QuickActions({
  onNewOrder,
  onQuickDelivery,
  onScrollToTable,
}: QuickActionsProps) {
  return (
    <TooltipProvider>
      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Ações Rápidas:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onNewOrder}
            className="h-8 text-xs gap-1.5 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            Novo Pedido
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onQuickDelivery}
            className="h-8 text-xs gap-1.5 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Truck className="w-3.5 h-3.5 text-emerald-600" />
            Registar Entrega
          </Button>

          <Button
            size="sm"
            variant="outline"
            asChild
            className="h-8 text-xs gap-1.5 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Link to="/app/fornecedores">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              Ver Fornecedores
            </Link>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onScrollToTable}
            className="h-8 text-xs gap-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ListFilter className="w-3.5 h-3.5 text-slate-500" />
            Ver Todos os Pedidos
          </Button>

          {/* Menu de Exportação (Arquitetura Pronta conforme Secção 9) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                Exportar
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-xs w-48">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <DropdownMenuItem disabled className="gap-2 opacity-60 cursor-not-allowed">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      Exportar para Excel (.xlsx)
                      <span className="text-[9px] bg-slate-100 dark:bg-slate-800 px-1 py-0.2 rounded ml-auto text-slate-400">Etapa 6.6</span>
                    </DropdownMenuItem>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left">Exportação Excel disponível na Etapa 6.6</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <DropdownMenuItem disabled className="gap-2 opacity-60 cursor-not-allowed">
                      <FileCode2 className="w-3.5 h-3.5 text-blue-600" />
                      Exportar para CSV (.csv)
                      <span className="text-[9px] bg-slate-100 dark:bg-slate-800 px-1 py-0.2 rounded ml-auto text-slate-400">Etapa 6.6</span>
                    </DropdownMenuItem>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left">Exportação CSV disponível na Etapa 6.6</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <DropdownMenuItem disabled className="gap-2 opacity-60 cursor-not-allowed">
                      <FileText className="w-3.5 h-3.5 text-rose-600" />
                      Exportar para PDF (.pdf)
                      <span className="text-[9px] bg-slate-100 dark:bg-slate-800 px-1 py-0.2 rounded ml-auto text-slate-400">Etapa 6.6</span>
                    </DropdownMenuItem>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left">Relatórios PDF disponíveis na Etapa 6.6</TooltipContent>
              </Tooltip>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </TooltipProvider>
  );
});
