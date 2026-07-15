import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/stat-card";
import {
  chartMensal, orcamentos, pagamentos, clientes, clienteById, obras, totalOrcamento, estadoObraLabel,
} from "@/lib/mock-data";
import { formatMZN } from "@/lib/format";
import { Download, TrendingUp, Wallet, TrendingDown, Users } from "lucide-react";
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";

export const Route = createFileRoute("/app/relatorios/")({ component: Relatorios });

function Relatorios() {
  const totalOrc = orcamentos.reduce((s, o) => s + totalOrcamento(o).total, 0);
  const totalPag = pagamentos.reduce((s, p) => s + p.valor, 0);
  const pendente = Math.max(0, totalOrc - totalPag);

  const clientesTop = [...clientes].sort((a, b) => b.valorTotal - a.valorTotal).slice(0, 5);
  const obrasPorEstado = ["planeada", "em_andamento", "suspensa", "concluida", "cancelada"].map((e) => ({
    estado: estadoObraLabel[e as keyof typeof estadoObraLabel],
    total: obras.filter((o) => o.estado === e).length,
  }));

  return (
    <div>
      <PageHeader
        title="Relatórios"
        description="Análise financeira e operacional da sua empresa."
        actions={<Button variant="outline"><Download className="mr-1 h-4 w-4" />Exportar</Button>}
      />

      <Card className="mb-6 p-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="space-y-1"><Label className="text-xs">De</Label><Input type="date" defaultValue="2026-01-01" /></div>
          <div className="space-y-1"><Label className="text-xs">Até</Label><Input type="date" defaultValue="2026-07-31" /></div>
          <div className="space-y-1">
            <Label className="text-xs">Cliente</Label>
            <Select defaultValue="all"><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Estado</Label>
            <Select defaultValue="all"><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="aceite">Aceite</SelectItem>
                <SelectItem value="enviado">Enviado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total orçamentos" value={formatMZN(totalOrc)} icon={TrendingUp} tone="primary" />
        <StatCard label="Recebimentos" value={formatMZN(totalPag)} icon={Wallet} tone="success" />
        <StatCard label="Valores pendentes" value={formatMZN(pendente)} icon={TrendingDown} tone="warning" />
        <StatCard label="Clientes ativos" value={clientes.length} icon={Users} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 text-sm font-semibold">Desempenho mensal</div>
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={chartMensal}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="mes" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatMZN(v)} />
                <Legend />
                <Line type="monotone" dataKey="orcado" stroke="var(--color-primary)" strokeWidth={2.5} name="Orçado" />
                <Line type="monotone" dataKey="recebido" stroke="var(--color-success)" strokeWidth={2.5} name="Recebido" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-3 text-sm font-semibold">Obras por estado</div>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={obrasPorEstado}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="estado" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <div className="mb-3 text-sm font-semibold">Clientes com maior volume</div>
          <div className="divide-y">
            {clientesTop.map((c, i) => (
              <div key={c.id} className="flex items-center gap-3 py-3">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary-dark">{i + 1}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{c.nome}</div>
                  <div className="text-xs text-muted-foreground">{c.cidade}, {c.provincia}</div>
                </div>
                <div className="w-40">
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(c.valorTotal / clientesTop[0].valorTotal) * 100}%` }} />
                  </div>
                </div>
                <div className="w-32 text-right font-semibold">{formatMZN(c.valorTotal)}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 text-xs text-muted-foreground">Dados apresentados para demonstração.</div>
      <div className="hidden">{clienteById("c1")?.nome}</div>
    </div>
  );
}
