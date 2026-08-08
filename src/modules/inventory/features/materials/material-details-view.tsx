import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { PageContainer } from "@/components/shared/page-container";
import { InventoryStatusBadge } from "../../components/inventory-status-badge";
import { InventoryTimeline } from "../../components/inventory-timeline";
import { InventoryPermissionState } from "../../components/inventory-permission-state";
import { useInventoryPermissions } from "../../hooks/use-inventory-permissions";
import { inventoryStoreManager } from "../../store/inventory-store";
import { useObraMZStore } from "@/store/obramz-store";
import { formatMZN, formatDate } from "@/lib/format";
import { getMaterialDisplay, getLocationDisplay, getSupplierDisplay } from "../../utils/inventory-display";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Link } from "@tanstack/react-router";
import { Boxes, Clock, ArrowLeftRight, TrendingDown, History, Layers, Building2, ShoppingBag, HardHat, AlertTriangle, CheckCircle2 } from "lucide-react";
import { ReleaseReservationDialog } from "../reservations/release-reservation-dialog";
import { ConsumeReservationDialog } from "../reservations/consume-reservation-dialog";
import { RelatedEntitiesCard, type RelatedEntityItem } from "@/components/shared/related-entities-card";

interface MaterialDetailsViewProps {
  materialId: string;
}

