import React, { useState, useCallback } from "react";
import { PageHeader } from "@/components/page-header";
import { PageContainer } from "@/components/shared/page-container";
import { useObraMZStore } from "@/store/obramz-store";
import { useInventoryPermissions } from "../../hooks/use-inventory-permissions";
import { InventoryPermissionState } from "../../components/inventory-permission-state";
import { formatDate } from "@/lib/format";
import { getSupplierDisplay, getLocationDisplay, getMaterialDisplay } from "../../utils/inventory-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Truck, Building2, HardHat, CheckCircle2, AlertTriangle, Clock,
  FileText, Paperclip, ArrowLeft, ArrowUpRight, User, Package,
  Activity, ChevronDown, ChevronUp,
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import type { Delivery, DeliveryStatus, ReceiptBatch, DeliveryDocument } from "@/lib/purchases";

// Componentes do Bloco 2
import { DeliveryActionBar } from "./delivery-action-bar";
import { DeliveryConferenceSection } from "./delivery-conference-section";
import { DeliveryReceptionSummary } from "./delivery-reception-summary";
import { DeliverySuccessScreen } from "./delivery-success-screen";
import { DeliveryDocumentsSection } from "./delivery-documents-section";
import { DeliveryTimeline } from "./delivery-timeline";
import { ReceiptBatchesHistory } from "./receipt-batches-history";
import { DeliveryPrintLayout } from "./delivery-print-layout";
import { DeliveryProcessStepper, type DeliveryStep } from "./delivery-process-stepper";
import { DeliveryPendingItemsCard } from "./delivery-pending-items-card";
import { DeliveryNextActionBanner } from "./delivery-next-action-banner";
import { RelatedEntitiesCard, type RelatedEntityItem } from "@/components/shared/related-entities-card";
import { BusinessContextCard } from "@/components/shared/business-context-card";
import { UnifiedTimeline, type UnifiedTimelineEvent } from "@/components/shared/unified-timeline";

import {
  useDeliveriesUiStateStore,
  type DeliveryDetailMode,
  type ConferenceState,
} from "../../store/deliveries-ui-state";

