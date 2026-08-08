import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatDate } from "@/lib/format";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Truck,
  FileText,
  PackageCheck,
  User,
  MapPin,
  Search,
  Layers,
  BarChart2,
  HardHat,
  Building2,
  Paperclip,
} from "lucide-react";
import type { Delivery, PurchaseOrder } from "@/lib/purchases";

interface DeliveryTimelineProps {
  delivery: Delivery;
  purchaseOrder?: PurchaseOrder;
  /** Número de itens já conferidos (para o evento activo) */
  conferencedItems?: number;
  /** Total de itens a conferir */
  totalItems?: number;
  /** Callback para retomar conferência a partir da timeline */
  onResumeConference?: () => void;
}

type EventStatus = "done" | "active" | "pending";

interface TimelineEvent {
  key: string;
  title: string;
  date?: string;
  user?: string;
  description: string;
  icon: React.ElementType;
  status: EventStatus;
  /** Conteúdo extra a mostrar quando o evento está activo */
  activeContent?: React.ReactNode;
}

function getDot(status: EventStatus) {
  if (status === "done") {
    return (
      <div className="absolute -left-[23px] top-1 w-5 h-5 rounded-full flex items-center justify-center bg-emerald-600 text-white shrink-0 z-10">
        <CheckCircle2 className="w-3 h-3" />
      </div>
    );
  }
  if (status === "active") {
    return (
      <div className="absolute -left-[23px] top-1 w-5 h-5 rounded-full flex items-center justify-center bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/30 shrink-0 z-10 animate-pulse">
        <div className="w-2 h-2 rounded-full bg-white" />
      </div>
    );
  }
  return (
    <div className="absolute -left-[23px] top-1 w-5 h-5 rounded-full flex items-center justify-center bg-muted border border-border text-muted-foreground shrink-0 z-10">
      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
    </div>
  );
}

