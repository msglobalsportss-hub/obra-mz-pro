import { useState } from "react";
import { useObraMZStore } from "@/store/obramz-store";
import type { Supplier, SupplierMaterial } from "@/lib/suppliers";
import { calculateBaseUnitPrice, formatPaymentTermLabel } from "@/lib/suppliers";
import { formatMZN, formatDate } from "@/lib/format";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "@tanstack/react-router";
import { Building2, Phone, Mail, MapPin, User, Star, Plus, Edit, StarOff, CheckCircle2, XCircle, FileText, Truck, ShoppingBag, BarChart2 } from "lucide-react";
import { SupplierMaterialDialog } from "./supplier-material-dialog";
import { toast } from "sonner";

interface SupplierDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
  onEditSupplier: (supplier: Supplier) => void;
}

export function SupplierDetailsDialog({
  open,
  onOpenChange,
  supplier,
  onEditSupplier,
}: SupplierDetailsDialogProps) {
  const materials = useObraMZStore((s) => s.materials || []);
  const materialUnits = useObraMZStore((s) => s.materialUnits || []);
  const allSupplierMaterials = useObraMZStore((s) => s.supplierMaterials || []);
  const allHistories = useObraMZStore((s) => s.supplierPriceHistories || []);
  const purchaseOrders = useObraMZStore((s) => s.purchaseOrders || []);
  const deliveries = useObraMZStore((s) => s.deliveries || []);
  const deactivateSupplierMaterial = useObraMZStore((s) => s.deactivateSupplierMaterial);
  const activateSupplierMaterial = useObraMZStore((s) => s.activateSupplierMaterial);
  const setPreferredSupplierForMaterial = useObraMZStore((s) => s.setPreferredSupplierForMaterial);

  const [relDialogOpen, setRelDialogOpen] = useState(false);
  const [relToEdit, setRelToEdit] = useState<SupplierMaterial | null>(null);

  if (!supplier) return null;

  const supplierRels = allSupplierMaterials.filter((r) => r.supplierId === supplier.id);
  const supplierPOs = purchaseOrders.filter((p) => p.supplierId === supplier.id);

  // Entregas vinculadas a POs deste fornecedor
  const supplierDeliveryIds = new Set(supplierPOs.map((p) => p.id));
  const supplierDeliveries = deliveries.filter((d) => supplierDeliveryIds.has(d.purchaseOrderId));

  const totalSpent = supplierPOs.reduce((acc, p) => acc + ((p as any).totalValue || (p as any).totalAmount || 0), 0);
  const confirmedDeliveries = supplierDeliveries.filter((d) => d.status === "confirmed").length;
  const punctualityRate = supplierDeliveries.length > 0 ? Math.round((confirmedDeliveries / supplierDeliveries.length) * 100) : 100;
  const lastPO = supplierPOs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  const handleOpenNewRel = () => {
    setRelToEdit(null);
    setRelDialogOpen(true);
  };

  const handleEditRel = (rel: SupplierMaterial) => {
    setRelToEdit(rel);
    setRelDialogOpen(true);
  };

  const handleTogglePreferred = (rel: SupplierMaterial) => {
    try {
      if (rel.isPreferred) {
        setPreferredSupplierForMaterial(rel.materialId, undefined);
        toast.info("Removido de fornecedor preferencial.");
      } else {
        setPreferredSupplierForMaterial(rel.materialId, rel.id);
        toast.success("Definido como fornecedor preferencial para este material.");
      }
    } catch (e: any) {
      toast.error(e.message || "Erro ao alterar preferência.");
    }
  };

  const handleToggleStatus = (rel: SupplierMaterial) => {
    try {
      if (rel.status === "active") {
        deactivateSupplierMaterial(rel.id);
        toast.info("Relação comercial desativada.");
      } else {
        activateSupplierMaterial(rel.id);
        toast.success("Relação comercial reativada.");
      }
    } catch (e: any) {
      toast.error(e.message || "Erro ao alterar estado.");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  {supplier.name}
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs">
                  {supplier.legalName ? `${supplier.legalName} · ` : ""}
                  NUIT: {supplier.nuit || "Não informado"}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={supplier.status === "active" ? "default" : "secondary"}>
                  {supplier.status === "active" ? "Ativo" : "Inativo"}
                </Badge>
                <Button size="sm" variant="outline" onClick={() => onEditSupplier(supplier)}>
                  <Edit className="h-4 w-4 mr-1" /> Editar
                </Button>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="materials" className="mt-2">
            <TabsList className="grid w-full grid-cols-6 text-xs">
              <TabsTrigger value="materials">Materiais ({supplierRels.length})</TabsTrigger>
              <TabsTrigger value="orders">Compras ({supplierPOs.length})</TabsTrigger>
              <TabsTrigger value="deliveries">Entregas ({supplierDeliveries.length})</TabsTrigger>
              <TabsTrigger value="stats">Estatísticas</TabsTrigger>
              <TabsTrigger value="info">Info Comercial</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
            </TabsList>

            {/* ABA 1: MATERIAIS FORNECIDOS */}
            <TabsContent value="materials" className="pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Tabela Comercial de Materiais</h4>
                <Button size="sm" onClick={handleOpenNewRel}>
                  <Plus className="h-4 w-4 mr-1" /> Associar Material
                </Button>
              </div>

              {supplierRels.length === 0 ? (
                <div className="py-8 text-center border rounded-lg bg-muted/20 text-muted-foreground text-sm">
                  Nenhum material associado a este fornecedor. Clique em "Associar Material" para adicionar.
                </div>
              ) : (
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Preço Comercial</TableHead>
                        <TableHead>Unidade Compra / Fator</TableHead>
                        <TableHead>Preço Base Convertido</TableHead>
                        <TableHead>Qtd. Mín / Prazo</TableHead>
                        <TableHead className="text-center">Preferencial</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {supplierRels.map((rel) => {
                        const mat = materials.find((m) => m.id === rel.materialId);
                        const purchaseUnit = materialUnits.find((u) => u.id === rel.purchaseUnitId);
                        const baseUnit = materialUnits.find((u) => u.id === mat?.unitId);
                        const basePrice = calculateBaseUnitPrice(rel.unitPrice, rel.conversionFactor);

                        return (
                          <TableRow key={rel.id} className={rel.status === "inactive" ? "opacity-60 bg-muted/10" : ""}>
                            <TableCell>
                              <div className="font-semibold text-sm">{mat?.name || "Material Desconhecido"}</div>
                              <div className="text-xs text-muted-foreground">
                                {rel.brand ? `Marca: ${rel.brand}` : ""}
                                {rel.supplierCode ? ` · Cód: ${rel.supplierCode}` : ""}
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="font-bold text-sm">{formatMZN(rel.unitPrice)}</div>
                              <div className="text-[11px] text-muted-foreground">por {purchaseUnit?.symbol || "un"}</div>
                            </TableCell>

                            <TableCell className="text-xs">
                              <div>{purchaseUnit?.name}</div>
                              <div className="text-muted-foreground font-mono text-[11px]">
                                1 {purchaseUnit?.symbol} = {rel.conversionFactor} {baseUnit?.symbol}
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="font-semibold text-sm text-primary">
                                {formatMZN(basePrice)}
                              </div>
                              <div className="text-[11px] text-muted-foreground">por {baseUnit?.symbol || "un"}</div>
                            </TableCell>

                            <TableCell className="text-xs">
                              <div>Min: {rel.minimumOrderQuantity ? `${rel.minimumOrderQuantity} ${purchaseUnit?.symbol}` : "—"}</div>
                              <div className="text-muted-foreground">{rel.leadTimeDays ? `${rel.leadTimeDays} dias` : "Prazo —"}</div>
                            </TableCell>

                            <TableCell className="text-center">
                              <Button
                                size="sm"
                                variant={rel.isPreferred ? "default" : "ghost"}
                                className={rel.isPreferred ? "h-7 text-xs bg-amber-500 hover:bg-amber-600 text-white" : "h-7 text-xs text-muted-foreground"}
                                onClick={() => handleTogglePreferred(rel)}
                                title={rel.isPreferred ? "Remover preferência" : "Definir como preferencial"}
                              >
                                {rel.isPreferred ? <Star className="h-3.5 w-3.5 mr-1 fill-white" /> : <StarOff className="h-3.5 w-3.5 mr-1" />}
                                {rel.isPreferred ? "Preferencial" : "Definir"}
                              </Button>
                            </TableCell>

                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleEditRel(rel)}>
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className={`h-7 w-7 p-0 ${rel.status === "active" ? "text-destructive" : "text-success"}`}
                                  onClick={() => handleToggleStatus(rel)}
                                  title={rel.status === "active" ? "Desativar Relação" : "Reactivar Relação"}
                                >
                                  {rel.status === "active" ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* ABA 2: INFORMAÇÕES COMERCIAIS */}
            <TabsContent value="info" className="pt-3 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 text-sm">
                <div className="space-y-3 p-4 border rounded-lg bg-card">
                  <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Contactos & Localização</h4>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <span>{supplier.city}, {supplier.province} ({supplier.country})</span>
                  </div>
                  {supplier.address && <div className="text-xs text-muted-foreground pl-6">{supplier.address}</div>}
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary shrink-0" />
                    <span>{supplier.phone} {supplier.secondaryPhone ? ` / ${supplier.secondaryPhone}` : ""}</span>
                  </div>
                  {supplier.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary shrink-0" />
                      <span>{supplier.email}</span>
                    </div>
                  )}
                  {supplier.contactPerson && (
                    <div className="flex items-center gap-2 pt-1 border-t">
                      <User className="h-4 w-4 text-primary shrink-0" />
                      <span>{supplier.contactPerson} {supplier.contactPersonPhone ? `(${supplier.contactPersonPhone})` : ""}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3 p-4 border rounded-lg bg-card">
                  <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Termos Comerciais</h4>
                  <div>
                    <div className="text-xs text-muted-foreground">Condição de Pagamento Padrão</div>
                    <div className="font-medium">{formatPaymentTermLabel(supplier.paymentTermType, supplier.paymentTermDays, supplier.paymentTermsNotes)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Prazo Padrão de Entrega</div>
                    <div className="font-medium">{supplier.defaultLeadTimeDays ? `${supplier.defaultLeadTimeDays} dias` : "Não definido"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Avaliação do Fornecedor</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {Array.from({ length: supplier.rating || 4 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                      <span className="text-xs font-semibold ml-1">({supplier.rating || 4}/5)</span>
                    </div>
                  </div>
                </div>
              </div>

              {supplier.notes && (
                <div className="p-4 border rounded-lg bg-muted/20 text-xs space-y-1">
                  <div className="font-semibold text-muted-foreground">Observações Internas</div>
                  <div className="whitespace-pre-wrap">{supplier.notes}</div>
                </div>
              )}
            </TabsContent>

            {/* ABA 3: HISTÓRICO DE PREÇOS */}
            <TabsContent value="history" className="pt-3">
              {(() => {
                const histList = allHistories.filter((h) => h.supplierId === supplier.id);
                if (histList.length === 0) {
                  return (
                    <div className="py-8 text-center border rounded-lg bg-muted/20 text-muted-foreground text-sm">
                      Nenhum histórico de alteração de preço registado para este fornecedor.
                    </div>
                  );
                }
                return (
                  <div className="border rounded-lg overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Material</TableHead>
                          <TableHead>Preço Anterior</TableHead>
                          <TableHead>Novo Preço</TableHead>
                          <TableHead>Variação</TableHead>
                          <TableHead>Motivo / Observação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {histList.map((h) => {
                          const mat = materials.find((m) => m.id === h.materialId);
                          const prev = h.previousUnitPrice;
                          const curr = h.newUnitPrice;
                          const diff = prev ? curr - prev : 0;
                          const percent = prev && prev > 0 ? ((diff / prev) * 100).toFixed(1) : null;

                          return (
                            <TableRow key={h.id}>
                              <TableCell className="text-xs">{formatDate(h.effectiveDate)}</TableCell>
                              <TableCell className="font-medium text-xs">{mat?.name || "Material"}</TableCell>
                              <TableCell className="text-xs">{prev ? formatMZN(prev) : "—"}</TableCell>
                              <TableCell className="text-xs font-bold">{formatMZN(curr)}</TableCell>
                              <TableCell className="text-xs">
                                {percent ? (
                                  <Badge variant={diff > 0 ? "destructive" : "default"} className="text-[10px]">
                                    {diff > 0 ? `+${percent}%` : `${percent}%`}
                                  </Badge>
                                ) : "Inicial"}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">{h.reason || "—"}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                );
              })()}
            </TabsContent>
            {/* ABA 2: PEDIDOS DE COMPRA */}
            <TabsContent value="orders" className="pt-3">
              {supplierPOs.length === 0 ? (
                <div className="py-8 text-center border rounded-lg bg-muted/20 text-muted-foreground text-sm">
                  Nenhum pedido de compra registado para este fornecedor.
                </div>
              ) : (
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número do Pedido</TableHead>
                        <TableHead>Data de Criação</TableHead>
                        <TableHead>Valor Total</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {supplierPOs.slice(0, 5).map((po) => (
                        <TableRow key={po.id}>
                          <TableCell className="font-mono font-bold text-primary text-xs">{po.orderNumber}</TableCell>
                          <TableCell className="text-xs">{formatDate(po.createdAt)}</TableCell>
                          <TableCell className="font-mono font-bold text-xs">{formatMZN((po as any).totalAmount || (po as any).totalValue || 0)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">{po.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Link to="/app/compras/$purchaseOrderId" params={{ purchaseOrderId: po.id }}>
                              <Button size="sm" variant="outline" className="h-6 text-[10px]">Abrir Compra</Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {supplierPOs.length > 5 && (
                    <div className="p-2 bg-muted/20 text-center border-t">
                      <Link to="/app/compras" className="text-xs text-primary font-semibold hover:underline">
                        Ver todas as {supplierPOs.length} compras →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* ABA 3: ENTREGAS DE CARGA */}
            <TabsContent value="deliveries" className="pt-3">
              {supplierDeliveries.length === 0 ? (
                <div className="py-8 text-center border rounded-lg bg-muted/20 text-muted-foreground text-sm">
                  Nenhuma entrega registada para este fornecedor.
                </div>
              ) : (
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nº Entrega</TableHead>
                        <TableHead>Data de Chegada</TableHead>
                        <TableHead>Doc. Guia</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {supplierDeliveries.slice(0, 5).map((del) => (
                        <TableRow key={del.id}>
                          <TableCell className="font-mono font-bold text-primary text-xs">{del.deliveryNumber}</TableCell>
                          <TableCell className="text-xs">{del.arrivedAt ? formatDate(del.arrivedAt) : formatDate(del.deliveryDate)}</TableCell>
                          <TableCell className="text-xs font-mono">{del.deliveryNoteNumber || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">{del.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Link to="/app/inventory/deliveries_/$deliveryId" params={{ deliveryId: del.id }}>
                              <Button size="sm" variant="outline" className="h-6 text-[10px]">Abrir Entrega</Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {supplierDeliveries.length > 5 && (
                    <div className="p-2 bg-muted/20 text-center border-t">
                      <Link to="/app/inventory/deliveries" className="text-xs text-primary font-semibold hover:underline">
                        Ver todas as {supplierDeliveries.length} entregas →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* ABA 4: ESTATÍSTICAS COMERCIAIS */}
            <TabsContent value="stats" className="pt-3 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-muted/30 rounded-lg border space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Total Comprado</span>
                  <span className="text-base font-bold font-mono text-primary">{formatMZN(totalSpent)}</span>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg border space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Total de Entregas</span>
                  <span className="text-base font-bold font-mono text-foreground">{supplierDeliveries.length} entregas</span>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg border space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Pontualidade / Sucesso</span>
                  <span className="text-base font-bold font-mono text-emerald-600">{punctualityRate}%</span>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg border space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Última Compra</span>
                  <span className="text-xs font-bold font-mono text-foreground">{lastPO ? formatDate(lastPO.createdAt) : "—"}</span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      <SupplierMaterialDialog
        open={relDialogOpen}
        onOpenChange={setRelDialogOpen}
        supplierId={supplier.id}
        relationshipToEdit={relToEdit}
      />
    </>
  );
}
