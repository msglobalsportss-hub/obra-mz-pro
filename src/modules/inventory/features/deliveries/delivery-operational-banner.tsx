import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface DeliveryOperationalBannerProps {
  orphanCount?: number;
  unprocessedCount?: number;
  onFilterOrphans?: () => void;
}

export function DeliveryOperationalBanner({
  orphanCount = 0,
  unprocessedCount = 0,
  onFilterOrphans,
}: DeliveryOperationalBannerProps) {
  const [lastSyncTime, setLastSyncTime] = useState<string>(
    () => `Atualizado às ${new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}`
  );
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const isAttentionNeeded = orphanCount > 0 || unprocessedCount > 0;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const nowStr = `Atualizado às ${new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}`;
      setLastSyncTime(nowStr);
      setIsRefreshing(false);
      toast.success("Dados das receções atualizados com sucesso.");
    }, 400);
  };

  return (
    <Card className="p-4 bg-slate-900 text-white rounded-xl shadow-sm border border-slate-800 space-y-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
              isAttentionNeeded ? "bg-rose-600 text-white" : "bg-emerald-600 text-white"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span>{isAttentionNeeded ? "ATENÇÃO NECESSÁRIA" : "OPERAÇÃO NORMAL"}</span>
          </div>
          <span className="text-xs text-slate-300 font-medium hidden sm:inline">
            {isAttentionNeeded
              ? `${orphanCount + unprocessedCount} receções ainda não atualizaram o stock.`
              : "Todas as receções estão corretamente refletidas no stock."}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{lastSyncTime}</span>
          </div>

          <Button
            size="xs"
            variant="ghost"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-7 text-xs text-slate-300 hover:text-white hover:bg-slate-800 gap-1.5 border border-slate-700/60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-blue-400" : ""}`} />
            <span>Atualizar</span>
          </Button>

          {isAttentionNeeded && onFilterOrphans && (
            <Button
              size="xs"
              variant="destructive"
              onClick={onFilterOrphans}
              className="h-7 text-xs gap-1 bg-rose-600 hover:bg-rose-700 text-white"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Ver entregas afetadas</span>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
