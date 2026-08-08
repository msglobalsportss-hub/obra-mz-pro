import { createFileRoute, Link, useParams, useNavigate } from "@tanstack/react-router";
import { useShallow } from "zustand/react/shallow";

import { PageHeader, StatusBadge } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  totalOrcamento,
  estadoObraLabel,
  estadoOrcamentoLabel,
  metodoPagamentoLabel,
  type EstadoObra,
  type ObraFoto,
} from "@/lib/mock-data";
import { formatDate, formatMZN } from "@/lib/format";
import { StatCard } from "@/components/stat-card";
import {
  Wallet,
  TrendingDown,
  Calendar,
  MapPin,
  User,
  Pencil,
  Trash2,
  Plus,
  TrendingUp,
  Users,
  Package,
  ArrowUpRight,
} from "lucide-react";
import { useObraMZStore, totalsPorObra } from "@/store/obramz-store";
import { calculateDailyLabourSummary } from "@/lib/attendance-labour-cost";
import { useState, useMemo } from "react";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { PaymentFormDialog } from "@/components/payments/payment-form-dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { TimelineEditor } from "@/components/projects/timeline-editor";
import { PhotoGallery } from "@/components/projects/photo-gallery";
import { PhasesEditor } from "@/components/projects/phases-editor";
import { PhotoComparison } from "@/components/projects/photo-comparison";
import { PhotoDetailDialog } from "@/components/projects/photo-detail-dialog";
import { toast } from "sonner";

import { ObraMateriaisTab } from "@/components/projects/obra-materiais-tab";

export const Route = createFileRoute("/app/obras/$id")({ component: ObraDetalhe });

const toneFor = (e: EstadoObra) =>
  e === "concluida"
    ? "success"
    : e === "em_andamento"
      ? "primary"
      : e === "suspensa"
        ? "warning"
        : e === "cancelada"
          ? "destructive"
          : "muted";