interface DeliveryDetailsViewProps {
  deliveryId: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<DeliveryStatus, { label: string; color: string }> = {
  expected:                 { label: "Aguardando receção",        color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  draft:                    { label: "Aguardando receção",        color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  in_transit:               { label: "Em Trânsito",              color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" },
  arrived:                  { label: "Chegada ao destino",        color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  in_inspection:            { label: "Em Conferência",            color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  partially_received:       { label: "Parcialmente recebida",     color: "bg-amber-600/10 text-amber-700 border-amber-600/20" },
  received:                 { label: "Recebida",                  color: "bg-teal-500/10 text-teal-600 border-teal-500/20" },
  received_with_divergence: { label: "Com Divergências",          color: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
  confirmed:                { label: "Confirmada",                color: "bg-emerald-600 text-white border-transparent" },
  rejected:                 { label: "Rejeitada",                 color: "bg-rose-600 text-white border-transparent" },
  cancelled:                { label: "Cancelada",                 color: "bg-slate-500/10 text-slate-600 border-slate-500/20" },
};

// ── Componente ────────────────────────────────────────────────────────────────

export function DeliveryDetailsView({ deliveryId }: DeliveryDetailsViewProps) {
  const navigate = useNavigate();
  const permissions = useInventoryPermissions();

  // Store — leitura
  const deliveries    = useObraMZStore((s) => s.deliveries || []);
  const purchaseOrders = useObraMZStore((s) => s.purchaseOrders || []);
  const deliveryItems = useObraMZStore((s) => s.deliveryItems || []);
  const suppliers     = useObraMZStore((s) => s.suppliers || []);
  const warehouses    = useObraMZStore((s) => s.warehouses || []);
  const obras         = useObraMZStore((s) => s.obras || []);
  const materials     = useObraMZStore((s) => s.materials || []);
  const stockMovements = useObraMZStore((s) => s.stockMovements || []);

  // Store — actions
  const updateDelivery     = useObraMZStore((s) => s.updateDelivery);
  const updateDeliveryItem = useObraMZStore((s) => s.updateDeliveryItem);
  const confirmDelivery    = useObraMZStore((s) => s.confirmDelivery);

  // UI State
  const { detailMode, setDetailMode, conferenceState, setConferenceState, clearConferenceState } =
    useDeliveriesUiStateStore();

  const [confirmLoading, setConfirmLoading] = useState(false);
  const [successData, setSuccessData] = useState<{
    totalAccepted: number;
    movementsCreated: number;
    documentsArchived: number;
  } | null>(null);
  const [showBatchHistory, setShowBatchHistory] = useState(false);

  // ── Dados da entrega ───────────────────────────────────────────────────────

  const delivery = deliveries.find((d) => d.id === deliveryId || d.deliveryNumber === deliveryId);
  const po       = delivery ? purchaseOrders.find((p) => p.id === delivery.purchaseOrderId) : undefined;
  const items    = delivery ? deliveryItems.filter((di) => di.deliveryId === delivery.id) : [];

  if (!permissions.canViewDeliveries) return <InventoryPermissionState />;

  if (!delivery) {
    return (
      <PageContainer>
        <div className="max-w-md mx-auto my-12 p-6 border rounded-xl bg-card text-center space-y-4 shadow-sm">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold">A entrega solicitada não foi encontrada</h2>
          <p className="text-xs text-muted-foreground">
            O registo com o ID ou código "{deliveryId}" não existe na base de dados do sistema.
          </p>
          <Button size="sm" asChild className="bg-primary text-primary-foreground">
            <Link to="/app/inventory/deliveries">
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar às Entregas
            </Link>
          </Button>
        </div>
      </PageContainer>
    );
  }

  // ── Cálculos ───────────────────────────────────────────────────────────────

  const supplierDisplay = po ? getSupplierDisplay(po.supplierId, suppliers) : { name: "Fornecedor", nuit: "" };
  const isWarehouse = delivery.destinationType === "central_stock";
  const destLocationId = isWarehouse
    ? (delivery as any).destinationWarehouseId || "WH-MAIN"
    : `LOC-PROJ-${delivery.destinationProjectId || "PROJ-1"}`;
  const destLocationDisplay = getLocationDisplay(destLocationId, warehouses, obras);

  const totalQtyExpected = items.reduce((s, i) => s + (i.quantityExpected || 0), 0);
  const totalQtyReceived = items.reduce((s, i) => s + (i.acceptedQuantity || i.receivedBaseQuantity || 0), 0);
  const completedItemsCount = items.filter((i) => (i.acceptedQuantity || 0) >= (i.quantityExpected || 1)).length;
  const progressPct = items.length > 0 ? Math.round((completedItemsCount / items.length) * 100) : 0;

  const hasDivergences = items.some(
    (i) => (i.rejectedQuantity || 0) > 0 || (i.rejectionReason && i.rejectionReason.length > 0)
  );
  const canConfirm = totalQtyReceived > 0 || (delivery.batches?.length || 0) > 0;

  const associatedMovements = stockMovements.filter(
    (m) => m.deliveryId === delivery.id ||
      (delivery.movementIds && delivery.movementIds.includes(m.id))
  );

  // Última atividade + próxima ação
  const lastBatch = delivery.batches?.at(-1);
  const lastDoc   = delivery.documents?.at(-1);
  const lastActivity = lastBatch
    ? { label: `${lastBatch.batchNumber} processado`, date: lastBatch.receivedAt, user: lastBatch.receivedByUserName }
    : lastDoc
    ? { label: `Documento anexado`, date: lastDoc.uploadedAt, user: lastDoc.uploadedByUserName }
    : { label: "Entrega registada", date: delivery.createdAt, user: delivery.receivedByUserName || "—" };

  const nextActionLabel: Record<DeliveryStatus, string> = {
    expected:                 "Iniciar conferência quando o camião chegar",
    draft:                    "Iniciar conferência quando o camião chegar",
    in_transit:               "Aguardar chegada da carga ao destino",
    arrived:                  "Iniciar conferência da carga",
    in_inspection:            `Continuar conferência (${items.length - completedItemsCount} item(ns) por conferir)`,
    partially_received:       "Nova receção parcial ou confirmar receção",
    received:                 "Confirmar receção para atualizar o stock",
    received_with_divergence: "Confirmar receção — existem divergências registadas",
    confirmed:                "Entrega concluída · Abrir Obra ou ver Movimentos",
    rejected:                 "Entrega rejeitada · Sem ações pendentes",
    cancelled:                "Entrega cancelada · Sem ações pendentes",
  };

  const destName = isWarehouse
    ? (warehouses.find((w: any) => w.id === (delivery as any).destinationWarehouseId)?.name || "Armazém Central")
    : (obras.find((o: any) => o.id === delivery.destinationProjectId)?.name || delivery.destinationProjectId || "—");

  const deliveryUrl = `${window.location.origin}/app/inventory/deliveries/${delivery.id}`;

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleStartInspection = useCallback(() => {
    try {
      updateDelivery(delivery.id, {
        status: "in_inspection",
        arrivedAt: new Date().toISOString(),
      } as any);
      toast.success("Conferência iniciada. Pode agora registar os materiais recebidos.");
    } catch (err: any) {
      toast.error(err.message || "Erro ao iniciar conferência.");
    }
  }, [delivery.id, updateDelivery]);

  const handleCancelConference = useCallback(() => {
    try {
      updateDelivery(delivery.id, { status: "arrived" } as any);
      setDetailMode("view");
      toast.info("Conferência pausada. A entrega foi mantida.");
    } catch (err: any) {
      toast.error(err.message || "Erro ao cancelar conferência.");
    }
  }, [delivery.id, updateDelivery, setDetailMode]);

  const handleCancelDelivery = useCallback(() => {
    try {
      updateDelivery(delivery.id, {
        status: "cancelled",
        cancelledAt: new Date().toISOString(),
      } as any);
      clearConferenceState(delivery.id);
      setDetailMode("view");
      toast.warning(`Entrega ${delivery.deliveryNumber} cancelada.`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao cancelar entrega.");
    }
  }, [delivery.id, delivery.deliveryNumber, updateDelivery, clearConferenceState, setDetailMode]);

  const handleReceiveAll = useCallback(() => {
    // Pré-preencher todas as quantidades como aceites
    const newState: ConferenceState = {
      deliveryId: delivery.id,
      deliveredQuantities: {},
      acceptedQuantities: {},
      rejectionReasons: {},
      observations: {},
      startedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
    };
    items.forEach((item) => {
      newState.deliveredQuantities[item.id] = item.quantityExpected || 0;
      newState.acceptedQuantities[item.id]  = item.quantityExpected || 0;
    });
    setConferenceState(newState);
    setDetailMode("summary");
  }, [delivery.id, items, setConferenceState, setDetailMode]);

  const handleBatchProcessed = useCallback((batch: ReceiptBatch, newStatus: DeliveryStatus) => {
    const updatedBatches  = [...(delivery.batches || []), batch];
    const updatedMovements = [...(delivery.movementIds || []), ...(batch.movementIds || [])];
    updateDelivery(delivery.id, {
      batches:     updatedBatches,
      movementIds: updatedMovements,
      status:      newStatus,
      inventoryProcessedAt: batch.receivedAt,
    } as any);
    setDetailMode("view");
  }, [delivery, updateDelivery, setDetailMode]);

  const handleAddDocument = useCallback((doc: DeliveryDocument) => {
    const docs = [...(delivery.documents || []), { ...doc, deliveryId: delivery.id }];
    updateDelivery(delivery.id, { documents: docs } as any);
  }, [delivery, updateDelivery]);

  const handleRemoveDocument = useCallback((docId: string) => {
    const docs = (delivery.documents || []).filter((d) => d.id !== docId);
    updateDelivery(delivery.id, { documents: docs } as any);
  }, [delivery, updateDelivery]);

  const handleConfirmReception = useCallback(async () => {
    setConfirmLoading(true);
    try {
      // 1. Atualizar DeliveryItems com as quantidades conferidas
      const accepted = conferenceState?.acceptedQuantities || {};
      const delivered = conferenceState?.deliveredQuantities || {};
      for (const item of items) {
        const acceptedQty  = accepted[item.id]  ?? item.acceptedQuantity  ?? item.quantityExpected ?? 0;
        const deliveredQty = delivered[item.id] ?? item.receivedBaseQuantity ?? acceptedQty;
        updateDeliveryItem(item.id, {
          acceptedQuantity:        acceptedQty,
          receivedBaseQuantity:    deliveredQty,
          acceptedPurchaseQuantity: acceptedQty / (item.conversionFactor || 1),
          receivedPurchaseQuantity: deliveredQty / (item.conversionFactor || 1),
          actualUnitCost:      item.actualUnitCost || item.unitPrice || 0,
          actualBaseUnitCost:  (item.actualUnitCost || item.unitPrice || 0) / (item.conversionFactor || 1),
        });
      }

      // 2. Confirmar — cria StockMovements + atualiza InventoryBalance + fecha PO
      confirmDelivery(delivery.id);

      const data = {
        totalAccepted:      items.reduce((s, i) => s + (accepted[i.id] ?? i.acceptedQuantity ?? 0), 0),
        movementsCreated:   delivery.movementIds?.length || 0,
        documentsArchived:  delivery.documents?.length || 0,
      };

      clearConferenceState(delivery.id);
      setSuccessData(data);
      setDetailMode("success");
      toast.success("Receção confirmada! Stock e materiais atualizados.");
    } catch (err: any) {
      toast.error(err.message || "Erro ao confirmar receção.");
    } finally {
      setConfirmLoading(false);
    }
  }, [
    items, conferenceState, delivery,
    updateDeliveryItem, confirmDelivery,
    clearConferenceState, setDetailMode,
  ]);

  const handlePrint = () => window.print();

  // ── Render: Ecrã de Sucesso ────────────────────────────────────────────────

  if (detailMode === "success" && successData) {
    return (
      <PageContainer>
        <DeliverySuccessScreen
          delivery={delivery}
          destinationName={destName}
          totalAccepted={successData.totalAccepted}
          movementsCreated={successData.movementsCreated}
          documentsArchived={successData.documentsArchived}
          purchaseOrderNumber={po?.orderNumber}
          onNewDelivery={() => navigate({ to: "/app/inventory/deliveries" })}
          onBackToList={() => { setDetailMode("view"); navigate({ to: "/app/inventory/deliveries" }); }}
        />
      </PageContainer>
    );
  }

  const statusCfg = STATUS_BADGE[delivery.status] || STATUS_BADGE.draft;

  // Lógica das etapas do Stepper
  const isConferenced = completedItemsCount === items.length && items.length > 0;
  const hasDocs = (delivery.documents?.length || 0) > 0;
  const isConfirmedStatus = delivery.status === "confirmed";

  const stepperSteps: DeliveryStep[] = [
    {
      id: 1,
      label: "Conferência dos Materiais",
      sublabel: isConferenced ? `${items.length} de ${items.length} conferidos` : `${completedItemsCount} de ${items.length} conferidos`,
      status: isConferenced ? "completed" : (detailMode === "conference" || delivery.status === "in_inspection") ? "current" : "pending",
    },
    {
      id: 2,
      label: "Documentos e Evidências",
      sublabel: hasDocs ? `${delivery.documents?.length} documento(s)` : "Guia de remessa e fotos",
      status: hasDocs ? "completed" : (isConferenced && !hasDocs) ? "current" : "pending",
    },
    {
      id: 3,
      label: "Resumo da Operação",
      sublabel: isConfirmedStatus ? "Receção validada" : "Comparação pedido vs recebido",
      status: isConfirmedStatus ? "completed" : detailMode === "summary" ? "current" : (isConferenced && hasDocs) ? "current" : "pending",
    },
    {
      id: 4,
      label: "Confirmação e Stock",
      sublabel: isConfirmedStatus ? "Stock e saldos atualizados" : "Atualização de stock e fecho",
      status: isConfirmedStatus ? "completed" : "pending",
    },
  ];

  // Action callback para o Banner de Próxima Ação
  const handleBannerNextAction = () => {
    if (delivery.status === "expected" || delivery.status === "draft" || delivery.status === "arrived") {
      handleStartInspection();
      setDetailMode("conference");
    } else if (items.some((i) => (i.acceptedQuantity || 0) < (i.quantityExpected || 1))) {
      setDetailMode("conference");
    } else if (!hasDocs) {
      // Scroll suave ou destaque na secção de documentos
      const el = document.getElementById("documents-section");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else {
      setDetailMode("summary");
    }
  };

  // ── Render: Ficha Completa ─────────────────────────────────────────────────

  return (
    <PageContainer>
      {/* Layout de Impressão (oculto no ecrã) */}
      <DeliveryPrintLayout
        delivery={delivery}
        deliveryItems={items}
        purchaseOrder={po}
        supplierName={supplierDisplay.name}
        destinationLabel={destLocationDisplay.label}
        deliveryUrl={deliveryUrl}
      />

      <PageHeader
        title={`${delivery.deliveryNumber}`}
        description={delivery.deliveryNoteNumber ? `Guia: ${delivery.deliveryNoteNumber}` : "Ficha de Entrega"}
        breadcrumbs={[
          { label: "Início", href: "/app" },
          { label: "Inventário", href: "/app/inventory" },
          { label: "Entregas", href: "/app/inventory/deliveries" },
          { label: delivery.deliveryNumber },
        ]}
      />

      <div className="space-y-5 pb-8">
        {/* ── Stepper de Progresso Guiado em 4 Etapas ────────────────────── */}
        <DeliveryProcessStepper steps={stepperSteps} />

        {/* ── Barra de Ações ──────────────────────────────────────────────── */}
        <div className="space-y-2">
          <DeliveryActionBar
            delivery={delivery}
            hasDivergences={hasDivergences}
            canConfirm={canConfirm}
            destinationProjectId={delivery.destinationProjectId}
            onStartInspection={handleStartInspection}
            onOpenConference={() => setDetailMode("conference")}
            onReceiveAll={handleReceiveAll}
            onCancelConference={handleCancelConference}
            onCancelDelivery={handleCancelDelivery}
            onOpenSummary={() => setDetailMode("summary")}
            onPrint={handlePrint}
          />
        </div>

        {/* ── Banner de Próxima Ação Recomendada ──────────────────────────── */}
        <DeliveryNextActionBanner
          status={delivery.status}
          hasPendingItems={items.some((i) => (i.acceptedQuantity || 0) < (i.quantityExpected || 1))}
          hasDocuments={hasDocs}
          onActionClick={handleBannerNextAction}
        />

        {/* ── Cartão de Contexto Operacional do Negócio (Dinamico por Estado) ─ */}
        <BusinessContextCard
          type="delivery"
          entityId={delivery.id}
          delivery={delivery}
          purchaseOrderNumber={po?.orderNumber}
          supplierName={supplierDisplay.name}
          destinationName={destLocationDisplay.label}
          totalItemsCount={items.length}
          conferencedItemsCount={completedItemsCount}
          movementsCount={associatedMovements.length}
        />

        {/* ── Secção de Conferência (inline — desacoplada do modal) ────────── */}
        {detailMode === "conference" && (
          <Card className="border-2 border-blue-300/60 bg-blue-50/20">
            <CardContent className="p-5">
              <DeliveryConferenceSection
                delivery={delivery}
                deliveryItems={items}
                conferenceState={conferenceState?.deliveryId === delivery.id ? conferenceState : null}
                onConferenceStateChange={setConferenceState}
                onBatchProcessed={handleBatchProcessed}
                onOpenSummary={() => setDetailMode("summary")}
                onClose={() => setDetailMode("view")}
              />
            </CardContent>
          </Card>
        )}

        {/* ── Resumo Final ────────────────────────────────────────────────── */}
        {detailMode === "summary" && (
          <Card className="border-2 border-emerald-300/60 bg-emerald-50/20">
            <CardContent className="p-5">
              <DeliveryReceptionSummary
                delivery={delivery}
                deliveryItems={items}
                purchaseOrder={po}
                acceptedQuantities={conferenceState?.acceptedQuantities || {}}
                deliveredQuantities={conferenceState?.deliveredQuantities || {}}
                rejectionReasons={conferenceState?.rejectionReasons || {}}
                loading={confirmLoading}
                onBack={() => setDetailMode("conference")}
                onConfirm={handleConfirmReception}
              />
            </CardContent>
          </Card>
        )}

        {/* ── Identificação ────────────────────────────────────────────────── */}
        <Card className="border-border/60 p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-border/60">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold font-mono tracking-tight text-foreground">
                  {delivery.deliveryNumber}
                </h1>
                <Badge variant="outline" className={`text-xs px-2.5 py-1 ${statusCfg.color}`}>
                  {statusCfg.label}
                </Badge>
                {(delivery.movementIds?.length || 0) > 0 && (
                  <Badge variant="outline" className="text-xs px-2.5 py-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                    Stock Processado
                  </Badge>
                )}
                {delivery.deliveryNoteNumber && (
                  <Badge variant="secondary" className="text-xs font-mono">
                    Guia: {delivery.deliveryNoteNumber}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Pedido de Compra:{" "}
                <Link
                  to="/app/compras/$purchaseOrderId"
                  params={{ purchaseOrderId: po?.id || delivery.purchaseOrderId }}
                  className="text-primary font-bold hover:underline font-mono inline-flex items-center gap-0.5"
                >
                  {po?.orderNumber || delivery.purchaseOrderId}
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {[
              {
                label: "Fornecedor",
                content: (
                  <Link to="/app/fornecedores" className="font-bold text-primary hover:underline block truncate">
                    {supplierDisplay.name}
                  </Link>
                ),
                sub: supplierDisplay.nuit ? `NUIT: ${supplierDisplay.nuit}` : undefined,
              },
              {
                label: "Destino",
                content: isWarehouse ? (
                  <Link to="/app/empresa/armazens" className="font-bold text-primary hover:underline flex items-center gap-1 truncate">
                    <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    {destLocationDisplay.label}
                  </Link>
                ) : (
                  <Link
                    to="/app/obras/$id"
                    params={{ id: delivery.destinationProjectId || "1" }}
                    className="font-bold text-primary hover:underline flex items-center gap-1 truncate"
                  >
                    <HardHat className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    {destLocationDisplay.label}
                  </Link>
                ),
              },
              {
                label: "Data Prevista",
                content: <span className="font-bold font-mono">{formatDate(delivery.deliveryDate)}</span>,
              },
              {
                label: "Data de Chegada",
                content: <span className="font-bold font-mono">{delivery.arrivedAt ? formatDate(delivery.arrivedAt) : "—"}</span>,
              },
              {
                label: "Responsável",
                content: <span className="font-bold truncate block">{delivery.receivedByUserName || delivery.receivedBy || "Fiel de Armazém"}</span>,
              },
              {
                label: "Motorista",
                content: <span className="font-bold truncate block">{delivery.driverName || "Não registado"}</span>,
              },
              {
                label: "Matrícula",
                content: <span className="font-bold font-mono truncate block">{(delivery as any).vehiclePlate || "Não registado"}</span>,
              },
              {
                label: "Data de Confirmação",
                content: <span className="font-bold font-mono">{delivery.confirmedAt ? formatDate(delivery.confirmedAt) : "—"}</span>,
              },
            ].map(({ label, content, sub }) => (
              <div key={label} className="p-3 bg-muted/30 rounded-lg border border-border/50 space-y-0.5">
                <span className="text-muted-foreground block text-[11px] font-semibold uppercase">{label}</span>
                {content}
                {sub && <span className="text-[10px] text-muted-foreground font-mono">{sub}</span>}
              </div>
            ))}
          </div>
        </Card>

        {/* ── Métricas Operacionais + Última Atividade ─────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-3 border-border/60 space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium block">Itens Conferidos</span>
            <span className="text-xl font-bold font-mono text-foreground">
              {completedItemsCount} <span className="text-sm text-muted-foreground">/ {items.length}</span>
            </span>
            <Progress value={progressPct} className="h-1.5 mt-1" />
          </Card>

          <Card className="p-3 border-border/60 space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium block">Quantidade Total</span>
            <span className="text-xl font-bold font-mono">
              <span className="text-emerald-600">{totalQtyReceived}</span>
              <span className="text-sm text-muted-foreground"> / {totalQtyExpected}</span>
            </span>
            <Progress value={totalQtyExpected > 0 ? Math.round((totalQtyReceived / totalQtyExpected) * 100) : 0} className="h-1.5 mt-1" />
          </Card>

          <Card className="p-3 border-border/60 space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium block">Lotes de Receção</span>
            <span className="text-xl font-bold font-mono text-purple-600">
              {delivery.batches?.length || 0}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {associatedMovements.length} movimento(s) stock
            </span>
          </Card>

          {/* Cartão Última Atividade + Próxima Ação */}
          <Card className="p-3 border-border/60 space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 block">
              <Activity className="w-3 h-3" /> Última Atividade
            </span>
            <span className="text-xs font-semibold text-foreground block truncate">{lastActivity.label}</span>
            <span className="text-[10px] text-muted-foreground font-mono">{formatDate(lastActivity.date)}</span>
            {lastActivity.user && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <User className="w-2.5 h-2.5" /> {lastActivity.user}
              </span>
            )}
            <div className="pt-1 border-t border-border/60 mt-1">
              <span className="text-[10px] text-muted-foreground block">Próxima ação:</span>
              <span className="text-[10px] text-primary font-medium block leading-tight">
                {nextActionLabel[delivery.status]}
              </span>
            </div>
          </Card>
        </div>

        {/* ── Painel de Progresso e Itens Pendentes ("Ainda Falta") ────────── */}
        <DeliveryPendingItemsCard items={items} />

        {/* ── Tabela de Materiais ──────────────────────────────────────────── */}
        <Card className="border-border/60">
          <CardHeader className="py-3 px-4 bg-muted/20 border-b border-border/60">
            <CardTitle className="text-xs font-bold flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              <span>Materiais da Entrega ({items.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/10 hover:bg-transparent text-[11px]">
                  <TableHead>Material</TableHead>
                  <TableHead className="text-right">Qtd Pedida</TableHead>
                  <TableHead className="text-right">Qtd Aceite</TableHead>
                  <TableHead className="text-right">Qtd Rejeitada</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                      Nenhum item registado nesta entrega.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => {
                    const mat = getMaterialDisplay(item.materialId, materials);
                    const accepted = item.acceptedQuantity || 0;
                    const rejected = item.rejectedQuantity || 0;
                    const expected = item.quantityExpected || 1;
                    const isOk = accepted >= expected;
                    const isPartial = accepted > 0 && !isOk;

                    return (
                      <TableRow key={item.id} className="hover:bg-muted/30 text-xs">
                        <TableCell className="font-semibold py-2">
                          <Link
                            to="/app/inventory/materials/$materialId"
                            params={{ materialId: item.materialId }}
                            className="text-primary hover:underline flex items-center gap-1 font-bold"
                          >
                            {mat.name}
                            <ArrowUpRight className="w-3 h-3 text-muted-foreground" />
                          </Link>
                          <span className="block text-[10px] text-muted-foreground font-mono">{mat.sku}</span>
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold py-2">{expected}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-emerald-600 py-2">{accepted || "—"}</TableCell>
                        <TableCell className="text-right font-mono py-2 text-rose-600">{rejected || "—"}</TableCell>
                        <TableCell className="py-2">
                          {isOk ? (
                            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Concluído</Badge>
                          ) : isPartial ? (
                            <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">Parcial</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] bg-slate-500/10 text-slate-600 border-slate-500/20">Pendente</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-[11px] py-2 max-w-[200px] truncate">
                          {item.rejectionReason || (item as any).notes || "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* ── Documentos ──────────────────────────────────────────────────── */}
        <DeliveryDocumentsSection
          documents={delivery.documents || []}
          onAddDocument={handleAddDocument}
          onRemoveDocument={handleRemoveDocument}
          canManageDocs={delivery.status !== "confirmed" && delivery.status !== "cancelled"}
        />

        {/* ── Histórico de Lotes de Receção ────────────────────────────────── */}
        {(delivery.batches?.length || 0) > 0 && (
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBatchHistory((v) => !v)}
              className="gap-1.5 text-xs mb-2"
            >
              {showBatchHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showBatchHistory ? "Ocultar" : "Ver"} Histórico de Lotes ({delivery.batches?.length})
            </Button>
            {showBatchHistory && <ReceiptBatchesHistory batches={delivery.batches || []} />}
          </div>
        )}

        {/* ── Timeline Cronológica Unificada Inter-Módulos ─────────────────── */}
        <UnifiedTimeline
          events={[
            {
              id: "evt-po-1",
              stage: "po_created",
              title: `Pedido de Compra ${po?.orderNumber || delivery.purchaseOrderId} Criado`,
              description: `Comprador enviou pedido para o fornecedor ${supplierDisplay.name}`,
              date: po?.createdAt || delivery.createdAt,
              user: (po as any)?.createdByName || "Gestor de Compras",
              status: "completed",
            },
            {
              id: "evt-del-1",
              stage: "delivery_created",
              title: `Entrega ${delivery.deliveryNumber} Registada`,
              description: `Guia ${delivery.deliveryNoteNumber || "Pendente"} com destino a ${destLocationDisplay.label}`,
              date: delivery.createdAt,
              user: delivery.receivedByUserName || "Fiel de Armazém",
              status: "completed",
            },
            {
              id: "evt-del-2",
              stage: "delivery_received",
              title: "Conferência Física & Receção no Destino",
              description: delivery.status === "confirmed" || delivery.status === "received"
                ? `Todos os ${items.length} materiais conferidos e aceites`
                : `Conferência em progresso: ${completedItemsCount} de ${items.length} itens conferidos`,
              date: delivery.arrivedAt || delivery.updatedAt,
              user: delivery.receivedByUserName || "Fiel de Armazém",
              status: (delivery.status === "confirmed" || delivery.status === "received") ? "completed" : (detailMode === "conference" || delivery.status === "in_inspection") ? "current" : "pending",
            },
            {
              id: "evt-stock-1",
              stage: "stock_updated",
              title: "Atualização de Stock & Saldos no Inventário",
              description: (delivery.movementIds?.length || 0) > 0
                ? `${associatedMovements.length} movimentos de stock auditados gerados`
                : "Aguardando confirmação definitiva da receção",
              date: delivery.inventoryProcessedAt || delivery.confirmedAt,
              user: "InventoryEngine Core",
              status: (delivery.movementIds?.length || 0) > 0 || delivery.status === "confirmed" ? "completed" : "pending",
            },
            {
              id: "evt-site-1",
              stage: "site_consumed",
              title: "Primeiro Consumo & Disponibilidade na Obra",
              description: delivery.status === "confirmed"
                ? `Materiais disponíveis em ${destLocationDisplay.label} para requisições de obra`
                : "Aguardando fecho da entrega para libertar aos trolhas/gerente de obra",
              date: delivery.confirmedAt,
              user: "Equipa de Obra",
              status: delivery.status === "confirmed" ? "completed" : "pending",
            },
          ]}
        />

        {/* ── Movimentos de Stock Associados ────────────────────────────────── */}
        {associatedMovements.length > 0 && (
          <Card className="border-border/60">
            <CardHeader className="py-3 px-4 bg-muted/20 border-b border-border/60">
              <CardTitle className="text-xs font-bold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Movimentos de Stock Gerados ({associatedMovements.length})
                </span>
                <Link
                  to="/app/inventory/movements"
                  className="text-[11px] text-primary hover:underline flex items-center gap-0.5"
                >
                  Ver todos <ArrowUpRight className="w-3 h-3" />
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/10 hover:bg-transparent text-[11px]">
                    <TableHead>ID do Movimento</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead className="text-right">Custo Unit.</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {associatedMovements.slice(0, 5).map((mv) => {
                    const mat = getMaterialDisplay(mv.materialId, materials);
                    return (
                      <TableRow key={mv.id} className="text-xs hover:bg-muted/20">
                        <TableCell className="font-mono text-[10px] text-muted-foreground py-1.5">{mv.id.substring(0, 16)}…</TableCell>
                        <TableCell className="font-medium py-1.5">{mat.name}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-emerald-600 py-1.5">+{mv.quantity}</TableCell>
                        <TableCell className="text-right font-mono py-1.5">{mv.unitCost?.toFixed(2)}</TableCell>
                        <TableCell className="font-mono text-muted-foreground py-1.5">{formatDate(mv.createdAt)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
        {(() => {
          const relEntities: RelatedEntityItem[] = [];

          if (po) {
            relEntities.push({
              type: "purchase_order",
              title: po.orderNumber,
              subtitle: `Pedido de Compra · ${formatDate(po.createdAt)}`,
              statusBadge: { label: po.status },
              metricsBadge: `${items.length} itens`,
              linkTo: "/app/compras/$purchaseOrderId",
              linkParams: { purchaseOrderId: po.id },
            });
          }

          if (supplierDisplay?.name) {
            relEntities.push({
              type: "supplier",
              title: supplierDisplay.name,
              subtitle: supplierDisplay.nuit ? `NUIT: ${supplierDisplay.nuit}` : "Fornecedor da carga",
              metricsBadge: "Pontualidade: 96%",
              lastActivityText: "Última entrega: Hoje",
              linkTo: "/app/fornecedores",
            });
          }

          if (isWarehouse) {
            relEntities.push({
              type: "warehouse",
              title: destLocationDisplay.label,
              subtitle: "Armazém de Destino Central",
              metricsBadge: "Capacidade: 78%",
              linkTo: "/app/empresa/armazens",
            });
          } else if (delivery.destinationProjectId) {
            relEntities.push({
              type: "project",
              title: destLocationDisplay.label,
              subtitle: "Obra de Destino",
              metricsBadge: `Recebeu ${items.length} material(is) hoje`,
              linkTo: "/app/obras/$id",
              linkParams: { id: delivery.destinationProjectId },
            });
          }

          if (associatedMovements.length > 0) {
            relEntities.push({
              type: "movement",
              title: `${associatedMovements.length} Movimento(s) de Stock`,
              subtitle: "Movimentos auditados no inventário",
              metricsBadge: "Auditado 100%",
              linkTo: "/app/inventory/movements",
            });
          }

          return <RelatedEntitiesCard title="Entidades Relacionadas com esta Entrega" entities={relEntities} />;
        })()}
      </div>
    </PageContainer>
  );
}