export function MaterialDetailsView({ materialId }: MaterialDetailsViewProps) {
  const permissions = useInventoryPermissions();
  const [storeState, setStoreState] = useState(inventoryStoreManager.getState());
  const [activeTab, setActiveTab] = useState("summary");

  const materials = useObraMZStore((s) => s.materials || []);
  const warehouses = useObraMZStore((s) => s.warehouses || []);
  const obras = useObraMZStore((s) => s.obras || []);
  const suppliers = useObraMZStore((s) => s.suppliers || []);
  const reservations = useObraMZStore((s) => s.inventoryReservations || []);
  const releaseReservation = useObraMZStore((s) => s.releaseInventoryReservation);
  const consumeReservation = useObraMZStore((s) => s.consumeInventoryReservation);

  // Resolution de dados cadastrais do material
  const matInfo = getMaterialDisplay(materialId, materials);
  const matCadastral = materials.find((m) => m.id === materialId || m.sku === materialId);
  const prefSupplier = matCadastral?.supplierId ? getSupplierDisplay(matCadastral.supplierId, suppliers) : null;

  // Dialogs de reserva
  const [selectedResToRelease, setSelectedResToRelease] = useState<any>(null);
  const [selectedResToConsume, setSelectedResToConsume] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = inventoryStoreManager.subscribe((s) => setStoreState(s));
    return () => unsubscribe();
  }, []);

  if (!permissions.canView) {
    return <InventoryPermissionState />;
  }

  // Filtrar saldos, movimentos e reservas do material
  const materialBalances = Object.values(storeState.balances).filter(
    (b) => b.materialId === materialId || b.materialId === matInfo.sku
  );
  const materialMovements = storeState.movements.filter(
    (m) => m.materialId === materialId || m.materialId === matInfo.sku
  );
  const materialReservations = reservations.filter(
    (r) => r.materialId === materialId || r.materialId === matInfo.sku
  );

  const totalOnHand = materialBalances.reduce((sum, b) => sum + b.onHandQuantity, 0);
  const totalReserved = materialBalances.reduce((sum, b) => sum + b.reservedQuantity, 0);
  const totalAvailable = materialBalances.reduce((sum, b) => sum + b.availableQuantity, 0);
  const totalValue = materialBalances.reduce((sum, b) => sum + b.totalValue, 0);
  const averageCost = totalOnHand > 0 ? totalValue / totalOnHand : 0;

  return (
    <PageContainer>
      <PageHeader
        title={`Material: ${matInfo.name}`}
        description={`Ficha técnica e registo auditável de saldos, Kardex, compras e reservas para ${matInfo.sku}`}
        breadcrumbs={[
          { label: "Início", href: "/app" },
          { label: "Inventário", href: "/app/inventory" },
          { label: "Stock", href: "/app/inventory/stock" },
          { label: matInfo.name },
        ]}
      />

      {/* Cartão de Informações Cadastrais & Fornecedor Preferencial */}
      <Card className="border-border/60 mb-6 bg-muted/20">
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            <div className="font-bold text-sm text-foreground flex items-center gap-2">
              <span>{matInfo.name}</span>
              <Badge variant="outline" className="font-mono text-[11px]">{matInfo.sku}</Badge>
            </div>
            <div className="text-muted-foreground flex items-center gap-3 text-[11px]">
              <span>Unidade: <strong className="text-foreground">{matInfo.unit}</strong></span>
              <span>•</span>
              <span>Stock Mínimo: <strong className="text-foreground">{matCadastral?.minStockLevel || 0} {matInfo.unit}</strong></span>
            </div>
          </div>

          {prefSupplier && (
            <div className="text-right border-l border-border/60 pl-4 space-y-0.5">
              <span className="text-[11px] text-muted-foreground block">Fornecedor Preferencial:</span>
              <Link to="/app/fornecedores" className="font-semibold text-primary hover:underline flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                <span>{prefSupplier.name}</span>
              </Link>
            </div>
          )}

          {/* Últimos Movimentos Clicáveis */}
          <div className="w-full pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-muted-foreground">Últimos Movimentos Operacionais:</span>
            <div className="flex flex-wrap items-center gap-2">
              {materialMovements.length === 0 ? (
                <span className="text-muted-foreground text-[11px]">Sem movimentos registados</span>
              ) : (
                materialMovements.slice(0, 3).map((mv) => {
                  const isDelivery = mv.movementType === "in" || mv.referenceId?.startsWith("DEL") || mv.deliveryId;
                  const isTransfer = mv.movementType === "transfer" || mv.referenceId?.startsWith("TR");
                  const isProject = mv.movementType === "out" || mv.projectId;

                  const label = isDelivery
                    ? `Receção ${mv.referenceId || "DEL"}`
                    : isTransfer
                    ? `Transferência ${mv.referenceId || "TR"}`
                    : `Consumo ${mv.projectId || "OBRA"}`;

                  const linkPath = isDelivery
                    ? `/app/inventory/deliveries`
                    : isTransfer
                    ? `/app/inventory/transfers`
                    : `/app/obras/${mv.projectId || "1"}`;

                  return (
                    <Badge
                      key={mv.id}
                      variant="outline"
                      className="bg-background border-border/60 hover:border-primary text-xs cursor-pointer py-1 px-2.5"
                      asChild
                    >
                      <Link to={linkPath}>
                        <span className="font-mono font-semibold text-primary">{label}</span>
                        <span className="text-[10px] text-muted-foreground ml-1 font-mono">({mv.quantity > 0 ? `+${mv.quantity}` : mv.quantity})</span>
                      </Link>
                    </Badge>
                  );
                })
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cartões Principais de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border-border/60">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              Stock Físico (onHand)
            </span>
            <div className="text-2xl font-bold text-foreground">
              {totalOnHand.toLocaleString()} {matInfo.unit}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Distribuído por {materialBalances.length} localizações
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              Disponível / Reservado
            </span>
            <div className="text-2xl font-bold text-emerald-600">
              {totalAvailable.toLocaleString()} {matInfo.unit}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {totalReserved.toLocaleString()} {matInfo.unit} reservadas
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              Custo Médio (WAC)
            </span>
            <div className="text-2xl font-bold text-foreground">{formatMZN(averageCost)}</div>
            <p className="text-[11px] text-muted-foreground">Média Ponderada Atual</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              Valor Total
            </span>
            <div className="text-2xl font-bold text-foreground">{formatMZN(totalValue)}</div>
            <p className="text-[11px] text-muted-foreground">Ativo em Stock</p>
          </CardContent>
        </Card>
      </div>

      {/* Painel: Localização Atual do Stock (Físico, Disponível, Reservado) */}
      <Card className="border-border/60 mb-6 bg-card">
        <CardHeader className="py-3 px-4 bg-muted/20 border-b border-border/60">
          <CardTitle className="text-xs font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-emerald-600" />
              <span>Localização Atual do Stock (Distribuição Física & Reservas)</span>
            </div>
            <Badge variant="outline" className="text-[10px]">
              {materialBalances.length} localizações com saldo
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {materialBalances.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded-lg">
              Sem saldos registados para este material em nenhuma localização.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {materialBalances.map((bal) => {
                const locDisp = getLocationDisplay(bal.locationId, warehouses, obras);
                return (
                  <div key={bal.locationId} className="p-3 border rounded-xl bg-muted/20 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between font-bold text-foreground">
                      <span className="truncate">{locDisp.label}</span>
                      <Badge variant="secondary" className="text-[10px] font-mono">{bal.locationType === "central_stock" ? "Armazém" : "Obra"}</Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-1 pt-1 text-[11px] font-mono text-center">
                      <div className="p-1 rounded bg-background border border-border/40">
                        <span className="text-[9px] text-muted-foreground block uppercase">Físico</span>
                        <strong className="text-foreground">{bal.onHandQuantity}</strong>
                      </div>
                      <div className="p-1 rounded bg-background border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                        <span className="text-[9px] text-muted-foreground block uppercase">Disp.</span>
                        <strong className="text-emerald-600 dark:text-emerald-400">{bal.availableQuantity}</strong>
                      </div>
                      <div className="p-1 rounded bg-background border border-amber-500/20 text-amber-700 dark:text-amber-400">
                        <span className="text-[9px] text-muted-foreground block uppercase">Reser.</span>
                        <strong className="text-amber-600 dark:text-amber-400">{bal.reservedQuantity}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navegação por Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex flex-wrap border-b border-border/60 bg-transparent p-0 h-auto gap-2">
          <TabsTrigger value="summary" className="data-[state=active]:bg-muted text-xs">
            Resumo & Localizações
          </TabsTrigger>
          <TabsTrigger value="kardex" className="data-[state=active]:bg-muted text-xs">
            Kardex de Movimentos ({materialMovements.length})
          </TabsTrigger>
          <TabsTrigger value="reservations" className="data-[state=active]:bg-muted text-xs flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>⏱ Reservas ({materialReservations.length})</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className="data-[state=active]:bg-muted text-xs">
            Timeline de Eventos
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Resumo & Localizações */}
        <TabsContent value="summary" className="space-y-4 pt-2">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Distribuição do Stock por Localização
              </CardTitle>
            </CardHeader>
            <CardContent>
              {materialBalances.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Sem saldos registados para este material.
                </p>
              ) : (
                <div className="space-y-2 text-xs">
                  {materialBalances.map((b) => {
                    const locInfo = getLocationDisplay(b.locationId, warehouses, obras);
                    return (
                      <div
                        key={b.id}
                        className="p-3 bg-muted/30 rounded-lg flex items-center justify-between border border-border/40"
                      >
                        <div>
                          <span className="font-semibold text-foreground">{locInfo.label}</span>
                          <span className="text-muted-foreground block text-[11px]">
                            WAC: {formatMZN(b.averageCost)}
                          </span>
                        </div>
                        <div className="text-right font-mono">
                          <span className="font-bold text-foreground block">
                            {b.onHandQuantity} {matInfo.unit} (Físico)
                          </span>
                          <span className="text-emerald-600 text-[11px]">
                            {b.availableQuantity} {matInfo.unit} disponíveis
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Kardex Completo Auditável */}
        <TabsContent value="kardex" className="pt-2">
          <Card className="border-border/60">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data / Hora</TableHead>
                    <TableHead>Tipo Movimento</TableHead>
                    <TableHead>Origem {"->"} Destino</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead className="text-right">Custo Unit</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead>Doc. Referência (Link)</TableHead>
                    <TableHead>Utilizador</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materialMovements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6 text-xs text-muted-foreground">
                        Nenhum movimento registado para este material.
                      </TableCell>
                    </TableRow>
                  ) : (
                    materialMovements.map((m) => {
                      const destDisplay = getLocationDisplay(m.destinationLocationId || m.sourceLocationId, warehouses, obras);
                      return (
                        <TableRow key={m.id} className="hover:bg-muted/30">
                          <TableCell className="text-xs">{formatDate(m.occurredAt)}</TableCell>
                          <TableCell className="text-xs font-semibold">{m.movementType}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{destDisplay.label}</TableCell>
                          <TableCell className="text-right font-mono font-semibold">
                            {m.movementType.includes("in") || m.movementType.includes("receipt") ? "+" : "-"}
                            {m.quantity} {matInfo.unit}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">{formatMZN(m.unitCost)}</TableCell>
                          <TableCell className="text-right font-mono font-semibold">{formatMZN(m.totalCost)}</TableCell>
                          <TableCell className="text-xs">
                            <Link to="/app/inventory/deliveries" className="text-primary hover:underline font-mono">
                              {m.referenceId || "Sem Doc"}
                            </Link>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">Sistema / Admin</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: GESTÃO DE RESERVAS DE STOCK (NOVA ABA REQUERIDA) */}
        <TabsContent value="reservations" className="pt-2">
          <Card className="border-border/60">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>Reservas de Stock para Obras</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Fórmula: Disponível ({totalAvailable}) = Físico ({totalOnHand}) - Reservado ({totalReserved}). A reserva NÃO altera o stock físico.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Obra Beneficiária</TableHead>
                    <TableHead>Localização Origem</TableHead>
                    <TableHead className="text-right">Qtd Reservada</TableHead>
                    <TableHead>Data Expiração</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materialReservations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-xs text-muted-foreground">
                        Nenhuma reserva ativa para este material.
                      </TableCell>
                    </TableRow>
                  ) : (
                    materialReservations.map((r) => {
                      const obraInfo = getLocationDisplay(`LOC-PROJ-${r.projectId}`, warehouses, obras);
                      const locInfo = getLocationDisplay(r.locationId, warehouses, obras);

                      return (
                        <TableRow key={r.id} className="hover:bg-muted/30">
                          <TableCell className="font-semibold text-foreground">
                            <Link to="/app/obras" className="text-primary hover:underline">
                              {obraInfo.label}
                            </Link>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{locInfo.label}</TableCell>
                          <TableCell className="text-right font-mono font-bold text-amber-600">
                            {r.reservedQuantity} {matInfo.unit}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {r.expiresAt ? formatDate(r.expiresAt) : "Sem limite"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={r.status === "active" ? "default" : "outline"}
                              className="text-[10px]"
                            >
                              {r.status === "active" ? "Ativa" : r.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {r.status === "active" && (
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="xs"
                                  variant="outline"
                                  onClick={() => setSelectedResToConsume(r)}
                                  className="h-7 text-[11px] gap-1 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Consumir</span>
                                </Button>
                                <Button
                                  size="xs"
                                  variant="ghost"
                                  onClick={() => setSelectedResToRelease(r)}
                                  className="h-7 text-[11px] text-muted-foreground hover:text-rose-600"
                                >
                                  Libertar
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Timeline */}
        <TabsContent value="timeline" className="pt-2">
          <Card className="border-border/60 p-6">
            <InventoryTimeline movements={materialMovements} />
          </Card>
        </TabsContent>
      </Tabs>

      {/* Painel de Últimas Compras deste Material */}
      {(() => {
        const purchaseOrders = useObraMZStore.getState().purchaseOrders || [];
        const purchaseOrderItems = useObraMZStore.getState().purchaseOrderItems || [];
        const relatedPOItems = purchaseOrderItems.filter((i) => i.materialId === materialId || i.materialId === matInfo.sku);

        if (relatedPOItems.length === 0) return null;

        return (
          <Card className="border-border/60 mt-6">
            <CardHeader className="py-3 px-4 bg-muted/20 border-b border-border/60">
              <CardTitle className="text-xs font-bold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-purple-600" />
                  <span>Últimas Compras deste Material ({relatedPOItems.length})</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/10 hover:bg-transparent text-[11px]">
                    <TableHead>Pedido de Compra</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead className="text-right">Qtd Pedida</TableHead>
                    <TableHead className="text-right">Preço Unit.</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relatedPOItems.slice(0, 5).map((poi) => {
                    const po = purchaseOrders.find((p) => p.id === poi.purchaseOrderId);
                    const supp = po ? getSupplierDisplay(po.supplierId, suppliers) : { name: "Fornecedor" };

                    return (
                      <TableRow key={poi.id} className="text-xs hover:bg-muted/20">
                        <TableCell className="font-mono font-bold text-primary py-2">
                          {po?.orderNumber || poi.purchaseOrderId}
                        </TableCell>
                        <TableCell className="py-2">{supp.name}</TableCell>
                        <TableCell className="text-right font-mono py-2">{poi.orderedPurchaseQuantity} {poi.purchaseUnitSymbolSnapshot}</TableCell>
                        <TableCell className="text-right font-mono py-2">{formatMZN(poi.unitPrice)}</TableCell>
                        <TableCell className="text-right py-2">
                          {po && (
                            <Link to="/app/compras/$purchaseOrderId" params={{ purchaseOrderId: po.id }}>
                              <Button size="xs" variant="outline" className="h-6 text-[10px]">
                                Abrir Compra
                              </Button>
                            </Link>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })()}

      {/* Cartão de Entidades Relacionadas */}
      {(() => {
        const related: RelatedEntityItem[] = [];
        if (prefSupplier) {
          related.push({
            type: "supplier",
            title: prefSupplier.name,
            subtitle: "Fornecedor Preferencial",
            linkTo: "/app/fornecedores",
          });
        }
        return <div className="mt-6"><RelatedEntitiesCard title="Entidades Relacionadas com este Material" entities={related} /></div>;
      })()}

      {/* Modais de Reserva */}
      {selectedResToRelease && (
        <ReleaseReservationDialog
          open={!!selectedResToRelease}
          onOpenChange={(open) => !open && setSelectedResToRelease(null)}
          reservation={selectedResToRelease}
        />
      )}
      {selectedResToConsume && (
        <ConsumeReservationDialog
          open={!!selectedResToConsume}
          onOpenChange={(open) => !open && setSelectedResToConsume(null)}
          reservation={selectedResToConsume}
        />
      )}
    </PageContainer>
  );
}
