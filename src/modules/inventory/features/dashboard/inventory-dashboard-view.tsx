import React, { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { PageContainer } from "@/components/shared/page-container";
import { InventoryKpiCard } from "../../components/inventory-kpi-card";
import { InventoryStatusBadge } from "../../components/inventory-status-badge";
import { InventoryPermissionState } from "../../components/inventory-permission-state";
import { ManualReceiptDialog } from "../receipts/manual-receipt-dialog";
import { NewTransferDialog } from "../transfers/new-transfer-dialog";
import { CreateReservationDialog } from "../reservations/create-reservation-dialog";
import { NewAdjustmentDialog } from "../adjustments/new-adjustment-dialog";
import { DeliveryReceptionDialog } from "../receipts/delivery-reception-dialog";
import { ConfirmTransferReceiptDialog } from "../transfers/confirm-transfer-receipt-dialog";
import { useInventoryPermissions } from "../../hooks/use-inventory-permissions";
import { inventoryStoreManager } from "../../store/inventory-store";
import { InventorySelectors } from "../../store/inventory-selectors";
import { useObraMZStore } from "@/store/obramz-store";
import { formatMZN, formatDate } from "@/lib/format";
import { getMaterialDisplay, getLocationDisplay } from "../../utils/inventory-display";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Boxes,
  Package,
  TrendingDown,
  Clock,
  ArrowLeftRight,
  AlertTriangle,
  Plus,
  Activity,
  ChevronRight,
  Truck,
  ShieldAlert,
  Building2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Delivery } from "@/lib/purchases";

