import React, { useState, useMemo, useEffect, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useObraMZStore } from "@/store/obramz-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatMZN, formatDate } from "@/lib/format";
import { PurchaseOrderFormDialog } from "@/components/purchases/purchase-order-form-dialog";
import { DeliveryFormDialog } from "@/components/purchases/delivery-form-dialog";
import type { PurchaseOrder } from "@/lib/purchases";
import { PurchaseHeader } from "@/components/purchases/purchase-header";
import { PurchaseKPICards, type KpiFilterType } from "@/components/purchases/purchase-kpi-cards";
import { OperationalSummary } from "@/components/purchases/operational-summary";
import { QuickActions } from "@/components/purchases/quick-actions";
import { DelayedDeliveriesCard } from "@/components/purchases/delayed-deliveries-card";
import { RecentPurchasesCard } from "@/components/purchases/recent-purchases-card";
import { PurchaseVolumeChart } from "@/components/purchases/purchase-volume-chart";
import { PurchaseFilters } from "@/components/purchases/purchase-filters";
import { PurchaseTable } from "@/components/purchases/purchase-table";
import { Truck, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const STORAGE_KEY = "obramz_compras_ui_state";

export const Route = createFileRoute("/app/compras/")({
  component: ComprasIndexRoute,
});

function ComprasIndexRoute() {
  const purchaseOrders = useObraMZStore((s) => s.purchaseOrders || []);
  const purchaseOrderItems = useObraMZStore((s) => s.purchaseOrderItems || []);
  const deliveries = useObraMZStore((s) => s.deliveries || []);
  const stockMovements = useObraMZStore((s) => s.stockMovements || []);
  const suppliers = useObraMZStore((s) => s.suppliers || []);
  const obras = useObraMZStore((s) => s.obras || []);

  const cancelPurchaseOrder = useObraMZStore((s) => s.cancelPurchaseOrder);
  const prepareDuplicate = useObraMZStore((s) => s.preparePurchaseOrderDuplicate);

  // Restauração de preferências da UI via localStorage
  const initialUiState = useMemo(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      // Ignore
    }
    return {
      searchTerm: "",
      statusFilter: "all",
      destinationFilter: "all",
      activeKpiFilter: null as KpiFilterType | null,
      sortField: "orderDate" as const,
      sortDirection: "desc" as const,
    };
  }, []);

  // Estados dos Filtros
  const [searchTerm, setSearchTerm] = useState<string>(initialUiState.searchTerm);
  const [statusFilter, setStatusFilter] = useState<string>(initialUiState.statusFilter);
  const [destinationFilter, setDestinationFilter] = useState<string>(initialUiState.destinationFilter);
  const [activeKpiFilter, setActiveKpiFilter] = useState<KpiFilterType | null>(initialUiState.activeKpiFilter);
  const [sortField, setSortField] = useState<string>(initialUiState.sortField);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(initialUiState.sortDirection);

  // Estados dos Modais
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [orderToEdit, setOrderToEdit] = useState<PurchaseOrder | undefined>(undefined);
  const [duplicateData, setDuplicateData] = useState<any>(null);
  const [isDuplicateOpen, setIsDuplicateOpen] = useState<boolean>(false);

  // Modal de entrega rápida
  const [deliveryPO, setDeliveryPO] = useState<PurchaseOrder | undefined>(undefined);
  const [isDeliveryOpen, setIsDeliveryOpen] = useState<boolean>(false);
  const [isQuickDeliverySelectorOpen, setIsQuickDeliverySelectorOpen] = useState<boolean>(false);

  const todayStr = new Date().toISOString().slice(0, 10);

  // Persistência automática em localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          searchTerm,
          statusFilter,
          destinationFilter,
          activeKpiFilter,
          sortField,
          sortDirection,
        })
      );
    } catch (e) {
      // Ignore
    }
  }, [searchTerm, statusFilter, destinationFilter, activeKpiFilter, sortField, sortDirection]);

  // ---------------------------------------------------------------------------
  // 1. Resumo Operacional
  // ---------------------------------------------------------------------------
  const draftOrdersCount = useMemo(
    () => purchaseOrders.filter((po) => po.status === "draft").length,
    [purchaseOrders]
  );

  const deliveriesTodayCount = useMemo(
    () =>
      purchaseOrders.filter(
        (po) =>
          po.expectedDeliveryDate &&
          po.expectedDeliveryDate.slice(0, 10) === todayStr &&
          ["approved", "sent", "partially_received"].includes(po.status)
      ).length,
    [purchaseOrders, todayStr]
  );

  const overdueOrders = useMemo(() => {
    return purchaseOrders.filter((po) => {
      if (!po.expectedDeliveryDate) return false;
      const isOverdue = po.expectedDeliveryDate.slice(0, 10) < todayStr;
      return isOverdue && ["approved", "sent", "partially_received"].includes(po.status);
    });
  }, [purchaseOrders, todayStr]);

  const overdueCount = overdueOrders.length;

  const moduleStatus = useMemo(() => {
    if (overdueCount >= 3) {
      return { tone: "urgent" as const, label: "Ação Urgente", color: "bg-rose-500 text-white", text: "Existem 3 ou mais entregas em atraso crítico." };
    }
    if (overdueCount > 0 || draftOrdersCount > 2) {
      return { tone: "attention" as const, label: "Atenção Necessária", color: "bg-amber-500 text-white", text: "Entregas pendentes ou rascunhos aguardando aprovação." };
    }
    return { tone: "normal" as const, label: "Operação Normal", color: "bg-emerald-500 text-white", text: "Todos os pedidos e entregas estão em conformidade." };
  }, [overdueCount, draftOrdersCount]);

  // ---------------------------------------------------------------------------
  // 2. Navegação Contextual por Clique nos KPIs
  // ---------------------------------------------------------------------------
  const handleSelectKpiFilter = useCallback((kpiType: KpiFilterType) => {
    setActiveKpiFilter(kpiType);

    switch (kpiType) {
      case "all":
        setStatusFilter("all");
        setDestinationFilter("all");
        setSortField("orderDate");
        setSortDirection("desc");
        toast.info("Tabela redefinida: Mostrando todos os pedidos.");
        break;
      case "active":
        setStatusFilter("all"); // Filtro contextual interno trata pedidos ativos
        setSortField("orderDate");
        setSortDirection("desc");
        toast.info("Navegação KPI: Mostrando Pedidos Ativos.");
        break;
      case "comprado":
        setSortField("totalAmount");
        setSortDirection("desc");
        toast.info("Navegação KPI: Tabela ordenada pelo maior Valor Comprado.");
        break;
      case "recebido":
        setSortField("progressPct");
        setSortDirection("desc");
        toast.info("Navegação KPI: Tabela ordenada por Maior Receção.");
        break;
      case "pendente":
        setStatusFilter("partially_received");
        setSortField("orderDate");
        setSortDirection("desc");
        toast.info("Navegação KPI: Mostrando pedidos com Valor Pendente.");
        break;
      case "entregas":
        setStatusFilter("all");
        setSortField("orderDate");
        setSortDirection("desc");
        toast.info("Navegação KPI: Mostrando pedidos com Entregas Pendentes.");
        break;
    }

    // Scroll suave até a tabela
    setTimeout(() => {
      document.getElementById("tabela-pedidos")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, []);

  // ---------------------------------------------------------------------------
  // 3. Filtragem e Ordenação da Tabela
  // ---------------------------------------------------------------------------
  const filteredOrders = useMemo(() => {
    let result = purchaseOrders.filter((po) => {
      const supp = suppliers.find((s) => s.id === po.supplierId);
      const proj = po.destinationProjectId ? obras.find((o) => o.id === po.destinationProjectId) : null;

      const matchesSearch =
        !searchTerm ||
        po.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (po.supplierReference && po.supplierReference.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (supp && supp.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (proj && proj.nome.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchesStatus = statusFilter === "all" || po.status === statusFilter;
      const matchesDestination = destinationFilter === "all" || po.destinationType === destinationFilter;

      // Filtros contextuais adicionais via KPI
      if (activeKpiFilter === "active") {
        matchesStatus = ["approved", "sent", "partially_received"].includes(po.status);
      } else if (activeKpiFilter === "entregas") {
        matchesStatus = ["approved", "sent", "partially_received"].includes(po.status);
      }

      return matchesSearch && matchesStatus && matchesDestination;
    });

    // Aplicação da Ordenação
    result = [...result].sort((a, b) => {
      if (sortField === "totalAmount") {
        const valA = a.totalAmount || 0;
        const valB = b.totalAmount || 0;
        return sortDirection === "desc" ? valB - valA : valA - valB;
      }
      if (sortField === "progressPct") {
        const itemsA = purchaseOrderItems.filter((i) => i.purchaseOrderId === a.id);
        const itemsB = purchaseOrderItems.filter((i) => i.purchaseOrderId === b.id);
        const orderedA = itemsA.reduce((s, i) => s + (i.orderedPurchaseQuantity || 0), 0);
        const receivedA = itemsA.reduce((s, i) => s + (i.receivedPurchaseQuantity || 0), 0);
        const pctA = orderedA > 0 ? receivedA / orderedA : 0;

        const orderedB = itemsB.reduce((s, i) => s + (i.orderedPurchaseQuantity || 0), 0);
        const receivedB = itemsB.reduce((s, i) => s + (i.receivedPurchaseQuantity || 0), 0);
        const pctB = orderedB > 0 ? receivedB / orderedB : 0;

        return sortDirection === "desc" ? pctB - pctA : pctA - pctB;
      }

      // Default: orderDate
      const dateA = a.orderDate || a.createdAt || "";
      const dateB = b.orderDate || b.createdAt || "";
      return sortDirection === "desc" ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB);
    });

    return result;
  }, [purchaseOrders, suppliers, obras, purchaseOrderItems, searchTerm, statusFilter, destinationFilter, activeKpiFilter, sortField, sortDirection]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDestinationFilter("all");
    setActiveKpiFilter(null);
    setSortField("orderDate");
    setSortDirection("desc");
  };

  const isFiltered = searchTerm !== "" || statusFilter !== "all" || destinationFilter !== "all";

  // Compras Recentes
  const recentOrders = useMemo(() => {
    return [...purchaseOrders]
      .sort((a, b) => (b.orderDate || b.createdAt || "").localeCompare(a.orderDate || a.createdAt || ""))
      .slice(0, 5);
  }, [purchaseOrders]);

  const handleTriggerDuplicate = (poId: string) => {
    const data = prepareDuplicate(poId);
    if (data) {
      setDuplicateData(data);
      setIsDuplicateOpen(true);
    }
  };

  const activePOsForDelivery = useMemo(() => {
    return purchaseOrders.filter((po) =>
      ["approved", "sent", "partially_received"].includes(po.status)
    );
  }, [purchaseOrders]);

  const handleCancelOrder = (poId: string) => {
    if (window.confirm("Tem certeza que deseja cancelar este pedido?")) {
      try {
        cancelPurchaseOrder(poId);
        toast.success("Pedido de compra cancelado.");
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Cabeçalho com Breadcrumbs (com ícones) */}
      <PurchaseHeader
        onNewOrder={() => {
          setOrderToEdit(undefined);
          setIsFormOpen(true);
        }}
      />

      {/* 2. KPIs Clicáveis (Navegação Contextual) */}
      <PurchaseKPICards
        purchaseOrders={purchaseOrders}
        deliveries={deliveries}
        stockMovements={stockMovements}
        activeKpiFilter={activeKpiFilter}
        onSelectKpiFilter={handleSelectKpiFilter}
      />

      {/* 3. Painel de Resumo Operacional */}
      <OperationalSummary
        draftOrdersCount={draftOrdersCount}
        deliveriesTodayCount={deliveriesTodayCount}
        overdueCount={overdueCount}
        suppliers={suppliers}
        moduleStatus={moduleStatus}
      />

      {/* 4. Ações Rápidas Toolbar com menu de Exportar */}
      <QuickActions
        onNewOrder={() => {
          setOrderToEdit(undefined);
          setIsFormOpen(true);
        }}
        onQuickDelivery={() => setIsQuickDeliverySelectorOpen(true)}
        onScrollToTable={() =>
          document.getElementById("tabela-pedidos")?.scrollIntoView({ behavior: "smooth" })
        }
      />

      {/* 5. Widgets (100% Clicáveis) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <DelayedDeliveriesCard
          overdueOrders={overdueOrders}
          suppliers={suppliers}
          obras={obras}
        />
        <RecentPurchasesCard
          recentOrders={recentOrders}
          purchaseOrderItems={purchaseOrderItems}
          suppliers={suppliers}
        />
      </div>

      {/* 6. Gráfico com Empty State inteligente se sem dados */}
      <PurchaseVolumeChart
        purchaseOrders={purchaseOrders}
        onNewOrder={() => {
          setOrderToEdit(undefined);
          setIsFormOpen(true);
        }}
      />

      {/* 7. Pesquisa e Filtros com indicação de KPI Filtro Ativo */}
      <PurchaseFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        destinationFilter={destinationFilter}
        onDestinationChange={setDestinationFilter}
        activeKpiFilter={activeKpiFilter}
        onClearKpiFilter={() => setActiveKpiFilter(null)}
        onClearFilters={handleClearFilters}
        isFiltered={isFiltered}
      />

      {/* 8. Tabela Operacional de Pedidos */}
      <PurchaseTable
        filteredOrders={filteredOrders}
        totalOrdersCount={purchaseOrders.length}
        purchaseOrderItems={purchaseOrderItems}
        suppliers={suppliers}
        obras={obras}
        onNewOrder={() => {
          setOrderToEdit(undefined);
          setIsFormOpen(true);
        }}
        onClearFilters={handleClearFilters}
        onEditOrder={(po) => {
          setOrderToEdit(po);
          setIsFormOpen(true);
        }}
        onRegisterDelivery={(po) => {
          setDeliveryPO(po);
          setIsDeliveryOpen(true);
        }}
        onDuplicateOrder={handleTriggerDuplicate}
        onCancelOrder={handleCancelOrder}
      />

      {/* 9. Diálogos e Modais */}
      {isFormOpen && (
        <PurchaseOrderFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          orderToEdit={orderToEdit}
        />
      )}

      {isDuplicateOpen && (
        <PurchaseOrderFormDialog
          open={isDuplicateOpen}
          onOpenChange={setIsDuplicateOpen}
          initialDuplicateData={duplicateData}
        />
      )}

      {isQuickDeliverySelectorOpen && (
        <Dialog open={isQuickDeliverySelectorOpen} onOpenChange={setIsQuickDeliverySelectorOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-600" />
                Registar Entrega de Fornecedor
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <p className="text-slate-500">
                Selecione o pedido de compra ativo para o qual deseja registar a receção física de materiais:
              </p>

              {activePOsForDelivery.length === 0 ? (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-lg text-amber-800 dark:text-amber-300 text-xs">
                  Não existem pedidos de compra ativos em trânsito ou aguardando entrega no momento.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {activePOsForDelivery.map((po) => {
                    const supp = suppliers.find((s) => s.id === po.supplierId);

                    return (
                      <div
                        key={po.id}
                        onClick={() => {
                          setDeliveryPO(po);
                          setIsQuickDeliverySelectorOpen(false);
                          setIsDeliveryOpen(true);
                        }}
                        className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-emerald-500 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 cursor-pointer transition-all flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {po.orderNumber} — {supp?.name || "Fornecedor"}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Valor: {formatMZN(po.totalAmount)} | Data: {formatDate(po.orderDate)}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-emerald-600" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {isDeliveryOpen && deliveryPO && (
        <DeliveryFormDialog
          open={isDeliveryOpen}
          onOpenChange={(open) => {
            setIsDeliveryOpen(open);
            if (!open) setDeliveryPO(undefined);
          }}
          purchaseOrder={deliveryPO}
        />
      )}
    </div>
  );
}
