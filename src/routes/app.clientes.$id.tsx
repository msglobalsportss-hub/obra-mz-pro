import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  clienteById, obras, orcamentos, pagamentos, totalOrcamento, estadoObraLabel, estadoOrcamentoLabel,
} from "@/lib/mock-data";
import { formatDate, formatMZN, initials } from "@/lib/format";
import { StatCard } from "@/components/stat-card";
import { Wallet, HardHat, FileText, TrendingDown, Phone, Mail, MapPin, Building2 } from "lucide-react";
import { StatusBadge } from "@/components/page-header";

export const Route = createFileRoute("/app/clientes/$id")({ component: ClienteDetalhe });

function ClienteDetalhe() {
  const { id } = useParams({ from: "/app/clientes/$id" });
  const c = clienteById(id);
  if (!c) return <div>Cliente não encontrado. <Link to="/app/clientes" className="text-primary">Voltar</Link></div>;

  const cObras = obras.filter((o) => o.clienteId === c.id);
  const cOrc = orcamentos.filter((o) => o.clienteId === c.id);
  const cPag = pagamentos.filter((p) => p.clienteId === c.id);
  const recebido = cPag.reduce((s, p) => s + p.valor, 0);
  const orcado = cOrc.filter((o) => o.estado === "aceite").reduce((s, o) => s + totalOrcamento(o).total, 0);

  return (
    <div>
      <PageHeader
        title={c.nome}
        description={<><Link to="/app/clientes" className="hover:text-primary">Clientes</Link> · {c.tipo === "empresa" ? "Empresa" : "Particular"}</>}
        actions={
          <>
            <Button variant="outline">Editar</Button>
            <Link to="/app/orcamentos/novo"><Button className="bg-primary hover:bg-primary-dark">Novo orçamento</Button></Link>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14"><AvatarFallback className="bg-primary-soft text-primary-dark font-bold">{initials(c.nome)}</AvatarFallback></Avatar>
            <div>
              <div className="font-semibold">{c.nome}</div>
              <div className="text-xs text-muted-foreground">NUIT {c.nuit}</div>
            </div>
          </div>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex items-start gap-2"><Phone className="mt-0.5 h-4 w-4 text-muted-foreground" /><span>{c.telefone}</span></div>
            <div className="flex items-start gap-2"><Mail className="mt-0.5 h-4 w-4 text-muted-foreground" /><span>{c.email}</span></div>
            <div className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" /><span>{c.endereco}, {c.cidade}, {c.provincia}</span></div>
            {c.tipo === "empresa" && <div className="flex items-start gap-2"><Building2 className="mt-0.5 h-4 w-4 text-muted-foreground" />Empresa</div>}
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          <StatCard label="Obras" value={cObras.length} icon={HardHat} tone="primary" />
          <StatCard label="Orçamentos" value={cOrc.length} icon={FileText} tone="primary" />
          <StatCard label="Recebido" value={formatMZN(recebido)} icon={Wallet} tone="success" />
          <StatCard label="Saldo pendente" value={formatMZN(Math.max(0, orcado - recebido))} icon={TrendingDown} tone="warning" />
        </div>
      </div>

      <Tabs defaultValue="obras" className="mt-6">
        <TabsList>
          <TabsTrigger value="obras">Obras ({cObras.length})</TabsTrigger>
          <TabsTrigger value="orcamentos">Orçamentos ({cOrc.length})</TabsTrigger>
          <TabsTrigger value="pagamentos">Pagamentos ({cPag.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="obras" className="mt-4">
          <Card>
            <div className="divide-y">
              {cObras.map((o) => (
                <Link key={o.id} to="/app/obras/$id" params={{ id: o.id }} className="flex items-center justify-between gap-4 p-4 hover:bg-muted/50">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{o.nome}</div>
                    <div className="text-xs text-muted-foreground">{o.cidade} · {formatDate(o.inicio)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{formatMZN(o.valorPrevisto)}</div>
                    <StatusBadge tone={o.estado === "concluida" ? "success" : o.estado === "em_andamento" ? "primary" : "muted"}>{estadoObraLabel[o.estado]}</StatusBadge>
                  </div>
                </Link>
              ))}
              {cObras.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">Sem obras.</div>}
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="orcamentos" className="mt-4">
          <Card>
            <div className="divide-y">
              {cOrc.map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <div className="font-medium">{o.numero}</div>
                    <div className="text-xs text-muted-foreground">{o.titulo}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{formatMZN(totalOrcamento(o).total)}</div>
                    <StatusBadge tone={o.estado === "aceite" ? "success" : "primary"}>{estadoOrcamentoLabel[o.estado]}</StatusBadge>
                  </div>
                </div>
              ))}
              {cOrc.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">Sem orçamentos.</div>}
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="pagamentos" className="mt-4">
          <Card>
            <div className="divide-y">
              {cPag.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <div className="font-medium">{p.referencia}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(p.data)}</div>
                  </div>
                  <div className="text-sm font-semibold text-success">{formatMZN(p.valor)}</div>
                </div>
              ))}
              {cPag.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">Sem pagamentos.</div>}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
