/**
 * Vista de Gestão de Armazéns: EMPRESA → Armazéns
 * Rota: /app/empresa/armazens
 */

import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { PageContainer } from "@/components/shared/page-container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useObraMZStore } from "@/store/obramz-store";
import { DEFAULT_INITIAL_WAREHOUSES, type Warehouse } from "@/lib/materials/warehouse";
import { MOZAMBIQUE_PROVINCES } from "@/lib/suppliers";
import { Boxes, Plus, Star, Edit, Trash2, Power, ShieldAlert, CheckCircle2, Truck, ArrowUpRight, BarChart2, Package } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { inventoryStoreManager } from "@/modules/inventory/store/inventory-store";

export const Route = createFileRoute("/app/empresa/armazens")({
  component: ArmazensPage,
});

function ArmazensPage() {
  const warehouses = useObraMZStore((s) => s.warehouses || DEFAULT_INITIAL_WAREHOUSES);
  const addWarehouse = useObraMZStore((s) => s.addWarehouse);
  const updateWarehouse = useObraMZStore((s) => s.updateWarehouse);
  const toggleWarehouseActive = useObraMZStore((s) => s.toggleWarehouseActive);
  const setMainWarehouse = useObraMZStore((s) => s.setMainWarehouse);
  const canDeleteWarehouse = useObraMZStore((s) => s.canDeleteWarehouse);
  const deleteWarehouse = useObraMZStore((s) => s.deleteWarehouse);

  const [invState, setInvState] = React.useState(inventoryStoreManager.getState());
  React.useEffect(() => {
    return inventoryStoreManager.subscribe(setInvState);
  }, []);

  const balancesList = Object.values(invState.balances);
  const criticalCount = balancesList.filter((b) => b.onHandQuantity <= 0).length;
  const lowStockCount = balancesList.filter((b) => b.onHandQuantity > 0 && b.onHandQuantity <= 10).length;
  const pendingTransfersCount = invState.transfers.filter((t) => t.status === "in_transit" || t.status === "pending").length;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [province, setProvince] = useState("Maputo Província");
  const [city, setCity] = useState("");
  const [isMainWarehouse, setIsMainWarehouse] = useState(false);

  const handleOpenCreate = () => {
    setEditingWarehouse(null);
    setCode("");
    setName("");
    setAddress("");
    setProvince("Maputo Província");
    setCity("");
    setIsMainWarehouse(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (w: Warehouse) => {
    setEditingWarehouse(w);
    setCode(w.code);
    setName(w.name);
    setAddress(w.address || "");
    setProvince(w.province || "Maputo Província");
    setCity(w.city || "");
    setIsMainWarehouse(w.isMainWarehouse);
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingWarehouse) {
        updateWarehouse(editingWarehouse.id, {
          code,
          name,
          address,
          province,
          city,
          isMainWarehouse,
        });
        toast.success("Armazém atualizado com sucesso!");
      } else {
        addWarehouse({
          code,
          name,
          address,
          province,
          city,
          isMainWarehouse,
        });
        toast.success("Armazém criado com sucesso!");
      }
      setModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao guardar armazém";
      toast.error(msg);
    }
  };

  const handleToggleStatus = (w: Warehouse) => {
    try {
      toggleWarehouseActive(w.id);
      toast.success(`Armazém ${w.isActive ? "desativado" : "ativado"}!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao alterar estado do armazém";
      toast.error(msg);
    }
  };

  const handleSetMain = (w: Warehouse) => {
    try {
      setMainWarehouse(w.id);
      toast.success(`"${w.name}" definido como Armazém Principal!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao definir armazém principal";
      toast.error(msg);
    }
  };

  const handleDelete = (w: Warehouse) => {
    const check = canDeleteWarehouse(w.id);
    if (!check.canDelete) {
      toast.error(check.reason);
      return;
    }
    if (confirm(`Tem a certeza que deseja eliminar o armazém "${w.name}"?`)) {
      try {
        deleteWarehouse(w.id);
        toast.success("Armazém eliminado.");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erro ao eliminar armazém";
        toast.error(msg);
      }
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Gestão de Armazéns & Depósitos"
        description="Gestão de armazéns centrais e depósitos regionais da empresa"
        breadcrumbs={[
          { label: "Início", href: "/app" },
          { label: "Empresa", href: "/app/empresa" },
          { label: "Armazéns" },
        ]}
        actions={
          <Button onClick={handleOpenCreate} size="sm" className="gap-1.5 shadow-xs">
            <Plus className="w-4 h-4" />
            <span>Novo Armazém</span>
          </Button>
        }
      />
      {/* Cartões de Capacidade e Alertas dos Armazéns (Dados Reais) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <Card className="p-3 border-border/60 space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase block">Capacidade Ocupada</span>
          <div className="text-sm font-bold font-mono text-muted-foreground">Sem dados</div>
          <p className="text-[10px] text-muted-foreground">Sem limite m³ definido</p>
        </Card>

        <Card className="p-3 border-border/60 space-y-1 bg-amber-500/5">
          <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase block">Materiais Esgotados</span>
          <div className="text-xl font-bold font-mono text-amber-600">{criticalCount}</div>
          <p className="text-[10px] text-muted-foreground">Com saldo zero</p>
        </Card>

        <Card className="p-3 border-border/60 space-y-1 bg-rose-500/5">
          <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 uppercase block">Stock Baixo</span>
          <div className="text-xl font-bold font-mono text-rose-600">{lowStockCount}</div>
          <p className="text-[10px] text-muted-foreground">Abaixo de 10 unidades</p>
        </Card>

        <Card className="p-3 border-border/60 space-y-1 bg-blue-500/5">
          <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 uppercase block">Transferências Pendentes</span>
          <div className="text-xl font-bold font-mono text-blue-600">{pendingTransfersCount}</div>
          <p className="text-[10px] text-muted-foreground">Em trânsito entre depósitos</p>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Código</TableHead>
                <TableHead>Nome do Armazém</TableHead>
                <TableHead>Localização / Província</TableHead>
                <TableHead>Principal?</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {warehouses.map((w) => (
                <TableRow key={w.id} className="hover:bg-muted/30">
                  <TableCell className="font-mono font-bold text-xs">{w.code}</TableCell>
                  <TableCell className="font-semibold text-foreground">
                    {w.name}
                    {w.address && (
                      <div className="text-xs font-normal text-muted-foreground">{w.address}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {w.city ? `${w.city}, ` : ""}
                    {w.province || "—"}
                  </TableCell>
                  <TableCell>
                    {w.isMainWarehouse ? (
                      <Badge variant="default" className="gap-1 bg-amber-500 hover:bg-amber-600">
                        <Star className="w-3 h-3 fill-current" />
                        <span>Principal</span>
                      </Badge>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetMain(w)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Definir como Principal
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={w.isActive ? "outline" : "secondary"}>
                      {w.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(w)}
                        title="Editar Armazém"
                      >
                        <Edit className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleStatus(w)}
                        title={w.isActive ? "Desativar Armazém" : "Ativar Armazém"}
                      >
                        <Power
                          className={`w-4 h-4 ${w.isActive ? "text-rose-500" : "text-emerald-500"}`}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(w)}
                        title="Eliminar Armazém"
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-rose-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Painel Contextual de Atividade e Movimentos dos Armazéns */}
      <Card className="border-border/60 mt-6">
        <CardHeader className="py-3 px-4 bg-muted/20 border-b border-border/60">
          <CardTitle className="text-xs font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary" />
              <span>Atividade e Movimentos de Stock nos Armazéns</span>
            </div>
            <Link to="/app/inventory/movements">
              <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1">
                <span>Abrir Todos os Movimentos</span>
                <ArrowUpRight className="w-3 h-3" />
              </Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {(() => {
            const deliveries = useObraMZStore.getState().deliveries || [];
            const stockMovements = useObraMZStore.getState().stockMovements || [];
            const warehouseDeliveries = deliveries.filter((d) => d.destinationType === "central_stock");

            const recentMovements = stockMovements.slice(0, 5);

            return (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Últimas Entregas em Armazém */}
                  <div className="border border-border/60 rounded-lg p-3 bg-muted/10 space-y-2">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-blue-600" />
                      Últimas Entregas em Armazém ({warehouseDeliveries.length})
                    </span>
                    {warehouseDeliveries.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground py-2">Sem entregas registadas para armazém central.</p>
                    ) : (
                      <div className="space-y-1">
                        {warehouseDeliveries.slice(0, 3).map((del) => (
                          <div key={del.id} className="flex items-center justify-between p-2 rounded bg-background border border-border/50 text-xs">
                            <span className="font-mono font-bold text-primary">{del.deliveryNumber}</span>
                            <Badge variant="outline" className="text-[9px]">{del.status}</Badge>
                            <Link to="/app/inventory/deliveries/$deliveryId" params={{ deliveryId: del.id }}>
                              <Button size="sm" variant="ghost" className="h-6 text-[10px]">Abrir</Button>
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Últimos Movimentos de Stock */}
                  <div className="border border-border/60 rounded-lg p-3 bg-muted/10 space-y-2">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-emerald-600" />
                      Últimos Movimentos ({recentMovements.length})
                    </span>
                    {recentMovements.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground py-2">Sem movimentos de stock registados.</p>
                    ) : (
                      <div className="space-y-1">
                        {recentMovements.map((mv) => (
                          <div key={mv.id} className="flex items-center justify-between p-2 rounded bg-background border border-border/50 text-xs">
                            <span className="font-mono text-[10px] text-muted-foreground">{mv.id.substring(0, 12)}…</span>
                            <span className="font-mono font-bold text-emerald-600">+{mv.quantity} un</span>
                            <Link to="/app/inventory/movements">
                              <Button size="sm" variant="ghost" className="h-6 text-[10px]">Ver</Button>
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Modal Criar/Editar Armazém */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingWarehouse ? "Editar Armazém" : "Novo Armazém da Empresa"}
            </DialogTitle>
            <DialogDescription>
              Registe os dados do armazém central ou depósito regional da empresa.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Código *</Label>
                <Input
                  placeholder="Ex: ARM-MAIN"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Nome *</Label>
                <Input
                  placeholder="Ex: Armazém Matola"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Endereço</Label>
              <Input
                placeholder="Av. das Indústrias, Parcela 45"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Província</Label>
                <Select value={province} onValueChange={setProvince}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MOZAMBIQUE_PROVINCES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Cidade / Município</Label>
                <Input
                  placeholder="Ex: Matola"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isMain"
                checked={isMainWarehouse}
                onChange={(e) => setIsMainWarehouse(e.target.checked)}
                className="rounded border-border"
              />
              <Label htmlFor="isMain" className="text-xs font-normal cursor-pointer">
                Definir este armazém como Armazém Principal da Empresa
              </Label>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm">
                Guardar Armazém
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
