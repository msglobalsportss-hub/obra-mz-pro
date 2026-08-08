import React, { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { PageContainer } from "@/components/shared/page-container";
import { InventoryEmptyState } from "../../components/inventory-empty-state";
import { InventoryPermissionState } from "../../components/inventory-permission-state";
import { useInventoryPermissions } from "../../hooks/use-inventory-permissions";
import { useObraMZStore } from "@/store/obramz-store";
import { useDeliveriesUiStateStore } from "../../store/deliveries-ui-state";
import { formatDate } from "@/lib/format";
import { getSupplierDisplay, getLocationDisplay } from "../../utils/inventory-display";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Truck,
  CheckCircle2,
  Building2,
  HardHat,
  Search,
  Filter,
  MoreVertical,
  Eye,
  AlertTriangle,
  Clock,
  Paperclip,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  X,
  PlusCircle,
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { DeliveryReceptionDialog } from "../receipts/delivery-reception-dialog";
import { DeliveryDocumentsModal } from "./delivery-documents-modal";
import { DeliveryOperationalBanner } from "./delivery-operational-banner";
import type { Delivery, DeliveryStatus } from "@/lib/purchases";
import { toast } from "sonner";

type StockProcessingStatus = "processed" | "not_updated" | "processing" | "unprocessed";

export function DeliveriesReceiptsView() {
  const navigate = useNavigate();
  const permissions = useInventoryPermissions();

  const deliveries = useObraMZStore((s) => s.deliveries || []);
  const purchaseOrders = useObraMZStore((s) => s.purchaseOrders || []);
  const deliveryItems = useObraMZStore((s) => s.deliveryItems || []);
  const suppliers = useObraMZStore((s) => s.suppliers || []);
  const warehouses = useObraMZStore((s) => s.warehouses || []);
  const obras = useObraMZStore((s) => s.obras || []);
  const stockMovements = useObraMZStore((s) => s.stockMovements || []);

  const [selectedDeliveryToReceive, setSelectedDeliveryToReceive] = useState<Delivery | null>(null);
  const [selectedDeliveryForDocs, setSelectedDeliveryForDocs] = useState<Delivery | null>(null);

  // Zustand Store de Preservação de Contexto da UI
  const {
    searchTerm,
    physicalStatusFilter,
    stockStatusFilter,
    supplierFilter,
    destTypeFilter,
    warehouseFilter,
    projectFilter,
    overdueOnly,
    divergentOnly,
    partialOnly,
    missingDocsOnly,
    showAdvancedFilters,
    currentPage,
    itemsPerPage,
    scrollY,
    setSearchTerm,
    setPhysicalStatusFilter,
    setStockStatusFilter,
    setSupplierFilter,
    setDestTypeFilter,
    setWarehouseFilter,
    setProjectFilter,
    setOverdueOnly,
    setDivergentOnly,
    setPartialOnly,
    setMissingDocsOnly,
    setShowAdvancedFilters,
    setCurrentPage,
    setScrollY,
    clearFilters,
  } = useDeliveriesUiStateStore();

  // Restaurar e Guardar Posição do Scroll
  useEffect(() => {
    window.scrollTo(0, scrollY);
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrollY, setScrollY]);

  if (!permissions.canViewDeliveries) {
    return <InventoryPermissionState />;
  }

  const poMap = new Map(purchaseOrders.map((p) => [p.id, p]));

  // Cálculo de Órfãos e Inconsistências
  const orphanCount = deliveries.filter((d) => {
    if (d.status !== "confirmed" && d.status !== "received") return false;
    const hasMovements = stockMovements.some(
      (m) => m.referenceId === d.deliveryNumber || m.correlationId === d.id || (d.movementIds && d.movementIds.includes(m.id))
    );
    return !hasMovements;
  }).length;

  const unprocessedCount = deliveries.filter(
    (d) => (d.status === "received" || d.status === "partially_received") && (!d.movementIds || d.movementIds.length === 0)
  ).length;

  // 8 KPIs Operacionais
  const kpis = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];

    const pending = deliveries.filter((d) => d.status === "draft" || d.status === "expected" || d.status === "in_transit");
    const today = deliveries.filter((d) => d.deliveryDate.startsWith(todayStr));
    const inInspection = deliveries.filter((d) => d.status === "in_inspection" || d.status === "arrived");
    const partial = deliveries.filter((d) => d.status === "partially_received");
    const receivedToday = deliveries.filter((d) => (d.status === "received" || d.status === "confirmed") && d.updatedAt.startsWith(todayStr));
    const divergent = deliveries.filter((d) => d.status === "received_with_divergence");
    const overdue = deliveries.filter((d) => {
      if (d.status === "confirmed" || d.status === "cancelled" || d.status === "received") return false;
      return new Date(d.deliveryDate) < new Date();
    });
    const siteDirect = deliveries.filter((d) => d.destinationType === "project_site" || d.destinationType === "project");

    return {
      pending: pending.length,
      today: today.length,
      inInspection: inInspection.length,
      partial: partial.length,
      receivedToday: receivedToday.length,
      divergent: divergent.length,
      overdue: overdue.length,
      siteDirect: siteDirect.length,
    };
  }, [deliveries]);

  // Regra do Estado do Stock
  const getStockStatus = (d: Delivery): StockProcessingStatus => {
    const hasMovements =
      (d.movementIds && d.movementIds.length > 0) ||
      stockMovements.some((m) => m.referenceId === d.deliveryNumber || m.correlationId === d.id);

    if (hasMovements) return "processed";
    if (d.status === "confirmed" || d.status === "received") return "not_updated";
    if (d.status === "partially_received" || d.status === "in_inspection") return "processing";
    return "unprocessed";
  };

  // Estado Físico Calculado
  const getCalculatedPhysicalStatus = (d: Delivery): DeliveryStatus => {
    const items = deliveryItems.filter((di) => di.deliveryId === d.id);
    if (items.length === 0) return d.status;

    const completedItemsCount = items.filter((i) => (i.quantityAccepted || i.quantityDelivered || 0) >= (i.quantityExpected || 1)).length;
    const progressPct = Math.round((completedItemsCount / items.length) * 100);

    const hasMovements =
      (d.movementIds && d.movementIds.length > 0) ||
      stockMovements.some((m) => m.referenceId === d.deliveryNumber || m.correlationId === d.id);

    if (progressPct === 0) return "expected";
    if (progressPct > 0 && progressPct < 100) return "partially_received";
    if (progressPct >= 100 && !hasMovements) return "received";
    if (progressPct >= 100 && hasMovements) return "confirmed";

    return d.status;
  };

  // Filtros Combináveis
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((d) => {
      const po = poMap.get(d.purchaseOrderId);
      const sup = po ? getSupplierDisplay(po.supplierId, suppliers) : { name: "", nuit: "" };
      const stockStat = getStockStatus(d);
      const physStat = getCalculatedPhysicalStatus(d);

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesNum = d.deliveryNumber.toLowerCase().includes(term);
        const matchesNote = (d.deliveryNoteNumber || "").toLowerCase().includes(term);
        const matchesPO = (po?.orderNumber || d.purchaseOrderId).toLowerCase().includes(term);
        const matchesSup = sup.name.toLowerCase().includes(term);
        if (!matchesNum && !matchesNote && !matchesPO && !matchesSup) return false;
      }

      if (physicalStatusFilter !== "all" && physStat !== physicalStatusFilter) return false;
      if (stockStatusFilter !== "all" && stockStat !== stockStatusFilter) return false;
      if (supplierFilter !== "all" && d.supplierId !== supplierFilter && po?.supplierId !== supplierFilter) return false;
      if (destTypeFilter !== "all" && d.destinationType !== destTypeFilter) return false;
      if (warehouseFilter !== "all" && d.destinationWarehouseId !== warehouseFilter) return false;
      if (projectFilter !== "all" && d.destinationProjectId !== projectFilter) return false;

      if (overdueOnly) {
        const isOverdue = d.status !== "confirmed" && d.status !== "cancelled" && new Date(d.deliveryDate) < new Date();
        if (!isOverdue) return false;
      }

      if (divergentOnly && d.status !== "received_with_divergence") return false;
      if (partialOnly && physStat !== "partially_received") return false;
      if (missingDocsOnly && (!d.documents || d.documents.length === 0) && !d.deliveryNoteNumber) return false;

      return true;
    });
  }, [
    deliveries,
    searchTerm,
    physicalStatusFilter,
    stockStatusFilter,
    supplierFilter,
    destTypeFilter,
    warehouseFilter,
    projectFilter,
    overdueOnly,
    divergentOnly,
    partialOnly,
    missingDocsOnly,
    poMap,
    suppliers,
    stockMovements,
  ]);

  const activeFiltersCount = [
    physicalStatusFilter !== "all",
    stockStatusFilter !== "all",
    supplierFilter !== "all",
    destTypeFilter !== "all",
    warehouseFilter !== "all",
    projectFilter !== "all",
    overdueOnly,
    divergentOnly,
    partialOnly,
    missingDocsOnly,
    Boolean(searchTerm),
  ].filter(Boolean).length;

  const totalPages = Math.ceil(filteredDeliveries.length / itemsPerPage) || 1;
  const paginatedDeliveries = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDeliveries.slice(start, start + itemsPerPage);
  }, [filteredDeliveries, currentPage, itemsPerPage]);

  const getPhysicalStatusBadge = (status: DeliveryStatus) => {
    const map: Record<DeliveryStatus, { label: string; color: string }> = {
      expected: { label: "Aguardando receção", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
      in_transit: { label: "Em Trânsito", color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" },
      arrived: { label: "Chegada", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
      in_inspection: { label: "Em Conferência", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
      partially_received: { label: "Parcialmente recebida", color: "bg-amber-600/10 text-amber-700 border-amber-600/20" },
      received: { label: "Recebida", color: "bg-teal-500/10 text-teal-600 border-teal-500/20" },
      received_with_divergence: { label: "Com Divergência", color: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
      confirmed: { label: "Confirmada", color: "bg-emerald-600 text-white" },
      rejected: { label: "Rejeitada", color: "bg-rose-600 text-white" },
      cancelled: { label: "Cancelada", color: "bg-slate-500/10 text-slate-600 border-slate-500/20" },
      draft: { label: "Aguardando receção", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    };

    const cfg = map[status] || map.draft;
    return (
      <Badge variant="outline" className={`text-[10px] ${cfg.color}`}>
        {cfg.label}
      </Badge>
    );
  };

  const getStockStatusBadge = (status: StockProcessingStatus) => {
    const map: Record<StockProcessingStatus, { label: string; color: string }> = {
      unprocessed: { label: "Não processado", color: "bg-slate-500/10 text-slate-600 border-slate-500/20" },
      processing: { label: "Em processamento", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
      processed: { label: "Processado", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
      not_updated: { label: "Stock não atualizado", color: "bg-amber-600 text-white" },
    };
    const cfg = map[status];
    return (
      <Badge variant="outline" className={`text-[10px] ${cfg.color}`}>
        {cfg.label}
      </Badge>
    );
  };

  return (
    <PageContainer>
      <PageHeader
        title="Centro Operacional de Receções & Entregas"
        description="Gestão de conferência física, receções por lote, rasto de documentos e atualização do stock"
        breadcrumbs={[
          { label: "Início", href: "/app" },
          { label: "Inventário", href: "/app/inventory" },
          { label: "Entregas & Receções" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                const pendingDel = deliveries.find((d) => d.status === "draft" || d.status === "expected" || d.status === "in_inspection");
                if (pendingDel) {
                  setSelectedDeliveryToReceive(pendingDel);
                } else {
                  toast.info("Nenhuma entrega pendente aguardando conferência imediata.");
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Receber entrega pendente</span>
            </Button>
          </div>
        }
      />

      {/* Banner Operacional */}
      <div className="mb-6 space-y-4">
        <DeliveryOperationalBanner
          orphanCount={orphanCount}
          unprocessedCount={unprocessedCount}
          onFilterOrphans={() => {
            setStockStatusFilter("not_updated");
            setShowAdvancedFilters(true);
          }}
        />

        {/* Grid de 8 Cartões Operacionais */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          <Card className="p-2 bg-background border-border/60">
            <span className="text-[10px] text-muted-foreground block font-medium">Pendentes</span>
            <span className="text-sm font-bold text-foreground">{kpis.pending}</span>
          </Card>
          <Card className="p-2 bg-background border-border/60">
            <span className="text-[10px] text-muted-foreground block font-medium">Esperadas Hoje</span>
            <span className="text-sm font-bold text-blue-600">{kpis.today}</span>
          </Card>
          <Card className="p-2 bg-background border-border/60">
            <span className="text-[10px] text-muted-foreground block font-medium">Em Conferência</span>
            <span className="text-sm font-bold text-purple-600">{kpis.inInspection}</span>
          </Card>
          <Card className="p-2 bg-background border-border/60">
            <span className="text-[10px] text-muted-foreground block font-medium">Parciais</span>
            <span className="text-sm font-bold text-amber-600">{kpis.partial}</span>
          </Card>
          <Card className="p-2 bg-background border-border/60">
            <span className="text-[10px] text-muted-foreground block font-medium">Recebidas Hoje</span>
            <span className="text-sm font-bold text-emerald-600">{kpis.receivedToday}</span>
          </Card>
          <Card className="p-2 bg-background border-border/60">
            <span className="text-[10px] text-muted-foreground block font-medium">Divergências</span>
            <span className={`text-sm font-bold ${kpis.divergent > 0 ? "text-rose-600" : "text-emerald-600"}`}>
              {kpis.divergent}
            </span>
          </Card>
          <Card className="p-2 bg-background border-border/60">
            <span className="text-[10px] text-muted-foreground block font-medium">Atrasadas</span>
            <span className={`text-sm font-bold ${kpis.overdue > 0 ? "text-rose-600" : "text-emerald-600"}`}>
              {kpis.overdue}
            </span>
          </Card>
          <Card className="p-2 bg-background border-border/60">
            <span className="text-[10px] text-muted-foreground block font-medium">Diretas p/ Obra</span>
            <span className="text-sm font-bold text-teal-600">{kpis.siteDirect}</span>
          </Card>
        </div>
      </div>

      {/* Barra de Filtros Combináveis */}
      <Card className="p-3.5 mb-4 border-border/60 bg-card space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por N.º Entrega, Guia, PO ou Fornecedor..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={showAdvancedFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="h-9 text-xs gap-1.5"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Mais Filtros</span>
              {activeFiltersCount > 0 && (
                <Badge className="ml-1 px-1.5 py-0.2 text-[10px] bg-primary text-primary-foreground">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>

            {activeFiltersCount > 0 && (
              <Button size="sm" variant="ghost" onClick={clearFilters} className="h-9 text-xs gap-1 text-muted-foreground">
                <X className="w-3.5 h-3.5" />
                <span>Limpar</span>
              </Button>
            )}

            <Badge variant="secondary" className="h-9 text-xs font-mono px-3">
              {filteredDeliveries.length} resultados
            </Badge>
          </div>
        </div>

        {/* Painel Expansível de Filtros */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="space-y-1">
              <span className="text-[11px] text-muted-foreground font-semibold">Estado da Entrega</span>
              <Select value={physicalStatusFilter} onValueChange={setPhysicalStatusFilter}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Estados</SelectItem>
                  <SelectItem value="expected">Aguardando receção</SelectItem>
                  <SelectItem value="in_transit">Em Trânsito</SelectItem>
                  <SelectItem value="arrived">Chegada</SelectItem>
                  <SelectItem value="in_inspection">Em Conferência</SelectItem>
                  <SelectItem value="partially_received">Parcialmente recebida</SelectItem>
                  <SelectItem value="received">Recebida</SelectItem>
                  <SelectItem value="received_with_divergence">Com Divergência</SelectItem>
                  <SelectItem value="confirmed">Confirmada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-muted-foreground font-semibold">Atualização do Stock</span>
              <Select value={stockStatusFilter} onValueChange={setStockStatusFilter}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Estados</SelectItem>
                  <SelectItem value="processed">Processado</SelectItem>
                  <SelectItem value="not_updated">Stock não atualizado</SelectItem>
                  <SelectItem value="processing">Em processamento</SelectItem>
                  <SelectItem value="unprocessed">Não processado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-muted-foreground font-semibold">Tipo de Destino</span>
              <Select value={destTypeFilter} onValueChange={setDestTypeFilter}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Destinos</SelectItem>
                  <SelectItem value="central_stock">🏢 Armazém Central</SelectItem>
                  <SelectItem value="project">🏗 Obra / Estaleiro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-4">
              <Button size="xs" variant={overdueOnly ? "default" : "outline"} onClick={() => setOverdueOnly(!overdueOnly)}>
                Atrasadas
              </Button>
              <Button size="xs" variant={divergentOnly ? "default" : "outline"} onClick={() => setDivergentOnly(!divergentOnly)}>
                Divergências
              </Button>
              <Button size="xs" variant={missingDocsOnly ? "default" : "outline"} onClick={() => setMissingDocsOnly(!missingDocsOnly)}>
                Faltam Docs
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Tabela Rica Responsiva com Navegação Real */}
      {filteredDeliveries.length === 0 ? (
        <Card className="p-8 text-center space-y-3">
          <InventoryEmptyState
            title="Nenhuma entrega corresponde aos filtros"
            description="Ajuste os critérios de busca ou limpe os filtros para visualizar registos."
          />
          {activeFiltersCount > 0 && (
            <Button size="sm" variant="outline" onClick={clearFilters} className="mx-auto">
              Limpar Filtros ({activeFiltersCount})
            </Button>
          )}
        </Card>
      ) : (
        <Card className="border-border/60 overflow-hidden space-y-2">
          {/* Versão Desktop */}
          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[140px] min-w-[140px]">N.º Entrega</TableHead>
                  <TableHead>Pedido de Compra</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Data Prevista</TableHead>
                  <TableHead className="text-right">Progresso</TableHead>
                  <TableHead>Docs</TableHead>
                  <TableHead>Estado da Entrega</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDeliveries.map((d) => {
                  const po = poMap.get(d.purchaseOrderId);
                  const sup = po ? getSupplierDisplay(po.supplierId, suppliers) : { name: "—", nuit: "" };

                  const isWarehouse = d.destinationType === "central_stock";
                  const destLocationId = isWarehouse
                    ? d.destinationWarehouseId || "WH-MAIN"
                    : `LOC-PROJ-${d.destinationProjectId || "PROJ-1"}`;
                  const destDisplay = getLocationDisplay(destLocationId, warehouses, obras);

                  // Progresso por ITENS
                  const items = deliveryItems.filter((di) => di.deliveryId === d.id);
                  const totalItemsCount = items.length || 1;
                  const completedItemsCount = items.filter((i) => (i.quantityAccepted || i.quantityDelivered || 0) >= (i.quantityExpected || 1)).length;
                  const progressPct = Math.round((completedItemsCount / totalItemsCount) * 100);

                  const realDocCount = d.documents?.length || (d.deliveryNoteNumber ? 1 : 0);
                  const stockStat = getStockStatus(d);
                  const physStat = getCalculatedPhysicalStatus(d);

                  return (
                    <TableRow key={d.id} className="hover:bg-muted/30 text-xs">
                      {/* Item 1: N.º Entrega como Link Funcional */}
                      <TableCell className="font-mono font-bold w-[140px] min-w-[140px] whitespace-nowrap">
                        <Link
                          to="/app/inventory/deliveries/$deliveryId"
                          params={{ deliveryId: d.id }}
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          <span>{d.deliveryNumber}</span>
                          <ArrowUpRight className="w-3 h-3 text-muted-foreground shrink-0" />
                        </Link>
                        {d.deliveryNoteNumber && (
                          <span className="block text-[10px] text-muted-foreground font-normal truncate">Guia: {d.deliveryNoteNumber}</span>
                        )}
                      </TableCell>

                      {/* Item 4: Pedido de Compra Clicável Direto */}
                      <TableCell className="font-mono whitespace-nowrap">
                        {po ? (
                          <Link to="/app/compras/$purchaseOrderId" params={{ purchaseOrderId: po.id }} className="text-primary hover:underline font-semibold">
                            {po.orderNumber}
                          </Link>
                        ) : (
                          d.purchaseOrderId
                        )}
                      </TableCell>

                      {/* Item 5: Fornecedor Clicável Direto */}
                      <TableCell className="font-medium truncate max-w-[160px]">
                        <Link to="/app/fornecedores" className="text-primary hover:underline font-medium">
                          {sup.name}
                        </Link>
                      </TableCell>

                      {/* Item 6: Destino Clicável Direto (Armazém ou Obra) */}
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {isWarehouse ? (
                            <Link to="/app/empresa/armazens" className="flex items-center gap-1 text-primary hover:underline font-medium">
                              <Building2 className="w-3 h-3 text-blue-500 shrink-0" />
                              <span className="truncate max-w-[120px]">{destDisplay.label}</span>
                            </Link>
                          ) : (
                            <Link
                              to="/app/obras/$id"
                              params={{ id: d.destinationProjectId || "1" }}
                              className="flex items-center gap-1 text-primary hover:underline font-medium"
                            >
                              <HardHat className="w-3 h-3 text-amber-500 shrink-0" />
                              <span className="truncate max-w-[120px]">{destDisplay.label}</span>
                            </Link>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-muted-foreground font-mono whitespace-nowrap">{formatDate(d.deliveryDate)}</TableCell>

                      <TableCell className="text-right whitespace-nowrap">
                        <div className="space-y-1 w-24 ml-auto">
                          <div className="text-[10px] font-mono font-semibold">
                            {completedItemsCount} de {totalItemsCount} itens
                          </div>
                          <Progress value={progressPct} className="h-1.5" />
                        </div>
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        <Badge
                          variant="outline"
                          onClick={() => setSelectedDeliveryForDocs(d)}
                          className="text-[10px] gap-1 cursor-pointer hover:bg-muted transition-colors"
                        >
                          <Paperclip className="w-2.5 h-2.5" />
                          <span>{realDocCount > 0 ? `${realDocCount} doc(s)` : "Sem documentos"}</span>
                        </Badge>
                      </TableCell>

                      <TableCell className="whitespace-nowrap">{getPhysicalStatusBadge(physStat)}</TableCell>
                      <TableCell className="whitespace-nowrap">{getStockStatusBadge(stockStat)}</TableCell>

                      {/* Item 2: Botão Visível "Ver detalhes" e Menu de Ações Secundárias Reais */}
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="xs"
                            variant="outline"
                            asChild
                            className="h-7 text-[11px] gap-1"
                          >
                            <Link to="/app/inventory/deliveries/$deliveryId" params={{ deliveryId: d.id }}>
                              <Eye className="w-3 h-3" />
                              <span>Ver detalhes</span>
                            </Link>
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="xs" variant="ghost" className="h-7 w-7 p-0">
                                <MoreVertical className="w-3.5 h-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="text-xs">
                              <DropdownMenuLabel>Ações Secundárias</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => setSelectedDeliveryForDocs(d)}>
                                <Paperclip className="w-3.5 h-3.5 mr-2" /> Ver documentos
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate({ to: "/app/inventory/movements" })}>
                                <ArrowUpRight className="w-3.5 h-3.5 mr-2" /> Histórico de movimentos
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Versão Mobile / Tablet (Cartões Operacionais com Links Reais) */}
          <div className="lg:hidden p-3 space-y-3">
            {paginatedDeliveries.map((d) => {
              const po = poMap.get(d.purchaseOrderId);
              const sup = po ? getSupplierDisplay(po.supplierId, suppliers) : { name: "—", nuit: "" };
              const physStat = getCalculatedPhysicalStatus(d);

              return (
                <div key={d.id} className="p-3 border rounded-lg bg-background space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <Link to="/app/inventory/deliveries/$deliveryId" params={{ deliveryId: d.id }} className="font-mono font-bold text-primary hover:underline">
                      {d.deliveryNumber}
                    </Link>
                    {getPhysicalStatusBadge(physStat)}
                  </div>
                  <div className="text-muted-foreground font-medium">{sup.name}</div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t">
                    <span>Prevista: {formatDate(d.deliveryDate)}</span>
                    <Button size="xs" asChild>
                      <Link to="/app/inventory/deliveries/$deliveryId" params={{ deliveryId: d.id }}>
                        Ver detalhes
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paginação */}
          <div className="p-3 border-t bg-muted/20 flex items-center justify-between text-xs">
            <div className="text-muted-foreground">
              Página {currentPage} de {totalPages} ({filteredDeliveries.length} entregas)
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="xs"
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Anterior
              </Button>
              <Button
                size="xs"
                variant="outline"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              >
                Próximo <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Modal de Receção */}
      {selectedDeliveryToReceive && (
        <DeliveryReceptionDialog
          open={!!selectedDeliveryToReceive}
          onOpenChange={(open) => !open && setSelectedDeliveryToReceive(null)}
          delivery={selectedDeliveryToReceive}
        />
      )}

      {/* Modal Real de Gestão de Documentos */}
      {selectedDeliveryForDocs && (
        <DeliveryDocumentsModal
          open={!!selectedDeliveryForDocs}
          onOpenChange={(open) => !open && setSelectedDeliveryForDocs(null)}
          deliveryNumber={selectedDeliveryForDocs.deliveryNumber}
          documents={selectedDeliveryForDocs.documents || []}
          onAddDocument={(doc) => {
            selectedDeliveryForDocs.documents = [...(selectedDeliveryForDocs.documents || []), doc];
          }}
          onRemoveDocument={(docId) => {
            selectedDeliveryForDocs.documents = (selectedDeliveryForDocs.documents || []).filter((d) => d.id !== docId);
          }}
          canManageDocs={permissions.canManageDocs}
        />
      )}
    </PageContainer>
  );
}
