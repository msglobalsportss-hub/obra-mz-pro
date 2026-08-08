import React, { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { PageContainer } from "@/components/shared/page-container";
import { InventoryStatusBadge } from "../../components/inventory-status-badge";
import { InventoryFilterBar, FilterOption } from "../../components/inventory-filter-bar";
import { InventoryEmptyState } from "../../components/inventory-empty-state";
import { InventoryPermissionState } from "../../components/inventory-permission-state";
import { MovementDetailsDialog } from "./movement-details-dialog";
import { useInventoryPermissions } from "../../hooks/use-inventory-permissions";
import { inventoryStoreManager } from "../../store/inventory-store";
import { useObraMZStore } from "@/store/obramz-store";
import { formatMZN, formatDate } from "@/lib/format";
import { getMaterialDisplay, getLocationDisplay } from "../../utils/inventory-display";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Clock, Wrench, HardHat } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { StockMovementView } from "../../store/inventory-store.types";

export function MovementsHistoryView() {
  const permissions = useInventoryPermissions();
  const [storeState, setStoreState] = useState(inventoryStoreManager.getState());

  const materials = useObraMZStore((s) => s.materials || []);
  const warehouses = useObraMZStore((s) => s.warehouses || []);
  const obras = useObraMZStore((s) => s.obras || []);

  const [selectedMovement, setSelectedMovement] = useState<StockMovementView | null>(null);

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const unsubscribe = inventoryStoreManager.subscribe((s) => setStoreState(s));
    return () => unsubscribe();
  }, []);

  const movements = storeState.movements;

  const typeOptions: FilterOption[] = [
    { value: "receipt", label: "🟩 Receção / Entradas" },
    { value: "issue", label: "🟥 Saídas / Consumo" },
    { value: "transfer", label: "🟦 Transferências" },
    { value: "adjustment", label: "🟣 Ajustes Físicos" },
    { value: "reserve", label: "🟪 Reservas de Stock" },
  ];

  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      const matDisplay = getMaterialDisplay(m.materialId, materials);
      const destDisplay = getLocationDisplay(m.destinationLocationId || m.sourceLocationId, warehouses, obras);

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchMat = matDisplay.name.toLowerCase().includes(q) || matDisplay.sku.toLowerCase().includes(q);
        const matchRef = (m.referenceId || "").toLowerCase().includes(q);
        const matchLoc = destDisplay.label.toLowerCase().includes(q);
        if (!matchMat && !matchRef && !matchLoc) return false;
      }

      if (typeFilter !== "ALL" && !m.movementType.includes(typeFilter)) {
        return false;
      }

      return true;
    });
  }, [movements, searchQuery, typeFilter, materials, warehouses, obras]);

  const totalPages = Math.max(1, Math.ceil(filteredMovements.length / pageSize));
  const paginatedMovements = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMovements.slice(start, start + pageSize);
  }, [filteredMovements, currentPage, pageSize]);

  if (!permissions.canView) {
    return <InventoryPermissionState />;
  }

  // Função para renderizar Badges Visuais diferenciados por tipo
  const renderMovementTypeBadge = (type: string) => {
    if (type.includes("receipt") || type.includes("in")) {
      return (
        <Badge variant="outline" className="text-[10px] gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-medium">
          <ArrowDownLeft className="w-3 h-3" />
          <span>Entrada</span>
        </Badge>
      );
    }
    if (type.includes("consumption")) {
      return (
        <Badge variant="outline" className="text-[10px] gap-1 bg-amber-500/10 text-amber-600 border-amber-500/20 font-medium">
          <HardHat className="w-3 h-3" />
          <span>Consumo Obra</span>
        </Badge>
      );
    }
    if (type.includes("issue") || type.includes("out")) {
      return (
        <Badge variant="outline" className="text-[10px] gap-1 bg-rose-500/10 text-rose-600 border-rose-500/20 font-medium">
          <ArrowUpRight className="w-3 h-3" />
          <span>Saída</span>
        </Badge>
      );
    }
    if (type.includes("transfer")) {
      return (
        <Badge variant="outline" className="text-[10px] gap-1 bg-blue-500/10 text-blue-600 border-blue-500/20 font-medium">
          <ArrowLeftRight className="w-3 h-3" />
          <span>Transferência</span>
        </Badge>
      );
    }
    if (type.includes("adjustment")) {
      return (
        <Badge variant="outline" className="text-[10px] gap-1 bg-purple-500/10 text-purple-600 border-purple-500/20 font-medium">
          <Wrench className="w-3 h-3" />
          <span>Ajuste</span>
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-[10px] gap-1">
        <Clock className="w-3 h-3" />
        <span>Reserva</span>
      </Badge>
    );
  };

  return (
    <PageContainer>
      <PageHeader
        title="Histórico de Movimentos de Stock"
        description="Registo imutável, auditável e rastreável com identificação visual por tipo e hiperligações para documentos"
        breadcrumbs={[
          { label: "Início", href: "/app" },
          { label: "Inventário", href: "/app/inventory" },
          { label: "Movimentos" },
        ]}
      />

      <InventoryFilterBar
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setCurrentPage(1);
        }}
        statusFilter={typeFilter}
        onStatusChange={(t) => {
          setTypeFilter(t);
          setCurrentPage(1);
        }}
        statusOptions={typeOptions}
        hasActiveFilters={searchQuery !== "" || typeFilter !== "ALL"}
        onResetFilters={() => {
          setSearchQuery("");
          setTypeFilter("ALL");
          setCurrentPage(1);
        }}
        searchPlaceholder="Pesquisar por material, referência ou localização..."
      />

      {filteredMovements.length === 0 ? (
        <InventoryEmptyState
          title="Nenhum movimento registado"
          description="Não existem registos de movimento que correspondam aos filtros."
        />
      ) : (
        <Card className="border-border/60">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data Efetiva</TableHead>
                  <TableHead>Tipo & Origem</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Origem {"->"} Destino</TableHead>
                  <TableHead className="text-right">Impacto</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead className="text-right">Custo Unitário</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead>Doc. Referência (Link)</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMovements.map((m) => {
                  const matDisplay = getMaterialDisplay(m.materialId, materials);
                  const destDisplay = getLocationDisplay(m.destinationLocationId || m.sourceLocationId, warehouses, obras);
                  const isPositive = m.movementType.includes("in") || m.movementType.includes("receipt");
                  const isNegative = m.movementType.includes("out") || m.movementType.includes("issue") || m.movementType.includes("consumption");

                  const impactValue = isPositive ? `+${m.quantity}` : isNegative ? `-${m.quantity}` : `0`;
                  const impactColor = isPositive ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : isNegative ? "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20" : "text-slate-600 bg-slate-500/10";

                  return (
                    <TableRow key={m.id} className="hover:bg-muted/30">
                      <TableCell className="text-xs">{formatDate(m.occurredAt)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {renderMovementTypeBadge(m.movementType)}
                          <span className="text-[10px] text-muted-foreground block font-mono">
                            {m.deliveryId ? "Origem: Receção DEL" : m.purchaseOrderId ? "Origem: Compra PC" : m.projectId ? "Origem: Consumo Obra" : "Origem: Ajuste"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link to="/app/inventory/materials/$materialId" params={{ materialId: m.materialId }} className="font-semibold text-primary hover:underline">
                          {matDisplay.name}
                        </Link>
                        <div className="text-[11px] text-muted-foreground font-mono">{matDisplay.sku}</div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {m.projectId ? (
                          <Link to="/app/obras/$id" params={{ id: m.projectId }} className="hover:text-primary font-medium text-foreground">
                            {destDisplay.label}
                          </Link>
                        ) : (
                          <Link to="/app/empresa/armazens" className="hover:text-primary font-medium text-foreground">
                            {destDisplay.label}
                          </Link>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className={`font-mono text-xs font-bold px-2 py-0.5 ${impactColor}`}>
                          {impactValue}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {m.movementType.includes("in") || m.movementType.includes("receipt")
                          ? "+"
                          : "-"}
                        {m.quantity} {matDisplay.unit}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {formatMZN(m.unitCost)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {formatMZN(m.totalCost)}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {m.deliveryId ? (
                          <Link to="/app/inventory/deliveries_/$deliveryId" params={{ deliveryId: m.deliveryId }} className="text-primary hover:underline font-bold">
                            {m.referenceId || m.deliveryId}
                          </Link>
                        ) : m.purchaseOrderId ? (
                          <Link to="/app/compras/$purchaseOrderId" params={{ purchaseOrderId: m.purchaseOrderId }} className="text-primary hover:underline font-bold">
                            {m.referenceId || m.purchaseOrderId}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground font-semibold">{m.referenceId || "Sem Ref"}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedMovement(m)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Ver Detalhes do Movimento"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Modal de Detalhe Completo do Movimento */}
      {selectedMovement && (
        <MovementDetailsDialog
          open={!!selectedMovement}
          onOpenChange={(open) => !open && setSelectedMovement(null)}
          movement={selectedMovement}
        />
      )}
    </PageContainer>
  );
}
