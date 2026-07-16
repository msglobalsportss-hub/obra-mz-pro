import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, StatusBadge } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreHorizontal, Eye, Pencil, Copy, FileText, Send, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { totalOrcamento, estadoOrcamentoLabel, type EstadoOrcamento, type Orcamento } from "@/lib/mock-data";
import { formatDate, formatMZN } from "@/lib/format";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useObraMZStore } from "@/store/obramz-store";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { openWhatsApp } from "@/lib/whatsapp";

export const Route = createFileRoute("/app/orcamentos/")({ component: OrcamentosPage });

const toneFor = (e: EstadoOrcamento) =>
  e === "aceite" ? "success" :
  e === "rejeitado" || e === "expirado" || e === "cancelado" ? "destructive" :
  e === "enviado" || e === "visualizado" ? "primary" : "muted";

function OrcamentosPage() {
  const orcamentos = useObraMZStore((s) => s.orcamentos);
  const clientes = useObraMZStore((s) => s.clientes);
  const obras = useObraMZStore((s) => s.obras);
  const duplicateOrcamento = useObraMZStore((s) => s.duplicateOrcamento);
  const updateOrcamentoEstado = useObraMZStore((s) => s.updateOrcamentoEstado);
  const deleteOrcamento = useObraMZStore((s) => s.deleteOrcamento);
  const empresa = useObraMZStore((s) => s.empresa);

  const clienteById = (id: string) => clientes.find((c) => c.id === id);
  const obraById = (id?: string) => (id ? obras.find((o) => o.id === id) : undefined);

  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<string>("all");
  const [cliente, setCliente] = useState<string>("all");
  const [confirmDel, setConfirmDel] = useState<Orcamento | null>(null);

  const list = useMemo(() => orcamentos.filter((o) =>
    (estado === "all" || o.estado === estado) &&
    (cliente === "all" || o.clienteId === cliente) &&
    (o.numero.toLowerCase().includes(q.toLowerCase()) || o.titulo.toLowerCase().includes(q.toLowerCase()))
  ), [q, estado, cliente, orcamentos]);

  const handleShareWA = (o: Orcamento) => {
    const cli = clienteById(o.clienteId);
    if (!cli) return;
    const total = totalOrcamento(o).total;
    const msg = `Olá ${cli.nome},\n\nSegue o orçamento *${o.numero}* — ${o.titulo}.\nValor total: *${formatMZN(total)}*\nValidade: ${formatDate(o.validade)}\n\nCumprimentos,\n${empresa.nome}`;
    openWhatsApp(cli.telefone, msg);
  };

  return (
    <div>
      <PageHeader
        title="Orçamentos"
        description="Todos os orçamentos criados."
        actions={
          <Link to="/app/orcamentos/novo">
            <Button className="bg-primary hover:bg-primary-dark"><Plus className="mr-1 h-4 w-4" />Novo orçamento</Button>
          </Link>
        }
      />

      <Card className="p-4">
        <div className="mb-4 grid gap-3 sm:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Pesquisar por número ou título..." className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select value={estado} onValueChange={setEstado}>
            <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os estados</SelectItem>
              {(Object.keys(estadoOrcamentoLabel) as EstadoOrcamento[]).map((e) =>
                <SelectItem key={e} value={e}>{estadoOrcamentoLabel[e]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={cliente} onValueChange={setCliente}>
            <SelectTrigger><SelectValue placeholder="Cliente" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os clientes</SelectItem>
              {clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {list.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={orcamentos.length === 0 ? "Ainda sem orçamentos" : "Nenhum orçamento encontrado"}
            description={orcamentos.length === 0 ? "Crie o primeiro orçamento para partilhar com o cliente." : "Ajuste os filtros."}
            action={orcamentos.length === 0 && (
              <Link to="/app/orcamentos/novo">
                <Button className="bg-primary hover:bg-primary-dark"><Plus className="mr-1 h-4 w-4" />Novo orçamento</Button>
              </Link>
            )}
          />
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-lg border border-border md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente / Obra</TableHead>
                    <TableHead>Emissão</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell>
                        <Link to="/app/orcamentos/$id" params={{ id: o.id }} className="font-medium hover:text-primary">{o.numero}</Link>
                        <div className="text-xs text-muted-foreground">{o.titulo}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{clienteById(o.clienteId)?.nome ?? "—"}</div>
                        {o.obraId && <div className="text-xs text-muted-foreground">{obraById(o.obraId)?.nome}</div>}
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(o.emissao)}</TableCell>
                      <TableCell className="text-sm">{formatDate(o.validade)}</TableCell>
                      <TableCell><StatusBadge tone={toneFor(o.estado)}>{estadoOrcamentoLabel[o.estado]}</StatusBadge></TableCell>
                      <TableCell className="text-right font-semibold">{formatMZN(totalOrcamento(o).total)}</TableCell>
                      <TableCell>
                        <RowActions
                          orc={o}
                          onDuplicate={() => {
                            const dup = duplicateOrcamento(o.id);
                            if (dup) toast.success(`Duplicado como ${dup.numero}`);
                          }}
                          onEstado={(e) => { updateOrcamentoEstado(o.id, e); toast.success(`Marcado como ${estadoOrcamentoLabel[e]}`); }}
                          onDelete={() => setConfirmDel(o)}
                          onShare={() => handleShareWA(o)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid gap-3 md:hidden">
              {list.map((o) => (
                <Card key={o.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link to="/app/orcamentos/$id" params={{ id: o.id }} className="block truncate font-semibold">{o.numero}</Link>
                      <div className="truncate text-xs text-muted-foreground">{clienteById(o.clienteId)?.nome ?? "—"}</div>
                    </div>
                    <StatusBadge tone={toneFor(o.estado)}>{estadoOrcamentoLabel[o.estado]}</StatusBadge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{formatDate(o.emissao)}</span>
                    <span className="font-semibold">{formatMZN(totalOrcamento(o).total)}</span>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </Card>

      <ConfirmDialog
        open={!!confirmDel}
        onOpenChange={(o) => !o && setConfirmDel(null)}
        title={`Eliminar orçamento ${confirmDel?.numero}?`}
        description="Esta ação não pode ser desfeita."
        confirmLabel="Eliminar"
        tone="destructive"
        onConfirm={() => {
          if (confirmDel) {
            deleteOrcamento(confirmDel.id);
            toast.success("Orçamento eliminado");
            setConfirmDel(null);
          }
        }}
      />
    </div>
  );
}

function RowActions({
  orc, onDuplicate, onEstado, onDelete, onShare,
}: {
  orc: Orcamento;
  onDuplicate: () => void;
  onEstado: (e: EstadoOrcamento) => void;
  onDelete: () => void;
  onShare: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild><Link to="/app/orcamentos/$id" params={{ id: orc.id }}><Eye className="mr-2 h-4 w-4" />Abrir</Link></DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/app/orcamentos/novo" search={{ editar: orc.id }}><Pencil className="mr-2 h-4 w-4" />Editar</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDuplicate}><Copy className="mr-2 h-4 w-4" />Duplicar</DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.print()}><FileText className="mr-2 h-4 w-4" />Imprimir</DropdownMenuItem>
        <DropdownMenuItem onClick={onShare}><Send className="mr-2 h-4 w-4" />Enviar por WhatsApp</DropdownMenuItem>
        <DropdownMenuSeparator />
        {orc.estado !== "aceite" && (
          <DropdownMenuItem onClick={() => onEstado("aceite")}><CheckCircle2 className="mr-2 h-4 w-4" />Marcar aceite</DropdownMenuItem>
        )}
        {orc.estado !== "rejeitado" && (
          <DropdownMenuItem onClick={() => onEstado("rejeitado")}><XCircle className="mr-2 h-4 w-4" />Marcar rejeitado</DropdownMenuItem>
        )}
        {orc.estado === "rascunho" && (
          <DropdownMenuItem onClick={() => onEstado("enviado")}><Send className="mr-2 h-4 w-4" />Marcar enviado</DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive" onClick={onDelete}><Trash2 className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
