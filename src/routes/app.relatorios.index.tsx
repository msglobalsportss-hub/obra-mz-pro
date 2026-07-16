import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/stat-card";
import { totalOrcamento, estadoObraLabel, type EstadoObra } from "@/lib/mock-data";
import { formatMZN } from "@/lib/format";
import { Download, TrendingUp, Wallet, TrendingDown, Users } from "lucide-react";
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";
import { useMemo, useState } from "react";
import { useObraMZStore, totalsPorCliente } from "@/store/obramz-store";
import { toast } from "sonner";

export const Route = createFileRoute("/app/relatorios/")({ component: Relatorios });

function Relatorios() {
  const clientes = useObraMZStore((s) => s.clientes);
  const obras = useObraMZStore((s) => s.obras);
  const orcamentos = useObraMZStore((s) => s.orcamentos);
  const pagamentos = useObraMZStore((s) => s.pagamentos);

  const [de, setDe] = useState("2026-01-01");
  const [ate, setAte] = useState(new Date().toISOString().slice(0, 10));
  const [clienteFiltro, setClienteFiltro] = useState<string>("all");

  const inRange = (iso: string) => iso >= de && iso <= ate;

  const orcFiltrados = orcamentos.filter((o) => inRange(o.emissao) && (clienteFiltro === "all" || o.clienteId === clienteFiltro));
  const pagFiltrados = pagamentos.filter((p) => inRange(p.data) && p.estado === "confirmado" && (clienteFiltro === "all" || p.clienteId === clienteFiltro));

  const totalOrc = orcFiltrados.reduce((s, o) => s + totalOrcamento(o).total, 0);
  const totalPag = pagFiltrados.reduce((s, p) => s + p.valor, 0);
  const pendente = Math.max(0, totalOrc - totalPag);

  const chartMensal = useMemo(() => {
    const start = new Date(de);
    const end = new Date(ate);
    const months: { key: string; label: string }[] = [];
    const cur = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cur <= end) {
      months.push({
        key: `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}`,
        label: cur.toLocaleDateString("pt-PT", { month: "short", year: "2-digit" }),
      });
      cur.setMonth(cur.getMonth() + 1);
    }
    return months.map((m) => ({
      mes: m.label,
      orcado: orcFiltrados.filter((o) => o.emissao.startsWith(m.key)).reduce((s, o) => s + totalOrcamento(o).total, 0),
      recebido: pagFiltrados.filter((p) => p.data.startsWith(m.key)).reduce((s, p) => s + p.valor, 0),
    }));
  }, [de, ate, orcFiltrados, pagFiltrados]);

  const clientesTop = useMemo(() => {
    const rank = clientes.map((c) => ({ c, t: totalsPorCliente(c.id) }));
    return rank.sort((a, b) => b.t.recebido - a.t.recebido).slice(0, 5);
  }, [clientes]);

  const obrasPorEstado = (Object.keys(estadoObraLabel) as EstadoObra[]).map((e) => ({
    estado: estadoObraLabel[e],
    total: obras.filter((o) => o.estado === e).length,
  }));

  const exportCsv = () => {
    const rows = [
      ["Tipo", "Data", "Cliente/Obra", "Referência/Nº", "Valor"],
      ...orcFiltrados.map((o) => ["Orçamento", o.emissao, clientes.find((c) => c.id === o.clienteId)?.nome ?? "", o.numero, String(totalOrcamento(o).total)]),
      ...pagFiltrados.map((p) => ["Pagamento", p.data, clientes.find((c) => c.id === p.clienteId)?.nome ?? "", p.referencia, String(p.valor)]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-obramz-${de}-${ate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório exportado (CSV)");
  };

  const maxRec = clientesTop[0]?.t.recebido || 1;

  return (
    <div>
      <PageHeader
        title="Relatórios"
        description="Análise financeira e operacional da sua empresa."
        actions={<Button variant="outline" onClick={exportCsv}><Download className="mr-1 h-4 w-4" />Exportar CSV</Button>}
      />

      <Card className="mb-6 p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1"><Label className="text-xs">De</Label><Input type="date" value={de} onChange={(e) => setDe(e.target.value)} /></div>
          <div className="space-y-1"><Label className="text-xs">Até</Label><Input type="date" value={ate} onChange={(e) => setAte(e.target.value)} /></div>
          <div className="space-y-1">
            <Label className="text-xs">Cliente</Label>
            <Select value={clienteFiltro} onValueChange={setClienteFiltro}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total orçamentos" value={formatMZN(totalOrc)} icon={TrendingUp} tone="primary" />
        <StatCard label="Recebimentos" value={formatMZN(totalPag)} icon={Wallet} tone="success" />
        <StatCard label="Valores pendentes" value={formatMZN(pendente)} icon={TrendingDown} tone="warning" />
        <StatCard label="Clientes" value={clientes.length} icon={Users} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 text-sm font-semibold">Desempenho mensal</div>
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={chartMensal}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mes" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatMZN(v)} />
                <Legend />
                <Line type="monotone" dataKey="orcado" stroke="hsl(var(--primary))" strokeWidth={2.5} name="Orçado" />
                <Line type="monotone" dataKey="recebido" stroke="hsl(var(--success))" strokeWidth={2.5} name="Recebido" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-3 text-sm font-semibold">Obras por estado</div>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={obrasPorEstado}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="estado" fontSize={11} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <div className="mb-3 text-sm font-semibold">Clientes com maior volume recebido</div>
          {clientesTop.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Sem dados.</div>
          ) : (
            <div className="divide-y">
              {clientesTop.map(({ c, t }, i) => (
                <div key={c.id} className="flex items-center gap-3 py-3">
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary-dark">{i + 1}</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{c.nome}</div>
                    <div className="text-xs text-muted-foreground">{[c.cidade, c.provincia].filter(Boolean).join(", ")}</div>
                  </div>
                  <div className="w-40">
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (t.recebido / maxRec) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="w-32 text-right font-semibold">{formatMZN(t.recebido)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
