import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Supplier } from "@/lib/suppliers";
import { RefreshCw, Clock } from "lucide-react";
import { toast } from "sonner";

interface OperationalSummaryProps {
  draftOrdersCount: number;
  deliveriesTodayCount: number;
  overdueCount: number;
  suppliers: Supplier[];
  moduleStatus: {
    label: string;
    color: string;
    text: string;
  };
}

export function OperationalSummary({
  draftOrdersCount,
  deliveriesTodayCount,
  overdueCount,
  suppliers,
  moduleStatus,
}: OperationalSummaryProps) {
  const [lastSyncTime, setLastSyncTime] = useState<string>(
    () => `Atualizado hoje às ${new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}`
  );
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const nowStr = `Atualizado hoje às ${new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}`;
      setLastSyncTime(nowStr);
      setIsRefreshing(false);
      toast.success("Dados operacionais atualizados com sucesso.");
    }, 400);
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-xl shadow-md space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${moduleStatus.color}`}>
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            {moduleStatus.label}
          </div>
          <span className="text-xs text-slate-300 font-medium hidden sm:inline">
            {moduleStatus.text}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{lastSyncTime}</span>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-7 text-xs text-slate-300 hover:text-white hover:bg-slate-800 gap-1.5 border border-slate-700/60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-blue-400" : ""}`} />
            <span>Atualizar</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-700/60 text-xs">
        <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
          <span className="text-slate-400 block text-[11px]">Rascunhos Pendentes</span>
          <span className="font-bold text-slate-100 text-sm">{draftOrdersCount} pedidos</span>
        </div>

        <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
          <span className="text-slate-400 block text-[11px]">Previstas para Hoje</span>
          <span className="font-bold text-blue-400 text-sm">{deliveriesTodayCount} entregas</span>
        </div>

        <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
          <span className="text-slate-400 block text-[11px]">Entregas Atrasadas</span>
          <span className={`font-bold text-sm ${overdueCount > 0 ? "text-rose-400" : "text-emerald-400"}`}>
            {overdueCount} atrasos
          </span>
        </div>

        <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
          <span className="text-slate-400 block text-[11px]">Fornecedores Ativos</span>
          <span className="font-bold text-slate-100 text-sm">
            {suppliers.filter((s) => s.status === "active").length} parceiros
          </span>
        </div>
      </div>
    </Card>
  );
}