export function DeliveryTimeline({
  delivery,
  purchaseOrder,
  conferencedItems = 0,
  totalItems = 0,
  onResumeConference,
}: DeliveryTimelineProps) {
  const s = delivery.status;
  const batches = delivery.batches || [];
  const isInConference = s === "in_inspection";
  const isPartial = s === "partially_received";
  const isReceived = s === "received" || s === "received_with_divergence";
  const isConfirmed = s === "confirmed";

  const progressPct = totalItems > 0 ? Math.round((conferencedItems / totalItems) * 100) : 0;
  const lastBatch = batches.at(-1);

  // ── Construção dos 10 eventos ──────────────────────────────────────────────

  const events: TimelineEvent[] = [];

  // 1. Pedido de Compra Criado
  events.push({
    key: "po_created",
    title: "Pedido de Compra Criado",
    date: purchaseOrder?.createdAt || delivery.createdAt,
    description: `Pedido ${purchaseOrder?.orderNumber || delivery.purchaseOrderId} registado no sistema`,
    icon: FileText,
    status: "done",
  });

  // 2. Fornecedor Confirmou
  const poConfirmed =
    purchaseOrder &&
    purchaseOrder.status !== "draft" &&
    purchaseOrder.status !== "pending_approval";
  events.push({
    key: "supplier_confirmed",
    title: "Fornecedor Confirmou",
    date: purchaseOrder?.approvedAt || purchaseOrder?.sentAt,
    description: poConfirmed
      ? "Ordem de compra enviada e confirmada pelo fornecedor"
      : "A aguardar confirmação do fornecedor",
    icon: CheckCircle2,
    status: poConfirmed ? "done" : "pending",
  });

  // 3. Transporte Iniciado
  const inTransit =
    ["in_transit", "arrived", "in_inspection", "partially_received", "received", "received_with_divergence", "confirmed"].includes(s);
  events.push({
    key: "transport_started",
    title: "Transporte Iniciado",
    date: (delivery as any).dispatchedAt,
    user: (delivery as any).driverName,
    description: inTransit
      ? `${(delivery as any).vehiclePlate ? `Matrícula: ${(delivery as any).vehiclePlate} · ` : ""}Carga em trânsito`
      : "A aguardar expedição pelo fornecedor",
    icon: Truck,
    status: inTransit ? "done" : "pending",
  });

  // 4. Chegada ao Destino
  const arrived =
    ["arrived", "in_inspection", "partially_received", "received", "received_with_divergence", "confirmed"].includes(s);
  events.push({
    key: "arrived",
    title: "Chegada ao Destino",
    date: delivery.arrivedAt,
    user: delivery.receivedByUserName || delivery.receivedBy,
    description: arrived
      ? `Carga chegada ao local de destino`
      : "A aguardar chegada da carga",
    icon: MapPin,
    status: arrived ? "done" : "pending",
  });

  // 5. Conferência Iniciada (evento activo quando in_inspection)
  const conferenceStarted =
    ["in_inspection", "partially_received", "received", "received_with_divergence", "confirmed"].includes(s);

  events.push({
    key: "conference_started",
    title: isInConference ? "Conferência em Curso" : "Conferência Iniciada",
    date: batches[0]?.receivedAt || delivery.arrivedAt,
    user: delivery.receivedByUserName,
    description: isInConference
      ? `A conferir materiais recebidos — ${conferencedItems} de ${totalItems} item(ns) concluído(s)`
      : conferenceStarted
      ? "Conferência física dos itens concluída pelo responsável"
      : "A aguardar início da conferência",
    icon: Search,
    status: isInConference ? "active" : conferenceStarted ? "done" : "pending",
    activeContent:
      isInConference ? (
        <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200/60 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-blue-700">
              Itens concluídos: {conferencedItems} / {totalItems}
            </span>
            <span className="font-mono text-blue-600">{progressPct}%</span>
          </div>
          <Progress value={progressPct} className="h-1.5" />
          {lastBatch && (
            <div className="text-[10px] text-blue-600 flex items-center gap-1">
              <User className="w-2.5 h-2.5" />
              <span>Última alteração: {formatDate(lastBatch.receivedAt)} · {lastBatch.receivedByUserName}</span>
            </div>
          )}
          {onResumeConference && (
            <Button
              size="sm"
              onClick={onResumeConference}
              className="h-6 text-[11px] bg-blue-600 hover:bg-blue-700 text-white w-full mt-1"
            >
              Retomar Conferência
            </Button>
          )}
        </div>
      ) : undefined,
  });

  // 6. Receções Parciais — um evento por lote
  batches.forEach((batch, idx) => {
    const hasRejections = batch.items?.some((i) => (i.rejectedQuantity || 0) > 0);
    events.push({
      key: `batch_${batch.id || idx}`,
      title: `Receção Parcial — ${batch.batchNumber || `LOTE-${idx + 1}`}`,
      date: batch.receivedAt,
      user: batch.receivedByUserName,
      description: `${batch.items?.length || 0} material(is) conferido(s)${hasRejections ? " · Com divergências" : ""}${batch.notes ? ` · ${batch.notes}` : ""}`,
      icon: Layers,
      status: "done",
    });
  });

  // 7. Documentos Anexados
  const docCount = delivery.documents?.length || 0;
  if (docCount > 0 || isConfirmed) {
    events.push({
      key: "documents",
      title: "Documentos Anexados",
      date: delivery.documents?.at(-1)?.uploadedAt,
      user: delivery.documents?.at(-1)?.uploadedByUserName,
      description: docCount > 0
        ? `${docCount} ficheiro(s) associado(s) à entrega`
        : "Nenhum documento foi anexado",
      icon: Paperclip,
      status: docCount > 0 ? "done" : "pending",
    });
  }

  // 8. Receção Confirmada
  const receivedDone = isReceived || isConfirmed;
  events.push({
    key: "confirmed",
    title: "Receção Confirmada",
    date: delivery.confirmedAt || delivery.inventoryProcessedAt,
    user: delivery.receivedByUserName,
    description: isConfirmed || isReceived
      ? `${s === "received_with_divergence" ? "Receção com divergências registadas" : "Receção completa sem divergências"}`
      : isPartial
      ? "Aguarda confirmação final da receção"
      : "Aguarda conclusão da conferência",
    icon: isReceived || isConfirmed ? PackageCheck : Clock,
    status:
      (isPartial || isInConference) && !isConfirmed
        ? "active"
        : isConfirmed || isReceived
        ? "done"
        : "pending",
  });

  // 9. Stock Atualizado
  events.push({
    key: "stock_updated",
    title: "Stock Atualizado",
    date: delivery.inventoryProcessedAt,
    description: isConfirmed
      ? `InventoryEngine processou ${delivery.movementIds?.length || 0} movimento(s) de stock`
      : "Aguarda confirmação da receção",
    icon: BarChart2,
    status: isConfirmed ? "done" : "pending",
  });

  // 10. Materiais Disponíveis (obra ou armazém)
  const isProject = delivery.destinationType !== "central_stock";
  events.push({
    key: "materials_available",
    title: isProject ? "Materiais Disponíveis na Obra" : "Materiais Disponíveis no Armazém",
    date: delivery.inventoryProcessedAt,
    description: isConfirmed
      ? `Stock e saldos actualizados — materiais prontos a utilizar`
      : "A aguardar confirmação",
    icon: isProject ? HardHat : Building2,
    status: isConfirmed ? "done" : "pending",
  });

  // ── Renderização ───────────────────────────────────────────────────────────

  return (
    <Card className="border-border/60">
      <CardHeader className="py-3 px-4 bg-muted/20 border-b border-border/60">
        <CardTitle className="text-xs font-bold flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <span>Timeline Operacional</span>
          <span className="ml-auto text-[10px] text-muted-foreground font-normal">
            {events.filter((e) => e.status === "done").length} de {events.length} etapas concluídas
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4">
        <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
          {events.map((evt) => {
            const Icon = evt.icon;
            return (
              <div key={evt.key} className="relative group">
                {getDot(evt.status)}

                <div className={`space-y-0.5 ${evt.status === "active" ? "opacity-100" : evt.status === "done" ? "opacity-100" : "opacity-50"}`}>
                  <div className="flex items-start justify-between gap-2 text-xs">
                    <span className={`font-semibold ${evt.status === "active" ? "text-blue-700" : evt.status === "done" ? "text-foreground" : "text-muted-foreground"}`}>
                      {evt.title}
                    </span>
                    {evt.date && (
                      <span className="text-[11px] text-muted-foreground font-mono shrink-0">
                        {formatDate(evt.date)}
                      </span>
                    )}
                  </div>

                  <p className={`text-xs ${evt.status === "active" ? "text-blue-600" : "text-muted-foreground"}`}>
                    {evt.description}
                  </p>

                  {evt.user && (
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                      <User className="w-2.5 h-2.5" />
                      <span>{evt.user}</span>
                    </div>
                  )}

                  {/* Conteúdo expandido para o evento activo */}
                  {evt.activeContent}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
