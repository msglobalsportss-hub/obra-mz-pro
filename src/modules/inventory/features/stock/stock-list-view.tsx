import React, { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { PageContainer } from "@/components/shared/page-container";
import { InventoryStatusBadge } from "../../components/inventory-status-badge";
import { InventoryFilterBar, FilterOption } from "../../components/inventory-filter-bar";
import { InventoryEmptyState } from "../../components/inventory-empty-state";
import { InventoryPermissionState } from "../../components/inventory-permission-state";
import { useInventoryPermissions } from "../../hooks/use-inventory-permissions";
import { inventoryStoreManager } from "../../store/inventory-store";
import { useObraMZStore } from "@/store/obramz-store";
import { formatMZN } from "@/lib/format";
import { getMaterialDisplay, getLocationDisplay } from "../../utils/inventory-display";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@tanstack/react-router";
import { Boxes, Eye, PackagePlus, ArrowLeftRight, Clock, TrendingDown, HardHat, Building2 } from "lucide-react";
import { NewTransferDialog } from "../transfers/new-transfer-dialog";
import { CreateReservationDialog } from "../reservations/create-reservation-dialog";
import { NewAdjustmentDialog } from "../adjustments/new-adjustment-dialog";

export function StockListView() {
  const permissions = useInventoryPermissions();
  const [storeState, setStoreState] = useState(inventoryStoreManager.getState());

  const materials = useObraMZStore((s) => s.materials || []);
  const warehouses = useObraMZStore((s) => s.warehouses || []);
  const obras = useObraMZStore((s) => s.obras || []);

  // Modos de Vista: material | warehouse | project
  const [viewMode, setViewMode] = useState<"material" | "warehouse" | "project">("material");

  // Filtros & Paginação
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modais de Ação Contextual
  const [openTransferModal, setOpenTransferModal] = useState(false);
  const [openReservationModal, setOpenReservationModal] = useState(false);
  const [openAdjustmentModal, setOpenAdjustmentModal] = useState(false);

  useEffect(() => {
    const unsubscribe = inventoryStoreManager.subscribe((s) => setStoreState(s));
    return () => unsubscribe();
  }, []);

  const allBalances = Object.values(storeState.balances);

  // Opções dinâmicas de localização para o filtro
  const locationOptions: FilterOption[] = Array.from(
    new Set(allBalances.map((b) => b.locationId))
  ).map((loc) => ({
    value: loc,
    label: getLocationDisplay(loc, warehouses, obras).label,
  }));

  const statusOptions: FilterOption[] = [
    { value: "available", label: "Disponível" },
    { value: "low_stock", label: "Stock Baixo" },
    { value: "out_of_stock", label: "Esgotado" },
    { value: "reserved", label: "Com Reserva" },
  ];

  // Aplicar Filtros Combináveis
  const filteredBalances = useMemo(() => {
    return allBalances.filter((b) => {
      const matDisplay = getMaterialDisplay(b.materialId, materials);
      const locDisplay = getLocationDisplay(b.locationId, warehouses, obras);

      // 1. Pesquisa por Nome / SKU / Localização
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchMat = matDisplay.name.toLowerCase().includes(q) || matDisplay.sku.toLowerCase().includes(q);
        const matchLoc = locDisplay.label.toLowerCase().includes(q);
        if (!matchMat && !matchLoc) return false;
      }

      // 2. Filtro de Modo de Vista (Por Armazém vs Por Obra)
      if (viewMode === "warehouse" && locDisplay.type !== "warehouse") return false;
      if (viewMode === "project" && locDisplay.type !== "project") return false;

      // 3. Filtro de Localização
      if (locationFilter !== "ALL" && b.locationId !== locationFilter) {
        return false;
      }

      // 4. Filtro de Estado
      if (statusFilter === "available" && b.availableQuantity <= 0) return false;
      if (statusFilter === "low_stock" && (b.availableQuantity <= 0 || b.availableQuantity > 10))
        return false;
      if (statusFilter === "out_of_stock" && b.availableQuantity > 0) return false;
      if (statusFilter === "reserved" && b.reservedQuantity <= 0) return false;

      return true;
    });
  }, [allBalances, searchQuery, viewMode, locationFilter, statusFilter, materials, warehouses, obras]);

  // Paginação
  const totalPages = Math.max(1, Math.ceil(filteredBalances.length / pageSize));
  const paginatedBalances = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBalances.slice(start, start + pageSize);
  }, [filteredBalances, currentPage, pageSize]);

  if (!permissions.canView) {
    return <InventoryPermissionState />;
  }

  const hasActiveFilters = searchQuery !== "" || locationFilter !== "ALL" || statusFilter !== "ALL" || viewMode !== "material";

  const resetFilters = () => {
    setSearchQuery("");
    setLocationFilter("ALL");
    setStatusFilter("ALL");
    setViewMode("material");
    setCurrentPage(1);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Saldos de Stock de Materiais"
        description="Listagem completa de saldos com suporte a WAC, reservas e alternância de vistas por entidade"
        breadcrumbs={[
          { label: "Início", href: "/app" },
          { label: "Inventário", href: "/app/inventory" },
          { label: "Stock" },
        ]}
      />

      {/* SELETOR DE MODOS DE VISTA */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 bg-muted/40 p-2 rounded-lg border border-border/60">
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <span className="text-muted-foreground mr-2">Modo de Vista:</span>
          <Button
            size="xs"
            variant={viewMode === "material" ? "default" : "outline"}
            onClick={() => { setViewMode("material"); setCurrentPage(1); }}
            className="h-7 text-xs gap-1"
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Por Material</span>
          </Button>
          <Button
            size="xs"
            variant={viewMode === "warehouse" ? "default" : "outline"}
            onClick={() => { setViewMode("warehouse"); setCurrentPage(1); }}
            className="h-7 text-xs gap-1"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Por Armazém</span>
          </Button>
          <Button
            size="xs"
            variant={viewMode === "project" ? "default" : "outline"}
            onClick={() => { setViewMode("project"); setCurrentPage(1); }}
            className="h-7 text-xs gap-1"
          >
            <HardHat className="w-3.5 h-3.5" />
            <span>Por Obra</span>
          </Button>
        </div>

        {/* Links Contextuais de ERP */}
        <div className="flex items-center gap-2 text-xs">
          {viewMode === "warehouse" && (
            <Link to="/app/empresa/armazens" className="text-primary hover:underline font-medium flex items-center gap-1">
              <span>Gerir Armazéns {"->"}</span>
            </Link>
          )}
          {viewMode === "project" && (
            <Link to="/app/obras" className="text-primary hover:underline font-medium flex items-center gap-1">
              <span>Gerir Obras {"->"}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Barra de Filtros */}
      <InventoryFilterBar
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setCurrentPage(1);
        }}
        locationFilter={locationFilter}
        onLocationChange={(loc) => {
          setLocationFilter(loc);
          setCurrentPage(1);
        }}
        locationOptions={locationOptions}
        statusFilter={statusFilter}
        onStatusChange={(st) => {
          setStatusFilter(st);
          setCurrentPage(1);
        }}
        statusOptions={statusOptions}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={resetFilters}
      />

      {/* Tabela Desktop / Cartões Mobile */}
      {filteredBalances.length === 0 ? (
        <InventoryEmptyState
          title="Nenhum saldo encontrado"
          description={
            materials.length === 0
              ? "Ainda não existem materiais cadastrados no catálogo da empresa."
              : "Não existem saldos de stock que correspondam aos filtros e critérios selecionados."
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Limpar Filtros
              </Button>
            ) : materials.length === 0 ? (
              <Link to="/app/materiais">
                <Button size="sm">Cadastrar Materiais</Button>
              </Link>
            ) : null
          }
        />
      ) : (
        <>
          <div className="hidden md:block">
            <Card className="border-border/60">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Material / SKU</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead className="text-right">Físico (onHand)</TableHead>
                      <TableHead className="text-right">Reservado</TableHead>
                      <TableHead className="text-right">Disponível</TableHead>
                      <TableHead className="text-right">WAC (MZN)</TableHead>
                      <TableHead className="text-right">Valor Total</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Ação Contextual</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedBalances.map((b) => {
                      const matDisplay = getMaterialDisplay(b.materialId, materials);
                      const locDisplay = getLocationDisplay(b.locationId, warehouses, obras);

                      const status =
                        b.availableQuantity <= 0
                          ? "out_of_stock"
                          : b.availableQuantity <= 10
                            ? "low_stock"
                            : b.reservedQuantity > 0
                              ? "reserved"
                              : "available";

                      return (
                        <TableRow key={b.id} className="hover:bg-muted/30">
                          <TableCell>
                            <div className="font-semibold text-foreground">{matDisplay.name}</div>
                            <div className="text-[11px] text-muted-foreground font-mono">{matDisplay.sku}</div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs font-medium">{locDisplay.label}</span>
                            {locDisplay.type === "project" && (
                              <Badge variant="outline" className="text-[9px] ml-1.5 bg-amber-500/10 text-amber-600">
                                Obra
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium">
                            {b.onHandQuantity.toLocaleString()} {matDisplay.unit}
                          </TableCell>
                          <TableCell className="text-right font-mono text-muted-foreground">
                            {b.reservedQuantity.toLocaleString()} {matDisplay.unit}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold text-emerald-600">
                            {b.availableQuantity.toLocaleString()} {matDisplay.unit}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {formatMZN(b.averageCost)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold">
                            {formatMZN(b.totalValue)}
                          </TableCell>
                          <TableCell>
                            <InventoryStatusBadge status={status} />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Link
                                to="/app/inventory/materials/$materialId"
                                params={{ materialId: b.materialId }}
                              >
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                  title="Ver Detalhes do Material"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </Link>

                              {permissions.canTransfer && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setOpenTransferModal(true)}
                                  className="h-8 w-8 text-blue-600 hover:bg-blue-500/10"
                                  title="Transferir Stock"
                                >
                                  <ArrowLeftRight className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 text-xs text-muted-foreground">
              <span>
                A mostrar {paginatedBalances.length} de {filteredBalances.length} saldos
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <span>
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Seguinte
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modais Contextuais */}
      {openTransferModal && (
        <NewTransferDialog open={openTransferModal} onOpenChange={setOpenTransferModal} />
      )}
      {openReservationModal && (
        <CreateReservationDialog open={openReservationModal} onOpenChange={setOpenReservationModal} />
      )}
      {openAdjustmentModal && (
        <NewAdjustmentDialog open={openAdjustmentModal} onOpenChange={setOpenAdjustmentModal} />
      )}
    </PageContainer>
  );
}
