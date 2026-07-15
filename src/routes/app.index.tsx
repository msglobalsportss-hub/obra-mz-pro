import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, StatusBadge } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  HardHat, FileText, Wallet, Users, TrendingUp, TrendingDown,
  Plus, AlertTriangle, Clock, UserPlus, FilePlus, WalletCards,
} from "lucide-react";
import {
  metricas, obras, orcamentos, pagamentos, clientes,
  clienteById, obraById, chartMensal, chartEstados,
  estadoObraLabel, estadoOrcamentoLabel, totalOrcamento, empresa, utilizador,
} from "@/lib/mock-data";
import { formatDate, formatMZN } from "@/lib/format";
import {
  ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/app/")({ component: Dashboard });

function Dashboard() {
  const m = metricas();
  const hoje = new Date();
  const saudacao = hoje.getHours() < 12 ? "Bom dia" : hoje.getHours() < 18 ? "Boa tarde" : "Boa noite";
  const obrasAtivas = obras.filter((o) => o.estado === "em_andamento").slice(0, 4);
  const orcRecentes = [...orcamentos].sort((a, b) => b.emissao.localeCompare(a.emissao)).slice(0, 5);
  const pagRecentes = [...pagamentos].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 5);

  return (
    <div>
      <PageHeader
        title={
          <span>
            {saudacao}, <span className="text-primary">{utilizador.nome.split(" ")[0]}</span>
          </span>
        }
        description={
          <>
            {empresa.nome} · {formatDate(hoje.toISOString())}
          </>
        }
        actions={
          <>
            <Link to="/app/obras"><Button variant="outline"><Plus className="mr-1 h-4 w-4" />Nova obra</Button></Link>
            <Link to="/app/orcamentos/novo"><Button className="bg-primary hover:bg-primary-dark"><Plus className="mr-1 h-4 w-4" />Novo orçamento</Button></Link>
          </>
        }
      />

      {/* Alertas */}
      <div className="mb-6 grid gap-3 md:grid-cols-2">
        <Card className="border-warning/40 bg-warning-soft/60 p-4">
          <div className="flex items-start gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-warning text-warning-foreground">
              <Clock className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-warning-foreground">2 orçamentos próximos de expirar</div>
              <div className="text-xs text-muted-foreground">Reveja e renove antes do prazo.</div>
            </div>
            <Link to="/app/orcamentos" className="ml-auto text-xs font-semibold text-primary">Ver</Link>
          </div>
        </Card>
        <Card className="border-destructive/30 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-destructive text-destructive-foreground">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-destructive">1 pagamento em atraso</div>
              <div className="text-xs text-muted-foreground">Cliente: Empresa Nova Vida, Lda.</div>
            </div>
            <Link to="/app/pagamentos" className="ml-auto text-xs font-semibold text-primary">Ver</Link>
          </div>
        </Card>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Obras ativas" value={m.obrasAtivas} icon={HardHat} tone="primary" />
        <StatCard label="Orçamentos" value={m.orcamentosEmitidos} icon={FileText} tone="primary" />
        <StatCard label="Total orçamentado" value={formatMZN(m.totalOrcado)} icon={TrendingUp} tone="success" />
        <StatCard label="Total recebido" value={formatMZN(m.totalRecebido)} icon={Wallet} tone="success" />
        <StatCard label="Pendente" value={formatMZN(m.pendente)} icon={TrendingDown} tone="warning" />
        <StatCard label="Clientes" value={m.clientesRegistados} icon={Users} />
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Orçamentos vs Recebimentos</div>
              <div className="text-xs text-muted-foreground">Últimos 7 meses (MZN)</div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartMensal}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="mes" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v: number) => formatMZN(v)}
                  contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)" }}
                />
                <Bar dataKey="orcado" fill="var(--color-primary)" radius={[6, 6, 0, 0]} name="Orçado" />
                <Bar dataKey="recebido" fill="var(--color-success)" radius={[6, 6, 0, 0]} name="Recebido" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <div className="mb-4">
            <div className="text-sm font-semibold">Estado dos orçamentos</div>
            <div className="text-xs text-muted-foreground">Distribuição atual</div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartEstados} dataKey="valor" nameKey="nome" innerRadius={45} outerRadius={80} paddingAngle={3}>
                  {chartEstados.map((e, i) => <Cell key={i} fill={e.cor} />)}
                </Pie>
                <Legend iconType="circle" formatter={(v) => <span className="text-xs">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Ações rápidas */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: UserPlus, t: "Criar cliente", to: "/app/clientes" },
          { icon: HardHat, t: "Criar obra", to: "/app/obras" },
          { icon: FilePlus, t: "Criar orçamento", to: "/app/orcamentos/novo" },
          { icon: WalletCards, t: "Registar pagamento", to: "/app/pagamentos" },
        ].map((a) => (
          <Link key={a.t} to={a.to}>
            <Card className="group cursor-pointer p-4 transition-colors hover:border-primary hover:bg-primary-soft/40">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary-soft text-primary-dark group-hover:bg-primary group-hover:text-primary-foreground">
                  <a.icon className="h-5 w-5" />
                </div>
                <div className="text-sm font-semibold">{a.t}</div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Lists */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-semibold">Progresso das obras ativas</div>
            <Link to="/app/obras" className="text-xs font-semibold text-primary">Ver todas</Link>
          </div>
          <div className="space-y-4">
            {obrasAtivas.map((o) => (
              <Link key={o.id} to="/app/obras/$id" params={{ id: o.id }} className="block">
                <div className="mb-1.5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{o.nome}</div>
                    <div className="text-xs text-muted-foreground">{clienteById(o.clienteId)?.nome} · {o.cidade}</div>
                  </div>
                  <div className="text-sm font-semibold text-primary">{o.progresso}%</div>
                </div>
                <Progress value={o.progresso} className="h-1.5" />
              </Link>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-semibold">Orçamentos recentes</div>
            <Link to="/app/orcamentos" className="text-xs font-semibold text-primary">Ver todos</Link>
          </div>
          <div className="divide-y divide-border">
            {orcRecentes.map((o) => (
              <div key={o.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-muted text-muted-foreground">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{o.numero}</div>
                  <div className="truncate text-xs text-muted-foreground">{clienteById(o.clienteId)?.nome}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{formatMZN(totalOrcamento(o).total)}</div>
                  <div className="text-xs text-muted-foreground">{estadoOrcamentoLabel[o.estado]}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-semibold">Pagamentos recentes</div>
            <Link to="/app/pagamentos" className="text-xs font-semibold text-primary">Ver todos</Link>
          </div>
          <div className="divide-y divide-border">
            {pagRecentes.map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-success-soft text-success">
                  <Wallet className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{clienteById(p.clienteId)?.nome}</div>
                  <div className="truncate text-xs text-muted-foreground">{obraById(p.obraId)?.nome} · {p.referencia}</div>
                </div>
                <div className="hidden sm:block">
                  <StatusBadge tone="success">Confirmado</StatusBadge>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{formatMZN(p.valor)}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(p.data)}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 rounded-lg border border-dashed border-border bg-muted/40 p-3 text-center text-xs text-muted-foreground">
        Dados apresentados para demonstração — não representam clientes ou obras reais.
      </div>
    </div>
  );
}

// keeps clientes reference in tree-shaking safe
void clientes;
void toast;