export function InventoryDashboardView() {
  const permissions = useInventoryPermissions();
  const [storeState, setStoreState] = useState(inventoryStoreManager.getState());

  // Dados do Store Global do ObraMZ
  const materials = useObraMZStore((s) => s.materials || []);
  const warehouses = useObraMZStore((s) => s.warehouses || []);
  const obras = useObraMZStore((s) => s.obras || []);
  const suppliers = useObraMZStore((s) => s.suppliers || []);
  const deliveries = useObraMZStore((s) => s.deliveries || []);
  const purchaseOrders = useObraMZStore((s) => s.purchaseOrders || []);

  // Modais
  const [openReceiptModal, setOpenReceiptModal] = useState(false);
  const [openTransferModal, setOpenTransferModal] = useState(false);
  const [openReservationModal, setOpenReservationModal] = useState(false);
  const [openAdjustmentModal, setOpenAdjustmentModal] = useState(false);
  const [selectedDeliveryToReceive, setSelectedDeliveryToReceive] = useState<Delivery | null>(null);
  const [selectedTransferToConfirm, setSelectedTransferToConfirm] = useState<{
    id: string;
    sourceLocationId: string;
    destinationLocationId: string;
    materialId: string;
    quantity: number;
  } | null>(null);

  useEffect(() => {
    const unsubscribe = inventoryStoreManager.subscribe((s) => setStoreState(s));
    return () => unsubscribe();
  }, []);

  if (!permissions.canView) {
    return <InventoryPermissionState />;
  }

  // Cálculos via Selectors e Store Global
  const totalValue = InventorySelectors.selectTotalInventoryValue(storeState);
  const lowStockBalances = InventorySelectors.selectLowStockBalances(storeState, 10);
  const outOfStockBalances = InventorySelectors.selectOutOfStockBalances(storeState);
  const balancesList = Object.values(storeState.balances);
  const totalOnHand = balancesList.reduce((sum, b) => sum + b.onHandQuantity, 0);
  const totalReserved = balancesList.reduce((sum, b) => sum + b.reservedQuantity, 0);
  const totalAvailable = balancesList.reduce((sum, b) => sum + b.availableQuantity, 0);

  // Stock em Trânsito
  const transitBalances = balancesList.filter((b) => b.locationId.includes("TRANSIT"));
  const totalInTransit = transitBalances.reduce((sum, b) => sum + b.onHandQuantity, 0);

  // Pendências de Entregas & Compra
  const pendingDeliveries = deliveries.filter((d) => d.status === "draft" || d.status === "pending");
  const delayedDeliveries = deliveries.filter((d) => {
    if (d.status === "confirmed" || d.status === "cancelled") return false;
    const delDate = new Date(d.deliveryDate);
    return delDate < new Date();
  });

  // Movimentos Recentes com Resolução de Nomes
  const recentMovements = storeState.movements.slice(0, 5);

  return (
    <PageContainer>
      <PageHeader
        title="Inventário de Stock — Centro de Controlo Operacional"
        description="Gestão centralizada de stock, movimentos, reservas e acertos físico-contabilísticos"
        breadcrumbs={[{ label: "Início", href: "/app" }, { label: "Inventário" }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {permissions.canReceive && (
              <Button
                size="sm"
                onClick={() => setOpenReceiptModal(true)}
                className="gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Receber Compra</span>
              </Button>
            )}
            {permissions.canTransfer && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setOpenTransferModal(true)}
                className="gap-1.5"
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>Transferir</span>
              </Button>
            )}
            {permissions.canReserve && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setOpenReservationModal(true)}
                className="gap-1.5"
              >
                <Clock className="w-4 h-4" />
                <span>Reservar</span>
              </Button>
            )}
            {permissions.canAdjust && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setOpenAdjustmentModal(true)}
                className="gap-1.5"
              >
                <TrendingDown className="w-4 h-4" />
                <span>Ajuste</span>
              </Button>
            )}
          </div>
        }
      />

      {/* CAMADA 1: ALERTAS CRÍTICOS E PENDÊNCIAS (O QUE REQUER A MINHA ATENÇÃO AGORA?) */}
      <div className="space-y-3 mb-6">
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-rose-500" />
          <span>Atenção Operacional Imediata</span>
        </h2>

        {/* 1.1 Ruturas Críticas */}
        {outOfStockBalances.length > 0 && (
          <Alert variant="destructive" className="bg-rose-500/10 text-rose-700 border-rose-500/20 text-xs p-3">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            <AlertTitle className="text-xs font-bold">
              {outOfStockBalances.length} Material(ais) com Stock Esgotado!
            </AlertTitle>
            <AlertDescription className="mt-1 flex items-center justify-between">
              <span>
                {outOfStockBalances.slice(0, 3).map((b) => getMaterialDisplay(b.materialId, materials).name).join(", ")}
                {outOfStockBalances.length > 3 ? ` e mais ${outOfStockBalances.length - 3}...` : ""}
              </span>
              <Link to="/app/inventory/stock">
                <Button size="xs" variant="outline" className="h-6 text-[11px] ml-2 border-rose-500/30 text-rose-700 hover:bg-rose-500/20">
                  Ver Materiais
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* 1.2 Entregas Atrasadas */}
        {delayedDeliveries.length > 0 && (
          <Alert className="bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20 text-xs p-3">
            <Truck className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-xs font-bold">
              {delayedDeliveries.length} Entrega(s) de Compras Atrasada(s)!
            </AlertTitle>
            <AlertDescription className="mt-1 flex items-center justify-between">
              <span>
                Guia {delayedDeliveries[0]?.deliveryNumber} (Previsão: {formatDate(delayedDeliveries[0]?.deliveryDate)})
              </span>
              <Link to="/app/inventory/deliveries">
                <Button size="xs" variant="outline" className="h-6 text-[11px] ml-2 border-amber-500/30 text-amber-800 hover:bg-amber-500/20">
                  Receber Entrega
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* CAMADA 2: RECEÇÕES PENDENTES E TRANSFERÊNCIAS POR CONFIRMAR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Receções Pendentes */}
        <Card className="border-border/60">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-500" />
              <span>Receções Pendentes de Compras ({pendingDeliveries.length})</span>
            </CardTitle>
            <Link to="/app/inventory/deliveries" className="text-[11px] text-primary hover:underline">
              Ver Todas
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {pendingDeliveries.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                Nenhuma entrega pendente de receção.
              </div>
            ) : (
              <div className="divide-y divide-border/40 text-xs">
                {pendingDeliveries.slice(0, 3).map((d) => {
                  const destLabel = getLocationDisplay(
                    d.destinationType === "central_stock" ? d.destinationWarehouseId || "WH-MAIN" : d.destinationProjectId || "PROJ-1",
                    warehouses,
                    obras
                  ).label;

                  return (
                    <div key={d.id} className="p-3 flex items-center justify-between hover:bg-muted/30">
                      <div>
                        <div className="font-semibold font-mono text-foreground">{d.deliveryNumber}</div>
                        <div className="text-[11px] text-muted-foreground">Destino: {destLabel}</div>
                      </div>
                      <Button
                        size="xs"
                        onClick={() => setSelectedDeliveryToReceive(d)}
                        className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Receber</span>
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transferências Em Trânsito */}
        <Card className="border-border/60">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-amber-500" />
              <span>Transferências em Trânsito ({transitBalances.length})</span>
            </CardTitle>
            <Link to="/app/inventory/transfers" className="text-[11px] text-primary hover:underline">
              Ver Todas
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {transitBalances.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                Nenhuma transferência atualmente em trânsito.
              </div>
            ) : (
              <div className="divide-y divide-border/40 text-xs">
                {transitBalances.slice(0, 3).map((tb) => {
                  const matName = getMaterialDisplay(tb.materialId, materials).name;
                  return (
                    <div key={tb.id} className="p-3 flex items-center justify-between hover:bg-muted/30">
                      <div>
                        <div className="font-semibold text-foreground">{matName}</div>
                        <div className="text-[11px] text-muted-foreground">
                          Em Trânsito: {tb.onHandQuantity} un
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">
                        Em Trânsito
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* CAMADA 3: GRID DE KPIS OPERACIONAIS (11 MÉTRICAS DE CONTROLO) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <InventoryKpiCard
          title="Valor Total em Stock"
          value={formatMZN(totalValue)}
          subtitle="Valorização por Custo Médio (WAC)"
          icon={Boxes}
          variant="emerald"
          href="/app/inventory/stock"
          description="Soma do valor financeiro do inventário (onHandQuantity × averageCost)."
        />

        <InventoryKpiCard
          title="Stock Físico Disponível"
          value={`${totalAvailable.toLocaleString()} un`}
          subtitle={`${totalReserved.toLocaleString()} un reservadas`}
          icon={Package}
          variant="blue"
          href="/app/inventory/stock"
          description="Quantidade física em stock menos a quantidade alocada em reservas ativas."
        />

        <InventoryKpiCard
          title="Alertas de Ruptura"
          value={`${lowStockBalances.length + outOfStockBalances.length}`}
          subtitle={`${outOfStockBalances.length} esgotados | ${lowStockBalances.length} stock baixo`}
          icon={AlertTriangle}
          variant={lowStockBalances.length + outOfStockBalances.length > 0 ? "amber" : "default"}
          href="/app/inventory/stock"
          description="Materiais com quantidade disponível igual a zero ou abaixo do limiar de segurança."
        />

        <InventoryKpiCard
          title="Saúde & Integridade"
          value="Auditado"
          subtitle="Health Check disponível"
          icon={Activity}
          variant="purple"
          href="/app/inventory/health"
          description="Integridade física e contabilística de movimentos, saldos e chaves de idempotência."
        />
      </div>

      {/* CAMADA 4 & 5: MOVIMENTOS RECENTES & ATALHOS MODULARES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Coluna Principal: Movimentos Recentes com Resolução de Nomes Reais */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base font-semibold">Movimentos Recentes</CardTitle>
                <CardDescription className="text-xs">
                  Últimas entradas, saídas, consumos e transferências de stock
                </CardDescription>
              </div>
              <Link
                to="/app/inventory/movements"
                className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
              >
                <span>Ver Todos</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {recentMovements.length === 0 ? (
                <p className="text-xs text-muted-foreground p-6 text-center">
                  Nenhum movimento recente registado.
                </p>
              ) : (
                <div className="divide-y divide-border/40 text-xs">
                  {recentMovements.map((mov) => {
                    const matDisplay = getMaterialDisplay(mov.materialId, materials);
                    const destDisplay = getLocationDisplay(mov.destinationLocationId || mov.sourceLocationId, warehouses, obras);

                    return (
                      <div
                        key={mov.id}
                        className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="font-semibold text-foreground">{matDisplay.name}</div>
                          <div className="text-muted-foreground flex items-center gap-2 text-[11px]">
                            <span>{destDisplay.label}</span>
                            <span>•</span>
                            <span>{formatDate(mov.occurredAt)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-semibold text-foreground">
                            {mov.movementType.includes("in") || mov.movementType.includes("receipt")
                              ? "+"
                              : "-"}
                            {mov.quantity} {matDisplay.unit}
                          </div>
                          <InventoryStatusBadge
                            status={mov.status}
                            showIcon={false}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral: Atalhos Rápidos */}
        <div className="space-y-6">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Ferramentas de Módulo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <Link
                to="/app/inventory/deliveries"
                className="flex items-center justify-between p-3 rounded-lg border border-border/60 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Truck className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">Entregas & Guia de Receções</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>

              <Link
                to="/app/inventory/reports"
                className="flex items-center justify-between p-3 rounded-lg border border-border/60 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <span className="font-medium">Relatórios & Valorização (WAC)</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>

              {permissions.isAdmin && (
                <>
                  <Link
                    to="/app/inventory/health"
                    className="flex items-center justify-between p-3 rounded-lg border border-border/60 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <ShieldAlert className="w-4 h-4 text-purple-500" />
                      <span className="font-medium">Verificar inconsistências</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modais de Ações Rápidas */}
      {openReceiptModal && (
        <ManualReceiptDialog open={openReceiptModal} onOpenChange={setOpenReceiptModal} />
      )}
      {openTransferModal && (
        <NewTransferDialog open={openTransferModal} onOpenChange={setOpenTransferModal} />
      )}
      {openReservationModal && (
        <CreateReservationDialog
          open={openReservationModal}
          onOpenChange={setOpenReservationModal}
        />
      )}
      {openAdjustmentModal && (
        <NewAdjustmentDialog open={openAdjustmentModal} onOpenChange={setOpenAdjustmentModal} />
      )}

      {/* Modal de Conferência de Receção de Entrega */}
      {selectedDeliveryToReceive && (
        <DeliveryReceptionDialog
          open={!!selectedDeliveryToReceive}
          onOpenChange={(open) => !open && setSelectedDeliveryToReceive(null)}
          delivery={selectedDeliveryToReceive}
        />
      )}
    </PageContainer>
  );
}
