/**
 * Módulo Materiais: MateriaisPage
 * Rota: /app/materiais
 *
 * Módulo Unificado de Materiais da Empresa (Fase 3.6).
 * Organização interna por separadores (Tabs):
 * 1. Visão Geral
 * 2. Cadastro de Materiais
 * 3. Stock
 * 4. Movimentos
 * 5. Ajustes
 */

import { useState, useMemo, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import type { Material } from "@/lib/mock-data";
import { useObraMZStore } from "@/store/obramz-store";
import { formatMZN, formatDate } from "@/lib/format";
import { runMaterialsTests } from "@/lib/materials";
import { PageHeader } from "@/components/page-header";
import { PageContainer } from "@/components/shared/page-container";
import { MaterialFormDialog } from "@/components/materials/material-form-dialog";
import { MaterialDetailsDialog } from "@/components/materials/material-details-dialog";
import { MaterialCategoryDialog } from "@/components/materials/material-category-dialog";
import { MaterialUnitDialog } from "@/components/materials/material-unit-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Package,
  Plus,
  Tag,
  Ruler,
  Search,
  Eye,
  Edit,
  CheckCircle2,
  XCircle,
  TrendingUp,
  AlertCircle,
  FilterX,
  Boxes,
  ArrowLeftRight,
  Settings,
  LayoutDashboard,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { InventoryDashboardView } from "@/modules/inventory/features/dashboard/inventory-dashboard-view";
import { StockListView } from "@/modules/inventory/features/stock/stock-list-view";
import { MovementsHistoryView } from "@/modules/inventory/features/movements/movements-history-view";
import { AdjustmentsListView } from "@/modules/inventory/features/adjustments/adjustments-list-view";

export const Route = createFileRoute("/app/materiais/")({
  component: MateriaisPage,
});

function MateriaisPage() {
  const materials = useObraMZStore((s) => s.materials || []);
  const categories = useObraMZStore((s) => s.materialCategories || []);
  const units = useObraMZStore((s) => s.materialUnits || []);
  const activateMaterial = useObraMZStore((s) => s.activateMaterial);
  const deactivateMaterial = useObraMZStore((s) => s.deactivateMaterial);

  const [activeTab, setActiveTab] = useState("overview");

  // Execução dos testes automatizados
  useEffect(() => {
    try {
      runMaterialsTests();
    } catch (e: unknown) {
      console.error("Erro nos testes de materiais:", e);
    }
  }, []);

  // Controlos de Dialogs do Cadastro
  const [formOpen, setFormOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [viewingMaterial, setViewingMaterial] = useState<Material | null>(null);

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);

  // Filtros do Cadastro
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [unitId, setUnitId] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [withoutPriceOnly, setWithoutPriceOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "price" | "createdAt">("name");

  // Mapas auxiliares
  const categoryMap = useMemo(() => {
    const map = new Map();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const unitMap = useMemo(() => {
    const map = new Map();
    units.forEach((u) => map.set(u.id, u));
    return map;
  }, [units]);

  // Resumo do Catálogo
  const summary = useMemo(() => {
    const total = materials.length;
    const active = materials.filter((m) => m.status === "active").length;
    const inactive = materials.filter((m) => m.status === "inactive").length;
    const activeCategories = categories.filter((c) => c.status === "active").length;
    const withoutPrice = materials.filter((m) => m.referencePrice === undefined).length;
    return { total, active, inactive, activeCategories, withoutPrice };
  }, [materials, categories]);

  // Filtragem dos Materiais
  const filteredMaterials = useMemo(() => {
    return materials
      .filter((m) => {
        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          const matchName = m.name.toLowerCase().includes(q);
          const matchCode = m.internalCode ? m.internalCode.toLowerCase().includes(q) : false;
          const matchSku = m.sku ? m.sku.toLowerCase().includes(q) : false;
          if (!matchName && !matchCode && !matchSku) return false;
        }
        if (categoryId !== "all" && m.categoryId !== categoryId) return false;
        if (unitId !== "all" && m.unitId !== unitId) return false;
        if (statusFilter !== "all" && m.status !== statusFilter) return false;
        if (withoutPriceOnly && m.referencePrice !== undefined) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          return a.name.localeCompare(b.name);
        } else if (sortBy === "price") {
          const priceA = a.referencePrice ?? -1;
          const priceB = b.referencePrice ?? -1;
          return priceB - priceA;
        } else if (sortBy === "createdAt") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return 0;
      });
  }, [materials, searchQuery, categoryId, unitId, statusFilter, withoutPriceOnly, sortBy]);

  const handleOpenCreate = () => {
    setEditingMaterial(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (material: Material) => {
    setEditingMaterial(material);
    setFormOpen(true);
  };

  const handleOpenDetails = (material: Material) => {
    setViewingMaterial(material);
    setDetailsOpen(true);
  };

  const handleToggleStatus = (material: Material) => {
    if (material.status === "active") {
      deactivateMaterial(material.id);
      toast.success(`Material "${material.name}" desativado.`);
    } else {
      activateMaterial(material.id);
      toast.success(`Material "${material.name}" reativado no catálogo.`);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryId("all");
    setUnitId("all");
    setStatusFilter("all");
    setWithoutPriceOnly(false);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Materiais & Suprimentos"
        description="Gestão mestre do catálogo, controlo de stock, transferências, movimentos e acertos"
        breadcrumbs={[
          { label: "Início", href: "/app" },
          { label: "Inventário" },
          { label: "Materiais" },
        ]}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/60 p-1">
          <TabsTrigger value="overview" className="gap-2 text-xs">
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="catalog" className="gap-2 text-xs">
            <Package className="w-3.5 h-3.5" />
            <span>Cadastro de Materiais</span>
          </TabsTrigger>
          <TabsTrigger value="stock" className="gap-2 text-xs">
            <Boxes className="w-3.5 h-3.5" />
            <span>Stock</span>
          </TabsTrigger>
          <TabsTrigger value="movements" className="gap-2 text-xs">
            <FileText className="w-3.5 h-3.5" />
            <span>Movimentos</span>
          </TabsTrigger>
          <TabsTrigger value="adjustments" className="gap-2 text-xs">
            <Settings className="w-3.5 h-3.5" />
            <span>Ajustes</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Visão Geral */}
        <TabsContent value="overview" className="mt-2">
          <InventoryDashboardView />
        </TabsContent>

        {/* TAB 2: Cadastro de Materiais */}
        <TabsContent value="catalog" className="mt-2 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setCategoryDialogOpen(true)}
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Categorias</span>
              </Button>
              <Button
                onClick={() => setUnitDialogOpen(true)}
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
              >
                <Ruler className="w-3.5 h-3.5" />
                <span>Unidades de Medida</span>
              </Button>
            </div>
            <Button onClick={handleOpenCreate} size="sm" className="gap-1.5 shadow-xs text-xs">
              <Plus className="w-4 h-4" />
              <span>Novo Material</span>
            </Button>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="p-3 border-border/60">
              <div className="text-xs text-muted-foreground font-medium">Total de Materiais</div>
              <div className="text-xl font-bold mt-1">{summary.total}</div>
            </Card>
            <Card className="p-3 border-border/60">
              <div className="text-xs text-muted-foreground font-medium">Materiais Ativos</div>
              <div className="text-xl font-bold mt-1 text-emerald-600">{summary.active}</div>
            </Card>
            <Card className="p-3 border-border/60">
              <div className="text-xs text-muted-foreground font-medium">Categorias Ativas</div>
              <div className="text-xl font-bold mt-1">{summary.activeCategories}</div>
            </Card>
            <Card className="p-3 border-border/60">
              <div className="text-xs text-muted-foreground font-medium">
                Sem Preço de Referência
              </div>
              <div className="text-xl font-bold mt-1 text-amber-600">{summary.withoutPrice}</div>
            </Card>
          </div>

          {/* Barra de Filtros */}
          <div className="flex flex-wrap items-center gap-2 bg-card p-3 rounded-lg border border-border/60">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por nome, código ou SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="w-[160px] h-9 text-xs">
                <SelectValue placeholder="Todas Categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={unitId} onValueChange={setUnitId}>
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue placeholder="Todas Unidades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Unidades</SelectItem>
                {units.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.symbol} ({u.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v: "all" | "active" | "inactive") => setStatusFilter(v)}
            >
              <SelectTrigger className="w-[120px] h-9 text-xs">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Estados</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabela de Materiais Mestre */}
          <Card className="border-border/60">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Material / Código</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead className="text-right">Preço de Referência</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaterials.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-muted-foreground text-xs"
                      >
                        Nenhum material encontrado no catálogo.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMaterials.map((m) => {
                      const cat = categoryMap.get(m.categoryId);
                      const unit = unitMap.get(m.unitId);
                      return (
                        <TableRow key={m.id} className="hover:bg-muted/30">
                          <TableCell className="font-semibold text-foreground">
                            {m.name}
                            {m.internalCode && (
                              <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                                [{m.internalCode}]
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {cat ? cat.name : "—"}
                          </TableCell>
                          <TableCell className="text-xs font-medium">
                            {unit ? `${unit.symbol}` : "—"}
                          </TableCell>
                          <TableCell className="text-right text-xs font-semibold">
                            {m.referencePrice !== undefined ? formatMZN(m.referencePrice) : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={m.status === "active" ? "outline" : "secondary"}
                              className="text-[10px]"
                            >
                              {m.status === "active" ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDetails(m)}
                                title="Ver Detalhes"
                              >
                                <Eye className="w-4 h-4 text-muted-foreground" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEdit(m)}
                                title="Editar Material"
                              >
                                <Edit className="w-4 h-4 text-muted-foreground" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleToggleStatus(m)}
                                title={
                                  m.status === "active" ? "Desativar Material" : "Reativar Material"
                                }
                              >
                                {m.status === "active" ? (
                                  <XCircle className="w-4 h-4 text-rose-500" />
                                ) : (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                )}
                              </Button>
                            </div>
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

        {/* TAB 3: Stock */}
        <TabsContent value="stock" className="mt-2">
          <StockListView />
        </TabsContent>

        {/* TAB 4: Movimentos (Kardex) */}
        <TabsContent value="movements" className="mt-2">
          <MovementsHistoryView />
        </TabsContent>

        {/* TAB 5: Ajustes */}
        <TabsContent value="adjustments" className="mt-2">
          <AdjustmentsListView />
        </TabsContent>
      </Tabs>

      {/* Modais de Cadastro de Materiais */}
      <MaterialFormDialog open={formOpen} onOpenChange={setFormOpen} material={editingMaterial} />
      {viewingMaterial && (
        <MaterialDetailsDialog
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          material={viewingMaterial}
        />
      )}
      <MaterialCategoryDialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen} />
      <MaterialUnitDialog open={unitDialogOpen} onOpenChange={setUnitDialogOpen} />
    </PageContainer>
  );
}
