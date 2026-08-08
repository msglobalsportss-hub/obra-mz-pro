/**
 * Módulo Relatórios: Relatorios
 * Rota: /app/relatorios
 *
 * Análise transversal organizada pela forma como o gerente pensa:
 * - Obras
 * - Materiais
 * - Compras
 * - Equipas
 * - Financeiro
 */

import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { PageContainer } from "@/components/shared/page-container";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { totalOrcamento, estadoObraLabel, type EstadoObra } from "@/lib/mock-data";
import { formatMZN } from "@/lib/format";
import {
  Download,
  HardHat,
  Package,
  ShoppingCart,
  Users,
  Wallet,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { useMemo, useState } from "react";
import { useObraMZStore, totalsPorCliente } from "@/store/obramz-store";
import { inventoryStoreManager } from "@/modules/inventory/store/inventory-store";
import { DEFAULT_INITIAL_WAREHOUSES } from "@/lib/materials/warehouse";
import { toast } from "sonner";

export const Route = createFileRoute("/app/relatorios/")({ component: Relatorios });

function Relatorios() {
  const clientes = useObraMZStore((s) => s.clientes || []);
  const obras = useObraMZStore((s) => s.obras || []);
  const orcamentos = useObraMZStore((s) => s.orcamentos || []);
  const pagamentos = useObraMZStore((s) => s.pagamentos || []);
  const materials = useObraMZStore((s) => s.materials || []);
  const purchaseOrders = useObraMZStore((s) => s.purchaseOrders || []);
  const suppliers = useObraMZStore((s) => s.suppliers || []);
  const workers = useObraMZStore((s) => s.workers || []);
  const warehouses = useObraMZStore((s) => s.warehouses || DEFAULT_INITIAL_WAREHOUSES);

  const [activeTab, setActiveTab] = useState("obras");
  const [de, setDe] = useState("2026-01-01");
  const [ate, setAte] = useState(new Date().toISOString().slice(0, 10));

  const inRange = (iso: string) => iso >= de && iso <= ate;

  const orcFiltrados = orcamentos.filter((o) => inRange(o.emissao));
  const pagFiltrados = pagamentos.filter((p) => inRange(p.data) && p.estado === "confirmado");

  const totalOrc = orcFiltrados.reduce((s, o) => s + totalOrcamento(o).total, 0);
  const totalPag = pagFiltrados.reduce((s, p) => s + p.valor, 0);

  // Mapeamento de Inventário
  const inventoryBalances = Object.values(inventoryStoreManager.getState().balances);
  const totalInventoryValue = inventoryBalances.reduce((s, b) => s + b.totalValue, 0);

  const exportCsv = () => {
    const rows = [
      ["Tipo", "Data", "Descrição / Referência", "Valor"],
      ...orcFiltrados.map((o) => [
        "Orçamento",
        o.emissao,
        o.numero,
        String(totalOrcamento(o).total),
      ]),
      ...pagFiltrados.map((p) => ["Pagamento", p.data, p.referencia, String(p.valor)]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-${activeTab}-obramz-${de}-${ate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório exportado em formato CSV!");
  };

  return (
    <PageContainer>
      <PageHeader
        title="Relatórios Operacionais & Financeiros"
        description="Indicadores transversais de gestão organizados por domínio de negócio"
        breadcrumbs={[{ label: "Início", href: "/app" }, { label: "Relatórios" }]}
        actions={
          <Button variant="outline" size="sm" onClick={exportCsv} className="gap-1.5 text-xs">
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </Button>
        }
      />

      {/* Filtro por Período */}
      <Card className="mb-4 p-3 border-border/60">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Data de Início</Label>
            <Input
              type="date"
              value={de}
              onChange={(e) => setDe(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Data de Fim</Label>
            <Input
              type="date"
              value={ate}
              onChange={(e) => setAte(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
        </div>
      </Card>

      {/* Tabs por Lógica do Gerente */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/60 p-1">
          <TabsTrigger value="obras" className="gap-2 text-xs">
            <HardHat className="w-3.5 h-3.5" />
            <span>Obras</span>
          </TabsTrigger>
          <TabsTrigger value="materiais" className="gap-2 text-xs">
            <Package className="w-3.5 h-3.5" />
            <span>Materiais</span>
          </TabsTrigger>
          <TabsTrigger value="compras" className="gap-2 text-xs">
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Compras</span>
          </TabsTrigger>
          <TabsTrigger value="equipas" className="gap-2 text-xs">
            <Users className="w-3.5 h-3.5" />
            <span>Equipas</span>
          </TabsTrigger>
          <TabsTrigger value="financeiro" className="gap-2 text-xs">
            <Wallet className="w-3.5 h-3.5" />
            <span>Financeiro</span>
          </TabsTrigger>
        </TabsList>

        {/* 1. OBRAS */}
        <TabsContent value="obras" className="mt-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="p-4 border-border/60">
              <div className="text-xs text-muted-foreground font-medium">Obras em Andamento</div>
              <div className="text-2xl font-bold mt-1 text-blue-600">
                {obras.filter((o) => o.estado === "em_andamento").length}
              </div>
            </Card>
            <Card className="p-4 border-border/60">
              <div className="text-xs text-muted-foreground font-medium">Obras Concluídas</div>
              <div className="text-2xl font-bold mt-1 text-emerald-600">
                {obras.filter((o) => o.estado === "concluida").length}
              </div>
            </Card>
            <Card className="p-4 border-border/60">
              <div className="text-xs text-muted-foreground font-medium">
                Valor Total Orçado em Obras
              </div>
              <div className="text-2xl font-bold mt-1">
                {formatMZN(obras.reduce((s, o) => s + (o.valorPrevisto || 0), 0))}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* 2. MATERIAIS */}
        <TabsContent value="materiais" className="mt-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="p-4 border-border/60">
              <div className="text-xs text-muted-foreground font-medium">
                Valor Total em Inventário (WAC)
              </div>
              <div className="text-2xl font-bold mt-1 text-emerald-600">
                {formatMZN(totalInventoryValue)}
              </div>
            </Card>
            <Card className="p-4 border-border/60">
              <div className="text-xs text-muted-foreground font-medium">
                Total de Armazéns Ativos
              </div>
              <div className="text-2xl font-bold mt-1">
                {warehouses.filter((w) => w.isActive).length}
              </div>
            </Card>
            <Card className="p-4 border-border/60">
              <div className="text-xs text-muted-foreground font-medium">SKUs Cadastrados</div>
              <div className="text-2xl font-bold mt-1">{materials.length}</div>
            </Card>
          </div>
        </TabsContent>

        {/* 3. COMPRAS */}
        <TabsContent value="compras" className="mt-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="p-4 border-border/60">
              <div className="text-xs text-muted-foreground font-medium">
                Pedidos de Compra Criados
              </div>
              <div className="text-2xl font-bold mt-1">{purchaseOrders.length}</div>
            </Card>
            <Card className="p-4 border-border/60">
              <div className="text-xs text-muted-foreground font-medium">
                Fornecedores Registados
              </div>
              <div className="text-2xl font-bold mt-1">{suppliers.length}</div>
            </Card>
            <Card className="p-4 border-border/60">
              <div className="text-xs text-muted-foreground font-medium">
                Volume Total de Compras
              </div>
              <div className="text-2xl font-bold mt-1">
                {formatMZN(purchaseOrders.reduce((s, p) => s + (p.totalAmount || 0), 0))}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* 4. EQUIPAS */}
        <TabsContent value="equipas" className="mt-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Card className="p-4 border-border/60">
              <div className="text-xs text-muted-foreground font-medium">
                Trabalhadores Registados
              </div>
              <div className="text-2xl font-bold mt-1">{workers.length}</div>
            </Card>
            <Card className="p-4 border-border/60">
              <div className="text-xs text-muted-foreground font-medium">Trabalhadores Ativos</div>
              <div className="text-2xl font-bold mt-1 text-emerald-600">
                {workers.filter((w) => w.status === "active").length}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* 5. FINANCEIRO */}
        <TabsContent value="financeiro" className="mt-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="p-4 border-border/60">
              <div className="text-xs text-muted-foreground font-medium">Total Orçado</div>
              <div className="text-2xl font-bold mt-1">{formatMZN(totalOrc)}</div>
            </Card>
            <Card className="p-4 border-border/60">
              <div className="text-xs text-muted-foreground font-medium">
                Total Recebido (Caixa)
              </div>
              <div className="text-2xl font-bold mt-1 text-emerald-600">{formatMZN(totalPag)}</div>
            </Card>
            <Card className="p-4 border-border/60">
              <div className="text-xs text-muted-foreground font-medium">
                Pendente de Recebimento
              </div>
              <div className="text-2xl font-bold mt-1 text-amber-600">
                {formatMZN(Math.max(0, totalOrc - totalPag))}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
