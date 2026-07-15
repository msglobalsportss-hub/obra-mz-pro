import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, StatusBadge } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreHorizontal, Eye, Pencil, Copy, FileText, Send, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import {
  orcamentos, clientes, clienteById, obraById, totalOrcamento,
  estadoOrcamentoLabel,
} from "@/lib/mock-data";
import type { EstadoOrcamento } from "@/lib/mock-data";
import { formatDate, formatMZN } from "@/lib/format";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/orcamentos/")({ component: OrcamentosPage });

const toneFor = (e: EstadoOrcamento) =>
  e === "aceite" ? "success" :
  e === "rejeitado" || e === "expirado" || e === "cancelado" ? "destructive" :
  e === "enviado" || e === "visualizado" ? "primary" : "muted";

function OrcamentosPage() {
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<string>("all");
  const [cliente, setCliente] = useState<string>("all");

  const list = useMemo(() => orcamentos.filter((o) =>
    (estado === "all" || o.estado === estado) &&
    (cliente === "all" || o.clienteId === cliente) &&
    (o.numero.toLowerCase().includes(q.toLowerCase()) || o.titulo.toLowerCase().includes(q.toLowerCase()))
  ), [q, estado, cliente]);

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
              {(["rascunho", "enviado", "visualizado", "aceite", "rejeitado", "expirado", "cancelado"] as EstadoOrcamento[]).map((e) =>
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
                    <div className="text-sm">{clienteById(o.clienteId)?.nome}</div>
                    {o.obraId && <div className="text-xs text-muted-foreground">{obraById(o.obraId)?.nome}</div>}
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(o.emissao)}</TableCell>
                  <TableCell className="text-sm">{formatDate(o.validade)}</TableCell>
                  <TableCell><StatusBadge tone={toneFor(o.estado)}>{estadoOrcamentoLabel[o.estado]}</StatusBadge></TableCell>
                  <TableCell className="text-right font-semibold">{formatMZN(totalOrcamento(o).total)}</TableCell>
                  <TableCell><RowActions id={o.id} /></TableCell>
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
                  <div className="truncate text-xs text-muted-foreground">{clienteById(o.clienteId)?.nome}</div>
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

        {list.length === 0 && (
          <div className="py-16 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground"><FileText className="h-5 w-5" /></div>
            <div className="mt-3 text-sm font-semibold">Nenhum orçamento encontrado</div>
          </div>
        )}
      </Card>
    </div>
  );
}

function RowActions({ id }: { id: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild><Link to="/app/orcamentos/$id" params={{ id }}><Eye className="mr-2 h-4 w-4" />Abrir</Link></DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast("Editar (demo)")}><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast.success("Duplicado (demo)")}><Copy className="mr-2 h-4 w-4" />Duplicar</DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast("A gerar PDF...")}><FileText className="mr-2 h-4 w-4" />Gerar PDF</DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast.success("Aberto no WhatsApp (demo)")}><Send className="mr-2 h-4 w-4" />Enviar por WhatsApp</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => toast.success("Marcado como aceite")}><CheckCircle2 className="mr-2 h-4 w-4" />Marcar aceite</DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast.error("Marcado como rejeitado")}><XCircle className="mr-2 h-4 w-4" />Marcar rejeitado</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive" onClick={() => toast.error("Eliminado (demo)")}><Trash2 className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