function ObraDetalhe() {
  const { id } = useParams({ from: "/app/obras/$id" });
  const nav = useNavigate();
  const obra = useObraMZStore((s) => s.obras.find((o) => o.id === id));
  const cliente = useObraMZStore((s) =>
    obra ? s.clientes.find((c) => c.id === obra.clienteId) : undefined,
  );
  const orcamentos = useObraMZStore(useShallow((s) => s.orcamentos.filter((o) => o.obraId === id)));
  const pagamentos = useObraMZStore(useShallow((s) => s.pagamentos.filter((p) => p.obraId === id)));

  const updateObraProgresso = useObraMZStore((s) => s.updateObraProgresso);
  const updateObraEstado = useObraMZStore((s) => s.updateObraEstado);
  const deleteObra = useObraMZStore((s) => s.deleteObra);
  const attendanceRecords = useObraMZStore((s) => s.attendanceRecords || []);
  const workers = useObraMZStore((s) => s.workers || []);

  const [editOpen, setEditOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [progresso, setProgresso] = useState<number | null>(null);
  const [detailPhoto, setDetailPhoto] = useState<ObraFoto | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const todayProjectRecords = useMemo(() => {
    return attendanceRecords.filter((r) => r.projectId === id && r.date === todayStr);
  }, [attendanceRecords, id, todayStr]);

  const todayLabourSummary = useMemo(() => {
    const map = new Map(workers.map((w) => [w.id, w]));
    return calculateDailyLabourSummary(todayProjectRecords, map);
  }, [todayProjectRecords, workers]);

  if (!obra) {
    return (
      <Card className="p-8 text-center">
        <div className="text-sm font-semibold">Obra não encontrada.</div>
        <div className="mt-2">
          <Link to="/app/obras" className="text-primary">
            Voltar para obras
          </Link>
        </div>
      </Card>
    );
  }

  const t = totalsPorObra(obra.id);
  const currentProg = progresso ?? obra.progresso;
  const antesFotosCount = (obra.fotos ?? []).filter((f) => f.tipo === "antes").length;

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
        description={
          <>
            <Link to="/app/obras" className="hover:text-primary">
              Obras
            </Link>{" "}
            · {obra.tipo}
          </>
        }
        actions={
          <>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-1 h-4 w-4" />
              Editar
            </Button>
            <Button
              variant="outline"
              onClick={() => setConfirmDel(true)}
              className="text-destructive"
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Eliminar
            </Button>
            <Link to="/app/orcamentos/novo" search={{ clienteId: obra.clienteId, obraId: obra.id }}>
              <Button className="bg-primary hover:bg-primary-dark">
                <Plus className="mr-1 h-4 w-4" />
                Novo orçamento
              </Button>
            </Link>
          </>
        }
      />

      <Card className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={toneFor(obra.estado)}>{estadoObraLabel[obra.estado]}</StatusBadge>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {[obra.cidade, obra.provincia].filter(Boolean).join(", ") || "—"}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {formatDate(obra.inicio)} → {formatDate(obra.fimPrevisto)}
              </span>
              {obra.responsavel && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  {obra.responsavel}
                </span>
              )}
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              Cliente:{" "}
              {cliente ? (
                <Link
                  to="/app/clientes/$id"
                  params={{ id: obra.clienteId }}
                  className="font-medium text-foreground hover:text-primary"
                >
                  {cliente.nome}
                </Link>
              ) : (
                "—"
              )}
            </div>

            {/* Últimas Entregas na Obra (até 5) */}
            {(() => {
              const deliveries = useObraMZStore.getState().deliveries || [];
              const projectDeliveries = deliveries
                .filter((d) => d.destinationProjectId === obra.id)
                .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());

              if (projectDeliveries.length === 0) return null;

              const recentFive = projectDeliveries.slice(0, 5);

              return (
                <div className="mt-4 space-y-2 border border-border/60 rounded-xl p-3 bg-muted/10">
                  <div className="flex items-center justify-between text-xs font-bold text-foreground">
                    <span className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Últimas Entregas nesta Obra ({projectDeliveries.length})
                    </span>
                    <Link to="/app/inventory/deliveries">
                      <Button size="xs" variant="ghost" className="h-6 text-[10px] text-primary">
                        Ver todas ({projectDeliveries.length})
                      </Button>
                    </Link>
                  </div>

                  <div className="space-y-1.5">
                    {recentFive.map((del) => (
                      <div
                        key={del.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-background border border-border/50 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono font-bold text-primary">{del.deliveryNumber}</span>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {formatDate(del.updatedAt || del.createdAt)}
                          </span>
                        </div>
                        <Link to="/app/inventory/deliveries_/$deliveryId" params={{ deliveryId: del.id }}>
                          <Button size="xs" variant="outline" className="h-6 text-[10px] gap-1 px-2">
                            <span>Abrir</span>
                            <ArrowUpRight className="w-2.5 h-2.5" />
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Painel: Consumo de Hoje na Obra */}
            {(() => {
              const stockMovements = useObraMZStore.getState().stockMovements || [];
              const todayStr = new Date().toISOString().slice(0, 10);
              const todayConsumptions = stockMovements.filter(
                (m) => m.projectId === obra.id && m.movementType.includes("consumption") && m.occurredAt?.slice(0, 10) === todayStr
              );

              return (
                <div className="mt-3 p-3 border border-border/60 rounded-xl bg-amber-500/5 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between font-bold text-amber-800 dark:text-amber-300">
                    <span className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                      Consumo de Hoje na Obra
                    </span>
                    <Badge variant="outline" className="text-[9px] bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400 font-mono">
                      {todayConsumptions.length} movimento(s)
                    </Badge>
                  </div>
                  {todayConsumptions.length === 0 ? (
                    <span className="text-[11px] text-muted-foreground block">Sem consumos registados hoje.</span>
                  ) : (
                    <div className="space-y-1">
                      {todayConsumptions.slice(0, 3).map((c) => (
                        <div key={c.id} className="flex items-center justify-between text-[11px] p-1.5 bg-background rounded border">
                          <span className="font-semibold text-foreground">{c.materialId}</span>
                          <span className="font-mono text-rose-600 font-bold">-{c.quantity} un</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
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
                max={100}
                step={1}
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
              <Select
                value={obra.estado}
                onValueChange={(v) => {
                  updateObraEstado(obra.id, v as EstadoObra);
                  toast.success("Estado atualizado");
                }}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(estadoObraLabel) as EstadoObra[]).map((e) => (
                    <SelectItem key={e} value={e}>
                      {estadoObraLabel[e]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      <div className="mt-4 grid gap-4 sm:grid-cols-4">
        <StatCard
          label="Valor previsto"
          value={formatMZN(obra.valorPrevisto)}
          icon={TrendingUp}
          tone="primary"
        />
        <StatCard label="Orçado (aceite)" value={formatMZN(t.orcado)} tone="primary" />
        <StatCard label="Recebido" value={formatMZN(t.recebido)} icon={Wallet} tone="success" />
        <StatCard
          label="Pendente"
          value={formatMZN(t.pendente)}
          icon={TrendingDown}
          tone="warning"
        />
      </div>

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="materiais">Materiais da Obra</TabsTrigger>
          <TabsTrigger value="diario">Diário ({(obra.eventos ?? []).length})</TabsTrigger>
          <TabsTrigger value="fotos">Fotografias ({(obra.fotos ?? []).length})</TabsTrigger>
          <TabsTrigger value="antes-depois">Antes e depois ({antesFotosCount})</TabsTrigger>
          <TabsTrigger value="fases">Fases ({(obra.fases ?? []).length})</TabsTrigger>
          <TabsTrigger value="orcamentos">Orçamentos ({orcamentos.length})</TabsTrigger>
          <TabsTrigger value="pagamentos">Pagamentos ({pagamentos.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="materiais" className="mt-4">
          <ObraMateriaisTab obraId={obra.id} obraNome={obra.nome} fases={obra.fases ?? []} />
        </TabsContent>

        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="p-5 lg:col-span-2">
              <div className="text-sm font-semibold">Descrição</div>
              <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                {obra.descricao || "Sem descrição."}
              </p>
              {obra.observacoes && (
                <>
                  <div className="mt-4 text-sm font-semibold">Observações</div>
                  <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                    {obra.observacoes}
                  </p>
                </>
              )}
            </Card>
            <div className="space-y-4">
              <Card className="p-5">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-semibold">Saldo financeiro</div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Orçado (aceite)</span>
                    <span className="font-semibold">{formatMZN(t.orcado)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recebido</span>
                    <span className="font-semibold text-success">{formatMZN(t.recebido)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-muted-foreground">Pendente</span>
                    <span className="font-semibold">{formatMZN(t.pendente)}</span>
                  </div>
                </div>
                <Button
                  className="mt-4 w-full bg-primary hover:bg-primary-dark"
                  onClick={() => setPayOpen(true)}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Registar pagamento
                </Button>
              </Card>

              {/* Cartão Mão de Obra Hoje (Fase 5.4) */}
              <Card className="p-5">
                <div className="mb-3 flex items-center justify-between border-b pb-2">
                  <div className="text-sm font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" /> Mão de Obra Hoje
                  </div>
                  <span className="text-[11px] text-muted-foreground font-mono">{todayStr}</span>
                </div>
                {todayProjectRecords.length === 0 ? (
                  <div className="text-xs text-muted-foreground py-3 text-center border border-dashed rounded-lg">
                    Nenhuma chamada registada hoje nesta obra.
                  </div>
                ) : (
                  <div className="space-y-2 text-xs">
                    {Object.values(todayLabourSummary.byCurrency).map((sum) => (
                      <div key={sum.currency} className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Operários Presentes:</span>
                          <span className="font-bold text-foreground">{sum.presentWorkers}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Horas Regulares:</span>
                          <span className="font-semibold">{sum.regularHours}h</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Horas Extra:</span>
                          <span className="font-semibold">{sum.overtimeHours}h</span>
                        </div>
                        <div className="flex justify-between border-t pt-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                          <span>Custo do Dia:</span>
                          <span>{formatMZN(sum.totalLabourCost)}</span>
                        </div>
                        {sum.workersWithoutSalaryConfig > 0 && (
                          <div className="text-[10px] text-amber-700 dark:text-amber-400 bg-amber-500/10 p-1.5 rounded text-center">
                            ⚠️ {sum.workersWithoutSalaryConfig} operário(s) sem remuneração
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <Link to="/app/presencas">
                  <Button variant="outline" size="sm" className="mt-4 w-full text-xs gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> Abrir Módulo de Presenças
                  </Button>
                </Link>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="diario" className="mt-4">
          <Card className="p-5">
            <TimelineEditor obraId={obra.id} eventos={obra.eventos ?? []} />
          </Card>
        </TabsContent>

        <TabsContent value="fotos" className="mt-4">
          <Card className="p-5">
            <PhotoGallery obraId={obra.id} fotos={obra.fotos ?? []} />
          </Card>
        </TabsContent>

        <TabsContent value="antes-depois" className="mt-4">
          <Card className="p-5">
            <PhotoComparison
              fotos={obra.fotos ?? []}
              fases={obra.fases ?? []}
              onOpenDetail={setDetailPhoto}
            />
          </Card>
        </TabsContent>

        <TabsContent value="fases" className="mt-4">
          <Card className="p-5">
            <PhasesEditor obraId={obra.id} fases={obra.fases ?? []} />
          </Card>
        </TabsContent>

        <TabsContent value="orcamentos" className="mt-4">
          <Card>
            <div className="divide-y">
              {orcamentos.map((x) => (
                <Link
                  key={x.id}
                  to="/app/orcamentos/$id"
                  params={{ id: x.id }}
                  className="flex items-center justify-between gap-3 p-4 hover:bg-muted/40"
                >
                  <div>
                    <div className="font-medium">{x.numero}</div>
                    <div className="text-xs text-muted-foreground">{x.titulo}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatMZN(totalOrcamento(x).total)}</div>
                    <StatusBadge
                      tone={
                        x.estado === "aceite"
                          ? "success"
                          : x.estado === "rejeitado"
                            ? "destructive"
                            : "primary"
                      }
                    >
                      {estadoOrcamentoLabel[x.estado]}
                    </StatusBadge>
                  </div>
                </Link>
              ))}
              {orcamentos.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">Sem orçamentos.</div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="pagamentos" className="mt-4">
          <Card>
            <div className="flex items-center justify-between border-b p-3">
              <div className="text-sm font-semibold">Pagamentos da obra</div>
              <Button size="sm" variant="outline" onClick={() => setPayOpen(true)}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                Registar
              </Button>
            </div>
            <div className="divide-y">
              {pagamentos.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <div className="font-medium">{p.referencia || "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(p.data)} · {metodoPagamentoLabel[p.metodo]}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-success">{formatMZN(p.valor)}</div>
                </div>
              ))}
              {pagamentos.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">Sem pagamentos.</div>
              )}
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
      <PhotoDetailDialog
        open={!!detailPhoto}
        onOpenChange={(o) => !o && setDetailPhoto(null)}
        photo={detailPhoto}
        fases={obra.fases ?? []}
        allPhotos={obra.fotos ?? []}
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
