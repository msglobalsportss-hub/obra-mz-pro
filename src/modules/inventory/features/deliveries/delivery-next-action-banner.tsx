import React from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight, CheckCircle2, ClipboardCheck, Paperclip, Check } from "lucide-react";
import type { DeliveryStatus } from "@/lib/purchases";

interface DeliveryNextActionBannerProps {
  status: DeliveryStatus;
  hasPendingItems: boolean;
  hasDocuments: boolean;
  onActionClick: () => void;
}

export function DeliveryNextActionBanner({
  status,
  hasPendingItems,
  hasDocuments,
  onActionClick,
}: DeliveryNextActionBannerProps) {
  if (status === "confirmed") {
    return (
      <div className="flex items-center justify-between p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-800 dark:text-emerald-300">
        <div className="flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span><strong>Entrega concluída.</strong> Nenhuma ação pendente nesta ficha.</span>
        </div>
      </div>
    );
  }

  if (status === "cancelled" || status === "rejected") {
    return (
      <div className="flex items-center justify-between p-3.5 bg-slate-500/10 border border-slate-500/20 rounded-xl text-xs text-slate-700 dark:text-slate-300">
        <div className="flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
          <span>Entrega encerrada. Sem ações operacionais disponíveis.</span>
        </div>
      </div>
    );
  }

  let text = "";
  let buttonLabel = "";
  let icon = ClipboardCheck;

  if (status === "expected" || status === "draft" || status === "arrived") {
    text = "Carga no local de destino. Iniciar conferência dos materiais.";
    buttonLabel = "Iniciar Conferência";
    icon = ClipboardCheck;
  } else if (hasPendingItems) {
    text = "Existem materiais pendentes por conferir.";
    buttonLabel = "Continuar Conferência";
    icon = ClipboardCheck;
  } else if (!hasDocuments) {
    text = "Conferência concluída. É recomendado anexar a Guia de Remessa ou comprovativo.";
    buttonLabel = "Anexar Guia";
    icon = Paperclip;
  } else {
    text = "Materiais e documentos validados. Prontos para fechar e atualizar stock.";
    buttonLabel = "Confirmar Receção";
    icon = Check;
  }

  const IconComp = icon;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-primary/10 border border-primary/20 rounded-xl text-xs">
      <div className="flex items-center gap-2 text-foreground font-medium">
        <div className="p-1.5 rounded-lg bg-primary/20 text-primary shrink-0">
          <IconComp className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-primary block">Próxima Ação Recomendada</span>
          <span className="text-xs font-semibold text-foreground">{text}</span>
        </div>
      </div>
      <Button
        size="sm"
        onClick={onActionClick}
        className="gap-1.5 h-8 text-xs shrink-0 font-bold bg-primary text-primary-foreground hover:bg-primary/90"
      >
        <span>{buttonLabel}</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
