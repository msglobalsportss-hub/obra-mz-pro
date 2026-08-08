import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatusBadge } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { StatCard } from "@/components/stat-card";
import { metodoPagamentoLabel, estadoPagamentoLabel, type Pagamento } from "@/lib/mock-data";
import { formatDate, formatMZN } from "@/lib/format";
import { Plus, Wallet, TrendingUp, TrendingDown, CalendarRange, Search, MoreHorizontal, Pencil, Trash2, Paperclip, Eye } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useObraMZStore, metricasGlobais } from "@/store/obramz-store";
import { PaymentFormDialog } from "@/components/payments/payment-form-dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { PageContainer } from "@/components/shared/page-container";

export const Route = createFileRoute("/app/pagamentos/")({ component: PagamentosPage });

const toneEstado = (e: Pagamento["estado"]) =>
  e === "confirmado" ? "success" : e === "pendente" ? "warning" : e === "cancelado" ? "destructive" : "muted";

function PagamentosPage() {
  const pagamentos = useObraMZStore((s) => s.pagamentos);
  const clientes = useObraMZStore((s) => s.clientes);
  const obras = useObraMZStore((s) => s.obras);
  const orcamentos = useObraMZStore((s) => s.orcamentos);
  const deletePagamento = useObraMZStore((s) => s.deletePagamento);

  const clienteById = (id: string) => clientes.find((c) => c.id === id);
  const obraById = (id?: string) => (id ? obras.find((o) => o.id === id) : undefined);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Pagamento | null>(null);
  const [confirmDel, setConfirmDel] = useState<Pagamento | null>(null);
  const [q, setQ] = useState("");

  const m = useMemo(() => metricasGlobais({ clientes, obras, orcamentos, pagamentos } as any), [clientes, obras, orcamentos, pagamentos]);

  const now = new Date();
  const mesAtual = pagamentos
    .filter((p) => p.estado === "confirmado" && new Date(p.data).getMonth() === now.getMonth() && new Date(p.data).getFullYear() === now.getFullYear())
    .reduce((s, p) => s + p.valor, 0);

  const list = useMemo(() =>
    pagamentos
      .filter((p) => {
        const query = q.toLowerCase().trim();
        if (!query) return true;
        const c = clienteById(p.clienteId)?.nome ?? "";
        return c.toLowerCase().includes(query) || p.referencia.toLowerCase().includes(query);
      })
      .sort((a, b) => b.data.localeCompare(a.data)),
    [pagamentos, q, clientes],
  );

  const openNew = () => { setEditing(null); setOpen(true); };
  const openEdit = (p: Pagamento) => { setEditing(p); setOpen(true); };

  return (
    <PageContainer>
      <PageHeader
        title="Pagamentos"
        description="Registo de recebimentos de clientes, adiantamentos e controlo de liquidez."
        breadcrumbs={[{ label: "Pagamentos" }]}
        actions={
          <Button className="bg-orange-600 hover:bg-orange-700 text-white shadow-sm text-xs font-semibold" onClick={openNew}>
            <Plus className="mr-1 h-4 w-4" />Registar pagamento
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total orçado" value={formatMZN(m.totalOrcado)} icon={TrendingUp} tone="primary" />
        <StatCard label="Total recebido" value={formatMZN(m.totalRecebido)} icon={Wallet} tone="success" />
        <StatCard label="Pendente" value={formatMZN(m.pendente)} icon={TrendingDown} tone="warning" />
        <StatCard label="Este mês" value={formatMZN(mesAtual)} icon={CalendarRange} />
      </div>

      <Card className="mt-6 p-4">
        <div className="mb-4 relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Pesquisar por cliente ou referência..." className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        {list.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title={pagamentos.length === 0 ? "Ainda sem pagamentos" : "Nenhum pagamento encontrado"}
            description={pagamentos.length === 0 ? "Registe o primeiro pagamento recebido." : "Ajuste a pesquisa."}
            action={pagamentos.length === 0 && <Button onClick={openNew} className="bg-primary hover:bg-primary-dark"><Plus className="mr-1 h-4 w-4" />Registar pagamento</Button>}
          />
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-lg border border-border md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Cliente</TableHead>
                    <TableHead>Obra</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Referência</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Comprov.</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{clienteById(p.clienteId)?.nome ?? "—"}</TableCell>
                      <TableCell className="text-sm">{obraById(p.obraId)?.nome ?? "—"}</TableCell>
                      <TableCell className="text-sm">{formatDate(p.data)}</TableCell>
                      <TableCell className="text-sm">{metodoPagamentoLabel[p.metodo]}</TableCell>
                      <TableCell className="text-sm font-mono">{p.referencia || "—"}</TableCell>
                      <TableCell><StatusBadge tone={toneEstado(p.estado)}>{estadoPagamentoLabel[p.estado]}</StatusBadge></TableCell>
                      <TableCell>
                        {p.comprovativo ? (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(p.comprovativo!.dataUrl, "_blank")} aria-label="Ver comprovativo">
                            <Paperclip className="h-3.5 w-3.5 text-primary" />
                          </Button>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${p.estado === "confirmado" ? "text-success" : ""}`}>{formatMZN(p.valor)}</TableCell>
                      <TableCell>
                        <PagActions
                          pagamento={p}
                          onEdit={() => openEdit(p)}
                          onDelete={() => setConfirmDel(p)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid gap-3 md:hidden">
              {list.map((p) => (
                <Card key={p.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{clienteById(p.clienteId)?.nome ?? "—"}</div>
                      <div className="truncate text-xs text-muted-foreground">{obraById(p.obraId)?.nome ?? "—"}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${p.estado === "confirmado" ? "text-success" : ""}`}>{formatMZN(p.valor)}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(p.data)}</div>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded bg-muted px-2 py-0.5">{metodoPagamentoLabel[p.metodo]}</span>
                    {p.referencia && <span className="font-mono text-muted-foreground">{p.referencia}</span>}
                    <StatusBadge tone={toneEstado(p.estado)}>{estadoPagamentoLabel[p.estado]}</StatusBadge>
                    {p.comprovativo && (
                      <button onClick={() => window.open(p.comprovativo!.dataUrl, "_blank")} className="inline-flex items-center gap-1 text-primary" aria-label="Comprovativo">
                        <Paperclip className="h-3 w-3" />Comprovativo
                      </button>
                    )}
                    <div className="ml-auto">
                      <PagActions pagamento={p} onEdit={() => openEdit(p)} onDelete={() => setConfirmDel(p)} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </Card>

      <PaymentFormDialog open={open} onOpenChange={setOpen} pagamento={editing} />
      <ConfirmDialog
        open={!!confirmDel}
        onOpenChange={(o) => !o && setConfirmDel(null)}
        title="Eliminar pagamento?"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Eliminar"
        tone="destructive"
        onConfirm={() => {
          if (confirmDel) {
            deletePagamento(confirmDel.id);
            toast.success("Pagamento eliminado");
            setConfirmDel(null);
          }
        }}
      />
    </PageContainer>
  );
}

function PagActions({
  pagamento, onEdit, onDelete,
}: { pagamento: Pagamento; onEdit: () => void; onDelete: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {pagamento.comprovativo && (
          <DropdownMenuItem onClick={() => window.open(pagamento.comprovativo!.dataUrl, "_blank")}>
            <Eye className="mr-2 h-4 w-4" />Ver comprovativo
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={onEdit}><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
        <DropdownMenuItem className="text-destructive" onClick={onDelete}><Trash2 className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
