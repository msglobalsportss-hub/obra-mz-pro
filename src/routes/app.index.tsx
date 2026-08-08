import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, StatusBadge } from "@/components/page-header";
import { PageContainer } from "@/components/shared/page-container";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  HardHat, FileText, Wallet, Users, TrendingUp, TrendingDown,
  Plus, UserPlus, FilePlus, WalletCards,
} from "lucide-react";
import { useObraMZStore, metricasGlobais } from "@/store/obramz-store";
import { totalOrcamento, estadoOrcamentoLabel } from "@/lib/mock-data";
import { formatDate, formatMZN } from "@/lib/format";
import {
  ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { useMemo } from "react";
import { useHydrated } from "@/hooks/use-hydrated";

export const Route = createFileRoute("/app/")({ component: Dashboard });

const ESTADO_COLORS: Record<string, string> = {
  rascunho: "hsl(var(--muted-foreground))",
  enviado: "hsl(var(--primary))",
  visualizado: "#0284c7",
  aceite: "hsl(var(--success))",
  rejeitado: "hsl(var(--destructive))",
  expirado: "#a16207",
  cancelado: "#64748b",
};

function Dashboard() {
  const hydrated = useHydrated();
  const clientes = useObraMZStore((s) => s.clientes || []);
  const obras = useObraMZStore((s) => s.obras || []);
  const orcamentos = useObraMZStore((s) => s.orcamentos || []);
  const pagamentos = useObraMZStore((s) => s.pagamentos || []);
  const atividades = useObraMZStore((s) => s.atividades || []);
  const empresa = useObraMZStore((s) => s.empresa);
  const utilizador = useObraMZStore((s) => s.utilizador);

  const m = useMemo(() => metricasGlobais({
    clientes, obras, orcamentos, pagamentos,
  } as any), [clientes, obras, orcamentos, pagamentos]);

  const clienteById = (id: string) => clientes.find((c) => c.id === id);
  const obraById = (id?: string) => (id ? obras.find((o) => o.id === id) : undefined);

  const saudacao = hydrated
    ? (() => {
        const h = new Date().getHours();
        return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
      })()
    : "Olá";

  const obrasAtivas = (obras || []).filter((o) => o && o.estado === "em_andamento").slice(0, 4);
  const orcRecentes = [...(orcamentos || [])]
    .filter((o) => o && o.emissao)
    .sort((a, b) => (b.emissao || "").localeCompare(a.emissao || ""))
    .slice(0, 5);
  const pagRecentes = [...(pagamentos || [])]
    .filter((p) => p && p.data)
    .sort((a, b) => (b.data || "").localeCompare(a.data || ""))
    .slice(0, 5);

  // Chart mensal — últimos 7 meses
  const chartMensal = useMemo(() => {
    const now = new Date();
    const meses: { key: string; label: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      meses.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: d.toLocaleDateString("pt-PT", { month: "short" }),
      });
    }
    return meses.map((m) => {
      const orc = (orcamentos || [])
        .filter((o) => o && typeof o.emissao === "string" && o.emissao.startsWith(m.key))
        .reduce((s, o) => s + totalOrcamento(o).total, 0);
      const rec = (pagamentos || [])
        .filter((p) => p && typeof p.data === "string" && p.data.startsWith(m.key) && p.estado === "confirmado")
        .reduce((s, p) => s + (p.valor || 0), 0);
      return { mes: m.label, orcado: orc, recebido: rec };
    });
  }, [orcamentos, pagamentos]);

  const chartEstados = useMemo(() => {
    const grouped = new Map<string, number>();
    for (const o of (orcamentos || [])) {
      if (o && o.estado) {
        grouped.set(o.estado, (grouped.get(o.estado) ?? 0) + 1);
      }
    }
    return Array.from(grouped.entries()).map(([estado, valor]) => ({
      nome: estadoOrcamentoLabel[estado as keyof typeof estadoOrcamentoLabel] || estado,
      valor,
      cor: ESTADO_COLORS[estado] || "hsl(var(--muted-foreground))",
    }));
  }, [orcamentos]);

  return (
    <PageContainer>
      <PageHeader
        title={
          <span>
            {saudacao}, <span className="text-orange-600">{(utilizador?.nome || "Utilizador").split(" ")[0]}</span>
          </span>
        }
        description={<>{empresa?.nome || "ObraMZ"}{hydrated && <> · {formatDate(new Date().toISOString())}</>}</>}
        actions={
          <>
            <Link to="/app/obras"><Button variant="outline" className="text-xs h-9"><Plus className="mr-1 h-4 w-4" />Nova obra</Button></Link>
            <Link to="/app/orcamentos/novo"><Button className="bg-orange-600 hover:bg-orange-700 text-white shadow-sm text-xs font-semibold h-9"><Plus className="mr-1 h-4 w-4" />Novo orçamento</Button></Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Obras ativas" value={m.obrasAtivas} icon={HardHat} tone="primary" />
        <StatCard label="Orçamentos" value={m.orcamentosEmitidos} icon={FileText} tone="primary" />
        <StatCard label="Total orçado" value={formatMZN(m.totalOrcado)} icon={TrendingUp} tone="success" />
        <StatCard label="Total recebido" value={formatMZN(m.totalRecebido)} icon={Wallet} tone="success" />
        <StatCard label="Pendente" value={formatMZN(m.pendente)} icon={TrendingDown} tone="warning" />
        <StatCard label="Clientes" value={m.clientesRegistados} icon={Users} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4">
            <div className="text-sm font-semibold">Orçamentos vs Recebimentos</div>
            <div className="text-xs text-muted-foreground">Últimos 7 meses (MZN)</div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartMensal}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mes" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatMZN(v)} />
                <Bar dataKey="orcado" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} name="Orçado" />
                <Bar dataKey="recebido" fill="hsl(var(--success))" radius={[6, 6, 0, 0]} name="Recebido" />
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
            {chartEstados.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartEstados} dataKey="valor" nameKey="nome" innerRadius={45} outerRadius={80} paddingAngle={3}>
                    {chartEstados.map((e, i) => <Cell key={i} fill={e.cor} />)}
                  </Pie>
                  <Legend iconType="circle" formatter={(v) => <span className="text-xs">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="grid h-full place-items-center text-xs text-muted-foreground">Sem dados</div>}
          </div>
        </Card>
      </div>

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

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-semibold">Progresso das obras ativas</div>
            <Link to="/app/obras" className="text-xs font-semibold text-primary">Ver todas</Link>
          </div>
          {obrasAtivas.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">Sem obras em andamento.</div>
          ) : (
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
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-semibold">Orçamentos recentes</div>
            <Link to="/app/orcamentos" className="text-xs font-semibold text-primary">Ver todos</Link>
          </div>
          {orcRecentes.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">Sem orçamentos.</div>
          ) : (
            <div className="divide-y divide-border">
              {orcRecentes.map((o) => (
                <Link key={o.id} to="/app/orcamentos/$id" params={{ id: o.id }} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:bg-muted/30 -mx-2 px-2 rounded">
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
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-semibold">Pagamentos recentes</div>
            <Link to="/app/pagamentos" className="text-xs font-semibold text-primary">Ver todos</Link>
          </div>
          {pagRecentes.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">Sem pagamentos.</div>
          ) : (
            <div className="divide-y divide-border">
              {pagRecentes.map((p) => (
                <div key={p.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-success-soft text-success">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{clienteById(p.clienteId)?.nome}</div>
                    <div className="truncate text-xs text-muted-foreground">{obraById(p.obraId)?.nome ?? "—"} · {p.referencia}</div>
                  </div>
                  <div className="hidden sm:block"><StatusBadge tone={p.estado === "confirmado" ? "success" : p.estado === "pendente" ? "warning" : "muted"}>{p.estado}</StatusBadge></div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{formatMZN(p.valor)}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(p.data)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-semibold">Atividade recente</div>
          </div>
          {atividades.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">Sem atividades.</div>
          ) : (
            <ol className="space-y-3">
              {atividades.slice(0, 6).map((a) => (
                <li key={a.id} className="flex gap-3 text-sm">
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{a.descricao}</div>
                    <div className="text-[11px] text-muted-foreground">{formatDate(a.data)}</div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </PageContainer>
  );
}
