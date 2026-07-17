import { createFileRoute, Link, useParams, useNavigate } from "@tanstack/react-router";
import { PageHeader, StatusBadge } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  totalOrcamento, estadoObraLabel, estadoOrcamentoLabel, metodoPagamentoLabel,
  type EstadoObra,
} from "@/lib/mock-data";
import { formatDate, formatMZN } from "@/lib/format";
import { StatCard } from "@/components/stat-card";
import { Wallet, TrendingDown, Calendar, MapPin, User, Pencil, Trash2, Plus, TrendingUp } from "lucide-react";
import { useObraMZStore, totalsPorObra } from "@/store/obramz-store";
import { useState } from "react";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { PaymentFormDialog } from "@/components/payments/payment-form-dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { TimelineEditor } from "@/components/projects/timeline-editor";
import { toast } from "sonner";

export const Route = createFileRoute("/app/obras/$id")({ component: ObraDetalhe });

const toneFor = (e: EstadoObra) =>
  e === "concluida" ? "success" :
  e === "em_andamento" ? "primary" :
  e === "suspensa" ? "warning" :
  e === "cancelada" ? "destructive" : "muted";

function ObraDetalhe() {
  const { id } = useParams({ from: "/app/obras/$id" });
  const nav = useNavigate();
  const obra = useObraMZStore((s) => s.obras.find((o) => o.id === id));
  const cliente = useObraMZStore((s) => (obra ? s.clientes.find((c) => c.id === obra.clienteId) : undefined));
  const orcamentos = useObraMZStore(useShallow((s) => s.orcamentos.filter((o) => o.obraId === id)));
  const pagamentos = useObraMZStore(useShallow((s) => s.pagamentos.filter((p) => p.obraId === id)));

  const updateObraProgresso = useObraMZStore((s) => s.updateObraProgresso);
  const updateObraEstado = useObraMZStore((s) => s.updateObraEstado);
  const deleteObra = useObraMZStore((s) => s.deleteObra);

  const [editOpen, setEditOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [progresso, setProgresso] = useState<number | null>(null);

  if (!obra) {
    return (
      <Card className="p-8 text-center">
        <div className="text-sm font-semibold">Obra não encontrada.</div>
        <div className="mt-2"><Link to="/app/obras" className="text-primary">Voltar para obras</Link></div>
      </Card>
    );
  }

  const t = totalsPorObra(obra.id);
  const currentProg = progresso ?? obra.progresso;

  const saveProgresso = () => {
    if (progresso !== null && progresso !== obra.progresso) {
      updateObraProgresso(obra.id, progresso);
      toast.success(`Progresso atualizado para ${progresso}%`);
    }
    setProgresso(null);
  };


  return (
    <div>
      <PageHeader
        title={obra.nome}
        description={<><Link to="/app/obras" className="hover:text-primary">Obras</Link> · {obra.tipo}</>}
        actions={
          <>
            <Button variant="outline" onClick={() => setEditOpen(true)}><Pencil className="mr-1 h-4 w-4" />Editar</Button>
            <Button variant="outline" onClick={() => setConfirmDel(true)} className="text-destructive"><Trash2 className="mr-1 h-4 w-4" />Eliminar</Button>
            <Link to="/app/orcamentos/novo" search={{ clienteId: obra.clienteId, obraId: obra.id }}>
              <Button className="bg-primary hover:bg-primary-dark"><Plus className="mr-1 h-4 w-4" />Novo orçamento</Button>
            </Link>
          </>
        }
      />

      <Card className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={toneFor(obra.estado)}>{estadoObraLabel[obra.estado]}</StatusBadge>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{[obra.cidade, obra.provincia].filter(Boolean).join(", ") || "—"}</span>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="h-3 w-3" />{formatDate(obra.inicio)} → {formatDate(obra.fimPrevisto)}</span>
              {obra.responsavel && <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><User className="h-3 w-3" />{obra.responsavel}</span>}
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              Cliente:{" "}
              {cliente ? (
                <Link to="/app/clientes/$id" params={{ id: obra.clienteId }} className="font-medium text-foreground hover:text-primary">{cliente.nome}</Link>
              ) : "—"}
            </div>
          </div>
          <div className="w-full md:w-64 space-y-3">
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progresso da obra</span>
                <span className="font-bold text-primary">{currentProg}%</span>
              </div>
              <Slider
                key={`${obra.id}-${obra.progresso}`}
                defaultValue={[obra.progresso]}
                onValueChange={(v) => setProgresso(v[0] ?? 0)}
                onValueCommit={saveProgresso}
                max={100} step={1}
                disabled={obra.estado === "concluida" || obra.estado === "cancelada"}
              />

              {obra.progressoAtualizadoEm && (
                <div className="mt-1 text-[11px] text-muted-foreground">
                  Atualizado em {formatDate(obra.progressoAtualizadoEm)}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Estado</Label>
              <Select value={obra.estado} onValueChange={(v) => { updateObraEstado(obra.id, v as EstadoObra); toast.success("Estado atualizado"); }}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(estadoObraLabel) as EstadoObra[]).map((e) =>
                    <SelectItem key={e} value={e}>{estadoObraLabel[e]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      <div className="mt-4 grid gap-4 sm:grid-cols-4">
        <StatCard label="Valor previsto" value={formatMZN(obra.valorPrevisto)} icon={TrendingUp} tone="primary" />
        <StatCard label="Orçado (aceite)" value={formatMZN(t.orcado)} tone="primary" />
        <StatCard label="Recebido" value={formatMZN(t.recebido)} icon={Wallet} tone="success" />
        <StatCard label="Pendente" value={formatMZN(t.pendente)} icon={TrendingDown} tone="warning" />
      </div>

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList>
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="orcamentos">Orçamentos ({orcamentos.length})</TabsTrigger>
          <TabsTrigger value="pagamentos">Pagamentos ({pagamentos.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="p-5 lg:col-span-2">
              <div className="text-sm font-semibold">Descrição</div>
              <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{obra.descricao || "Sem descrição."}</p>
              {obra.observacoes && (
                <>
                  <div className="mt-4 text-sm font-semibold">Observações</div>
                  <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{obra.observacoes}</p>
                </>
              )}
              <div className="mt-6">
                <TimelineEditor obraId={obra.id} eventos={obra.eventos} />
              </div>
            </Card>
            <Card className="p-5">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold">Saldo financeiro</div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Orçado (aceite)</span><span className="font-semibold">{formatMZN(t.orcado)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Recebido</span><span className="font-semibold text-success">{formatMZN(t.recebido)}</span></div>
                <div className="flex justify-between border-t pt-2"><span className="text-muted-foreground">Pendente</span><span className="font-semibold">{formatMZN(t.pendente)}</span></div>
              </div>
              <Button className="mt-4 w-full bg-primary hover:bg-primary-dark" onClick={() => setPayOpen(true)}>
                <Plus className="mr-1 h-4 w-4" />Registar pagamento
              </Button>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orcamentos" className="mt-4">
          <Card>
            <div className="divide-y">
              {orcamentos.map((x) => (
                <Link key={x.id} to="/app/orcamentos/$id" params={{ id: x.id }} className="flex items-center justify-between gap-3 p-4 hover:bg-muted/40">
                  <div><div className="font-medium">{x.numero}</div><div className="text-xs text-muted-foreground">{x.titulo}</div></div>
                  <div className="text-right">
                    <div className="font-semibold">{formatMZN(totalOrcamento(x).total)}</div>
                    <StatusBadge tone={x.estado === "aceite" ? "success" : x.estado === "rejeitado" ? "destructive" : "primary"}>{estadoOrcamentoLabel[x.estado]}</StatusBadge>
                  </div>
                </Link>
              ))}
              {orcamentos.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">Sem orçamentos.</div>}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="pagamentos" className="mt-4">
          <Card>
            <div className="flex items-center justify-between border-b p-3">
              <div className="text-sm font-semibold">Pagamentos da obra</div>
              <Button size="sm" variant="outline" onClick={() => setPayOpen(true)}><Plus className="mr-1 h-3.5 w-3.5" />Registar</Button>
            </div>
            <div className="divide-y">
              {pagamentos.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <div className="font-medium">{p.referencia || "—"}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(p.data)} · {metodoPagamentoLabel[p.metodo]}</div>
                  </div>
                  <div className="text-sm font-semibold text-success">{formatMZN(p.valor)}</div>
                </div>
              ))}
              {pagamentos.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">Sem pagamentos.</div>}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <ProjectFormDialog open={editOpen} onOpenChange={setEditOpen} obra={obra} />
      <PaymentFormDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        defaults={{ clienteId: obra.clienteId, obraId: obra.id }}
      />
      <ConfirmDialog
        open={confirmDel}
        onOpenChange={setConfirmDel}
        title={`Eliminar ${obra.nome}?`}
        description="Esta ação não pode ser desfeita."
        confirmLabel="Eliminar"
        tone="destructive"
        onConfirm={() => {
          deleteObra(obra.id);
          toast.success("Obra eliminada");
          nav({ to: "/app/obras" });
        }}
      />
    </div>
  );
}
