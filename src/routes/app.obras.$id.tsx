import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { PageHeader, StatusBadge } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  obraById, clienteById, orcamentos, pagamentos, totalOrcamento,
  estadoObraLabel, estadoOrcamentoLabel,
} from "@/lib/mock-data";
import type { EstadoObra } from "@/lib/mock-data";
import { formatDate, formatMZN } from "@/lib/format";
import { StatCard } from "@/components/stat-card";
import { Wallet, TrendingDown, Calendar, MapPin, User, Camera, FolderClosed, Activity } from "lucide-react";

export const Route = createFileRoute("/app/obras/$id")({ component: ObraDetalhe });

const toneFor = (e: EstadoObra) =>
  e === "concluida" ? "success" :
  e === "em_andamento" ? "primary" :
  e === "suspensa" ? "warning" :
  e === "cancelada" ? "destructive" : "muted";

function ObraDetalhe() {
  const { id } = useParams({ from: "/app/obras/$id" });
  const o = obraById(id);
  if (!o) return <div>Obra não encontrada. <Link to="/app/obras" className="text-primary">Voltar</Link></div>;
  const cliente = clienteById(o.clienteId);
  const orcs = orcamentos.filter((x) => x.obraId === o.id);
  const pags = pagamentos.filter((x) => x.obraId === o.id);
  const pendente = Math.max(0, o.valorPrevisto - o.valorRecebido);

  return (
    <div>
      <PageHeader
        title={o.nome}
        description={<><Link to="/app/obras" className="hover:text-primary">Obras</Link> · {o.tipo}</>}
        actions={
          <>
            <Button variant="outline">Editar obra</Button>
            <Link to="/app/orcamentos/novo"><Button className="bg-primary hover:bg-primary-dark">Novo orçamento</Button></Link>
          </>
        }
      />

      <Card className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={toneFor(o.estado)}>{estadoObraLabel[o.estado]}</StatusBadge>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{o.cidade}, {o.provincia}</span>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="h-3 w-3" />{formatDate(o.inicio)} → {formatDate(o.fimPrevisto)}</span>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><User className="h-3 w-3" />{o.responsavel}</span>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">Cliente: <Link to="/app/clientes/$id" params={{ id: o.clienteId }} className="font-medium text-foreground hover:text-primary">{cliente?.nome}</Link></div>
          </div>
          <div className="min-w-56">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progresso da obra</span>
              <span className="font-bold text-primary">{o.progresso}%</span>
            </div>
            <Progress value={o.progresso} className="h-2" />
          </div>
        </div>
      </Card>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <StatCard label="Valor previsto" value={formatMZN(o.valorPrevisto)} tone="primary" />
        <StatCard label="Recebido" value={formatMZN(o.valorRecebido)} icon={Wallet} tone="success" />
        <StatCard label="Pendente" value={formatMZN(pendente)} icon={TrendingDown} tone="warning" />
      </div>

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList>
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="orcamentos">Orçamentos</TabsTrigger>
          <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
          <TabsTrigger value="atividades">Atividades</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="fotos">Fotografias</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="p-5 lg:col-span-2">
              <div className="text-sm font-semibold">Descrição</div>
              <p className="mt-2 text-sm text-muted-foreground">{o.descricao}</p>
              <div className="mt-6 text-sm font-semibold">Linha temporal</div>
              <ol className="mt-3 space-y-3">
                {[
                  { d: o.inicio, t: "Início dos trabalhos" },
                  { d: "2026-06-01", t: "Fundação concluída" },
                  { d: "2026-07-01", t: "Alvenaria em curso" },
                  { d: o.fimPrevisto, t: "Conclusão prevista", future: true },
                ].map((e, i) => (
                  <li key={i} className="flex gap-3">
                    <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${e.future ? "bg-muted-foreground/40" : "bg-primary"}`} />
                    <div>
                      <div className="text-sm font-medium">{e.t}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(e.d)}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
            <Card className="p-5">
              <div className="text-sm font-semibold">Próximas ações</div>
              <ul className="mt-3 space-y-3 text-sm">
                <li className="flex items-start gap-2"><Activity className="mt-0.5 h-4 w-4 text-primary" />Confirmar entrega de material esta semana</li>
                <li className="flex items-start gap-2"><Activity className="mt-0.5 h-4 w-4 text-primary" />Emitir factura intermédia</li>
                <li className="flex items-start gap-2"><Activity className="mt-0.5 h-4 w-4 text-primary" />Visita técnica na próxima segunda</li>
              </ul>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orcamentos" className="mt-4">
          <Card>
            <div className="divide-y">
              {orcs.map((x) => (
                <Link key={x.id} to="/app/orcamentos/$id" params={{ id: x.id }} className="flex items-center justify-between gap-3 p-4 hover:bg-muted/40">
                  <div><div className="font-medium">{x.numero}</div><div className="text-xs text-muted-foreground">{x.titulo}</div></div>
                  <div className="text-right">
                    <div className="font-semibold">{formatMZN(totalOrcamento(x).total)}</div>
                    <StatusBadge tone={x.estado === "aceite" ? "success" : "primary"}>{estadoOrcamentoLabel[x.estado]}</StatusBadge>
                  </div>
                </Link>
              ))}
              {orcs.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">Sem orçamentos.</div>}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="pagamentos" className="mt-4">
          <Card>
            <div className="divide-y">
              {pags.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 p-4">
                  <div><div className="font-medium">{p.referencia}</div><div className="text-xs text-muted-foreground">{formatDate(p.data)}</div></div>
                  <div className="text-sm font-semibold text-success">{formatMZN(p.valor)}</div>
                </div>
              ))}
              {pags.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">Sem pagamentos.</div>}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="atividades" className="mt-4">
          <Card className="p-8 text-center text-sm text-muted-foreground">Sem atividades registadas.</Card>
        </TabsContent>
        <TabsContent value="documentos" className="mt-4">
          <Card className="p-8 text-center text-sm text-muted-foreground">
            <FolderClosed className="mx-auto h-8 w-8 opacity-40" />
            <div className="mt-3">Ainda sem documentos.</div>
          </Card>
        </TabsContent>
        <TabsContent value="fotos" className="mt-4">
          <Card className="p-8 text-center text-sm text-muted-foreground">
            <Camera className="mx-auto h-8 w-8 opacity-40" />
            <div className="mt-3">Ainda sem fotografias.</div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
