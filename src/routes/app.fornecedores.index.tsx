import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useObraMZStore } from "@/store/obramz-store";
import type { Supplier } from "@/lib/suppliers";
import { MOZAMBIQUE_PROVINCES } from "@/lib/suppliers";
import { PageHeader } from "@/components/page-header";
import { PageContainer } from "@/components/shared/page-container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, Plus, Search, Filter, Star, Eye, Edit, CheckCircle2, XCircle, PackageCheck, Phone, MapPin } from "lucide-react";
import { SupplierFormDialog } from "@/components/suppliers/supplier-form-dialog";
import { SupplierDetailsDialog } from "@/components/suppliers/supplier-details-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/app/fornecedores/")({
  component: SuppliersPage,
});

function SuppliersPage() {
  const suppliers = useObraMZStore((s) => s.suppliers || []);
  const supplierMaterials = useObraMZStore((s) => s.supplierMaterials || []);
  const activateSupplier = useObraMZStore((s) => s.activateSupplier);
  const deactivateSupplier = useObraMZStore((s) => s.deactivateSupplier);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [provinceFilter, setProvinceFilter] = useState("all");
  const [hasMaterialsFilter, setHasMaterialsFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "rating" | "materialsCount" | "createdAt">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [formOpen, setFormOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Mapeamento de contagem de materiais por fornecedor
  const materialsCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of supplierMaterials) {
      if (r.status === "active") {
        map.set(r.supplierId, (map.get(r.supplierId) || 0) + 1);
      }
    }
    return map;
  }, [supplierMaterials]);

  // Cálculo de Métricas Resumo
  const summary = useMemo(() => {
    const totalSuppliers = suppliers.length;
    const activeSuppliers = suppliers.filter((s) => s.status === "active").length;
    const inactiveSuppliers = suppliers.filter((s) => s.status === "inactive").length;
    const suppliersWithMaterials = suppliers.filter((s) => (materialsCountMap.get(s.id) || 0) > 0).length;
    const activeRelsCount = supplierMaterials.filter((r) => r.status === "active").length;
    return { totalSuppliers, activeSuppliers, inactiveSuppliers, suppliersWithMaterials, activeRelsCount };
  }, [suppliers, supplierMaterials, materialsCountMap]);

  // Filtragem e Ordenação
  const filteredSuppliers = useMemo(() => {
    let result = [...suppliers];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.legalName && s.legalName.toLowerCase().includes(q)) ||
          (s.nuit && s.nuit.toLowerCase().includes(q)) ||
          s.phone.toLowerCase().includes(q) ||
          (s.email && s.email.toLowerCase().includes(q)) ||
          s.city.toLowerCase().includes(q) ||
          s.province.toLowerCase().includes(q) ||
          (s.contactPerson && s.contactPerson.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((s) => s.status === statusFilter);
    }

    if (provinceFilter !== "all") {
      result = result.filter((s) => s.province === provinceFilter);
    }

    if (hasMaterialsFilter === "with") {
      result = result.filter((s) => (materialsCountMap.get(s.id) || 0) > 0);
    } else if (hasMaterialsFilter === "without") {
      result = result.filter((s) => (materialsCountMap.get(s.id) || 0) === 0);
    }

    result.sort((a, b) => {
      let comp = 0;
      if (sortBy === "name") {
        comp = a.name.localeCompare(b.name);
      } else if (sortBy === "rating") {
        comp = (b.rating || 0) - (a.rating || 0);
      } else if (sortBy === "materialsCount") {
        comp = (materialsCountMap.get(b.id) || 0) - (materialsCountMap.get(a.id) || 0);
      } else if (sortBy === "createdAt") {
        comp = b.createdAt.localeCompare(a.createdAt);
      }
      return sortOrder === "asc" ? comp : -comp;
    });

    return result;
  }, [suppliers, searchQuery, statusFilter, provinceFilter, hasMaterialsFilter, sortBy, sortOrder, materialsCountMap]);

  const handleOpenCreate = () => {
    setSelectedSupplier(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    setSelectedSupplier(sup);
    setFormOpen(true);
  };

  const handleOpenDetails = (sup: Supplier) => {
    setSelectedSupplier(sup);
    setDetailsOpen(true);
  };

  const handleToggleStatus = (sup: Supplier) => {
    try {
      if (sup.status === "active") {
        deactivateSupplier(sup.id);
        toast.info(`Fornecedor "${sup.name}" desativado.`);
      } else {
        activateSupplier(sup.id);
        toast.success(`Fornecedor "${sup.name}" reativado.`);
      }
    } catch (e: any) {
      toast.error(e.message || "Erro ao alterar estado.");
    }
  };
  return (
    <PageContainer>
      <PageHeader
        title="Catálogo de Fornecedores"
        description="Gestão da rede de fornecedores, contactos comerciais e cotações de materiais."
        breadcrumbs={[{ label: "Fornecedores" }]}
        actions={
          <Button onClick={handleOpenCreate} className="bg-orange-600 hover:bg-orange-700 text-white shadow-sm text-xs font-semibold">
            <Plus className="h-4 w-4 mr-1.5" /> Novo Fornecedor
          </Button>
        }
      />

      {/* Cartões Resumo */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground font-medium">Total Fornecedores</div>
          <div className="text-2xl font-bold mt-1">{summary.totalSuppliers}</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-success">
          <div className="text-xs text-muted-foreground font-medium">Fornecedores Ativos</div>
          <div className="text-2xl font-bold mt-1 text-success">{summary.activeSuppliers}</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-muted">
          <div className="text-xs text-muted-foreground font-medium">Fornecedores Inativos</div>
          <div className="text-2xl font-bold mt-1 text-muted-foreground">{summary.inactiveSuppliers}</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-primary">
          <div className="text-xs text-muted-foreground font-medium">Com Materiais</div>
          <div className="text-2xl font-bold mt-1 text-primary">{summary.suppliersWithMaterials}</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-amber-500">
          <div className="text-xs text-muted-foreground font-medium">Cotações Ativas</div>
          <div className="text-2xl font-bold mt-1 text-amber-600">{summary.activeRelsCount}</div>
        </Card>
      </div>

      {/* Barra de Pesquisa e Filtros */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por nome, NUIT, telefone, cidade, província ou contacto..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-[130px]">
                <Filter className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Estados</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={provinceFilter} onValueChange={setProvinceFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Província" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Províncias</SelectItem>
                {MOZAMBIQUE_PROVINCES.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={hasMaterialsFilter} onValueChange={setHasMaterialsFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Materiais" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Artigos</SelectItem>
                <SelectItem value="with">Com Materiais</SelectItem>
                <SelectItem value="without">Sem Materiais</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Por Nome</SelectItem>
                <SelectItem value="rating">Por Avaliação</SelectItem>
                <SelectItem value="materialsCount">Por Materiais</SelectItem>
                <SelectItem value="createdAt">Por Registo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Tabela Desktop */}
      <div className="hidden md:block border rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fornecedor / Razão Social</TableHead>
              <TableHead>Contactos</TableHead>
              <TableHead>Localização</TableHead>
              <TableHead className="text-center">Materiais</TableHead>
              <TableHead className="text-center">Avaliação</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSuppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                  Nenhum fornecedor encontrado para os filtros selecionados.
                </TableCell>
              </TableRow>
            ) : (
              filteredSuppliers.map((sup) => {
                const count = materialsCountMap.get(sup.id) || 0;
                return (
                  <TableRow key={sup.id} className={sup.status === "inactive" ? "opacity-60 bg-muted/10" : ""}>
                    <TableCell>
                      <div className="font-semibold text-sm flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary shrink-0" />
                        <span>{sup.name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground pl-6">
                        {sup.legalName ? `${sup.legalName} · ` : ""}
                        NUIT: {sup.nuit || "—"}
                      </div>
                    </TableCell>

                    <TableCell className="text-xs">
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{sup.phone}</span>
                      </div>
                      {sup.contactPerson && (
                        <div className="text-muted-foreground mt-0.5">
                          Contacto: {sup.contactPerson}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="text-xs">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{sup.city}, {sup.province}</span>
                      </div>
                      <div className="text-muted-foreground">{sup.country}</div>
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge variant={count > 0 ? "outline" : "secondary"} className="text-xs">
                        <PackageCheck className="h-3 w-3 mr-1" />
                        {count} {count === 1 ? "artigo" : "artigos"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        {Array.from({ length: sup.rating || 4 }).map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge variant={sup.status === "active" ? "default" : "secondary"}>
                        {sup.status === "active" ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleOpenDetails(sup)} title="Ver Detalhes">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleOpenEdit(sup)} title="Editar">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className={`h-8 w-8 p-0 ${sup.status === "active" ? "text-destructive" : "text-success"}`}
                          onClick={() => handleToggleStatus(sup)}
                          title={sup.status === "active" ? "Desativar" : "Reactivar"}
                        >
                          {sup.status === "active" ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Cards Responsivos Mobile */}
      <div className="grid gap-3 md:hidden">
        {filteredSuppliers.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            Nenhum fornecedor encontrado.
          </Card>
        ) : (
          filteredSuppliers.map((sup) => {
            const count = materialsCountMap.get(sup.id) || 0;
            return (
              <Card key={sup.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-base flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-primary shrink-0" />
                      <span>{sup.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {sup.legalName ? `${sup.legalName} · ` : ""}
                      NUIT: {sup.nuit || "—"}
                    </div>
                  </div>
                  <Badge variant={sup.status === "active" ? "default" : "secondary"}>
                    {sup.status === "active" ? "Ativo" : "Inativo"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs border-y py-2">
                  <div>
                    <span className="text-muted-foreground">Local: </span>
                    <span className="font-medium">{sup.city}, {sup.province}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tel: </span>
                    <span className="font-medium">{sup.phone}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Artigos: </span>
                    <span className="font-medium">{count} associados</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: sup.rating || 4 }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => handleOpenDetails(sup)}>
                    <Eye className="h-3.5 w-3.5 mr-1" /> Detalhes
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleOpenEdit(sup)}>
                    <Edit className="h-3.5 w-3.5 mr-1" /> Editar
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      <SupplierFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        supplierToEdit={selectedSupplier}
      />

      <SupplierDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        supplier={selectedSupplier}
        onEditSupplier={handleOpenEdit}
      />
    </PageContainer>
  );
}
