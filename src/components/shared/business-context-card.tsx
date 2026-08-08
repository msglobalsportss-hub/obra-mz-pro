import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Compass, Sparkles, CheckCircle2, Clock, AlertTriangle, ArrowRight } from "lucide-react";
import type { DeliveryStatus, Delivery } from "@/lib/purchases";

interface BusinessContextCardProps {
  type: "delivery" | "purchase_order" | "project" | "material" | "supplier";
  entityId: string;
  delivery?: Delivery;
  purchaseOrderNumber?: string;
  supplierName?: string;
  destinationName?: string;
  totalItemsCount?: number;
  conferencedItemsCount?: number;
  movementsCount?: number;
}

export function BusinessContextCard({
  type,
  entityId,
  delivery,
  purchaseOrderNumber,
  supplierName,
  destinationName,
  totalItemsCount = 0,
  conferencedItemsCount = 0,
  movementsCount = 0,
}: BusinessContextCardProps) {
  if (type === "delivery" && delivery) {
    const status = delivery.status;
    let narrative = "";
    let statusBadgeText = "";
    let statusBadgeColor = "";
    let nextStepText = "";

    if (status === "expected" || status === "draft") {
      narrative = `Esta entrega foi criada a partir do Pedido de Compra ${purchaseOrderNumber || delivery.purchaseOrderId}. O fornecedor ${supplierName || "associado"} ainda não efetuou a entrega física no destino previsto (${destinationName || "local de entrega"}).`;
      statusBadgeText = "Aguardando Chegada";
      statusBadgeColor = "bg-blue-500/10 text-blue-600 border-blue-500/20";
      nextStepText = "Iniciar conferência dos materiais quando o veículo chegar.";
    } else if (status === "in_inspection" || status === "arrived") {
      const remaining = totalItemsCount - conferencedItemsCount;
      narrative = `A carga já chegou ao destino (${destinationName || "Obra/Armazém"}). A conferência operacional encontra-se em progresso. Foram conferidos ${conferencedItemsCount} de ${totalItemsCount} materiais (${remaining > 0 ? `faltam ${remaining}` : "todos validados"}).`;
      statusBadgeText = "Conferência em Curso";
      statusBadgeColor = "bg-amber-500/10 text-amber-600 border-amber-500/20";
      nextStepText = remaining > 0 ? "Continuar a conferência dos materiais restantes." : "Anexar comprovativo e confirmar receção.";
    } else if (status === "partially_received") {
      narrative = `Esta entrega sofreu receção parcial. Foram processados lotes parciais e gerados ${movementsCount} movimento(s) de stock. O remanescente dos materiais aguarda nova guia do fornecedor.`;
      statusBadgeText = "Receção Parcial";
      statusBadgeColor = "bg-purple-500/10 text-purple-600 border-purple-500/20";
      nextStepText = "Registar próximo lote de receção ou fechar entrega com divergência.";
    } else if (status === "confirmed" || status === "received") {
      narrative = `Esta entrega foi totalmente conferida e recebida no destino (${destinationName || "Obra/Armazém"}). O stock e os saldos foram atualizados e os materiais já estão disponíveis para consumo operacional.`;
      statusBadgeText = "Operação Concluída";
      statusBadgeColor = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      nextStepText = "Sem ações pendentes. Materiais integrados no inventário ativo.";
    } else {
      narrative = `Registo de entrega em estado ${status}. Sem movimentações adicionais em curso.`;
      statusBadgeText = "Encerrada";
      statusBadgeColor = "bg-slate-500/10 text-slate-600 border-slate-500/20";
      nextStepText = "Sem ações requeridas.";
    }

    return (
      <Card className="border-border/60 bg-card shadow-sm">
        <CardHeader className="py-3 px-4 bg-muted/20 border-b border-border/60">
          <CardTitle className="text-xs font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-primary" />
              <span>Contexto Operacional do Negócio</span>
            </div>
            <Badge variant="outline" className={`text-[10px] ${statusBadgeColor}`}>
              {statusBadgeText}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <p className="text-xs text-foreground leading-relaxed font-normal">
            {narrative}
          </p>

          <div className="pt-2.5 border-t border-border/50 flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="font-semibold text-foreground">Recomendação:</span>
            <span className="text-[11px] truncate">{nextStepText}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Fallback genérico para outros tipos de entidade
  return (
    <Card className="border-border/60 bg-card shadow-sm">
      <CardHeader className="py-3 px-4 bg-muted/20 border-b border-border/60">
        <CardTitle className="text-xs font-bold flex items-center gap-2">
          <Compass className="w-4 h-4 text-primary" />
          <span>Contexto do Negócio</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">
          Entidade {type} ({entityId}) integrada no ecossistema ObraMZ.
        </p>
      </CardContent>
    </Card>
  );
}
