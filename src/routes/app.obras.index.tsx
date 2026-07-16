import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, StatusBadge } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, MapPin, Calendar, HardHat, MoreHorizontal, Eye, Pencil, Trash2, FileText } from "lucide-react";
import { estadoObraLabel, type EstadoObra, type Obra } from "@/lib/mock-data";
import { formatDate, formatMZN } from "@/lib/format";
import { useMemo, useState } from "react";
import { useObraMZStore } from "@/store/obramz-store";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { toast } from "sonner";

export const Route = createFileRoute("/app/obras/")({ component: ObrasPage });

const toneFor = (e: EstadoObra) =>
  e === "concluida" ? "success" :
  e === "em_andamento" ? "primary" :
  e === "suspensa" ? "warning" :
  e === "cancelada" ? "destructive" : "muted";

function ObrasPage() {
  const obras = useObraMZStore((s) => s.obras);
  const clientes = useObraMZStore((s) => s.clientes);
  const deleteObra = useObraMZStore((s) => s.deleteObra);
  const clienteById = (id: string) => clientes.find((c) => c.id === id);

  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<string>("all");
  const [cliente, setCliente] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Obra | null>(null);
  const [confirmDel, setConfirmDel] = useState<Obra | null>(null);

  const list = useMemo(() => obras.filter((o) =>
    (estado === "all" || o.estado === estado) &&
    (cliente === "all" || o.clienteId === cliente) &&
    o.nome.toLowerCase().includes(q.toLowerCase())
  ), [q, estado, cliente, obras]);

  const openNew = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (o: Obra) => { setEditing(o); setFormOpen(true); };

  return (
    <div>
      <PageHeader
        title="Obras"
        description="Todas as obras da sua empreiteira."
        actions={
          <Button className="bg-primary hover:bg-primary-dark" onClick={openNew}>
            <Plus className="mr-1 h-4 w-4" />Nova obra
          </Button>
        }
      />

      <Card className="p-4">
        <div className="mb-4 grid gap-3 sm:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Pesquisar obra..." className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select value={estado} onValueChange={setEstado}>
            <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os estados</SelectItem>
              {(Object.keys(estadoObraLabel) as EstadoObra[]).map((e) =>
                <SelectItem key={e} value={e}>{estadoObraLabel[e]}</SelectItem>)}
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
            icon={HardHat}
            title={obras.length === 0 ? "Ainda sem obras" : "Nenhuma obra encontrada"}
            description={obras.length === 0 ? "Registe a sua primeira obra para começar." : "Ajuste os filtros."}
            action={obras.length === 0 && <Button onClick={openNew} className="bg-primary hover:bg-primary-dark"><Plus className="mr-1 h-4 w-4" />Nova obra</Button>}
          />
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-lg border border-border lg:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Obra</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-40">Progresso</TableHead>
                    <TableHead className="text-right">Valor previsto</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell>
                        <Link to="/app/obras/$id" params={{ id: o.id }} className="font-medium hover:text-primary">{o.nome}</Link>
                        <div className="text-xs text-muted-foreground">{o.tipo}</div>
                      </TableCell>
                      <TableCell className="text-sm">{clienteById(o.clienteId)?.nome ?? "—"}</TableCell>
                      <TableCell className="text-sm">{[o.cidade, o.provincia].filter(Boolean).join(", ") || "—"}</TableCell>
                      <TableCell><StatusBadge tone={toneFor(o.estado)}>{estadoObraLabel[o.estado]}</StatusBadge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={o.progresso} className="h-1.5 flex-1" />
                          <span className="w-9 text-xs font-semibold">{o.progresso}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{formatMZN(o.valorPrevisto)}</TableCell>
                      <TableCell>
                        <ObraActions obra={o} onEdit={() => openEdit(o)} onDelete={() => setConfirmDel(o)} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid gap-3 lg:hidden">
              {list.map((o) => (
                <Card key={o.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <Link to="/app/obras/$id" params={{ id: o.id }} className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{o.nome}</div>
                      <div className="text-xs text-muted-foreground">{clienteById(o.clienteId)?.nome ?? "—"}</div>
                    </Link>
                    <StatusBadge tone={toneFor(o.estado)}>{estadoObraLabel[o.estado]}</StatusBadge>
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{o.cidade || "—"}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(o.inicio)}</span>
                  </div>
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-semibold">{o.progresso}%</span>
                    </div>
                    <Progress value={o.progresso} className="h-1.5" />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Valor</span>
                    <span className="font-semibold">{formatMZN(o.valorPrevisto)}</span>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </Card>

      <ProjectFormDialog open={formOpen} onOpenChange={setFormOpen} obra={editing} />
      <ConfirmDialog
        open={!!confirmDel}
        onOpenChange={(o) => !o && setConfirmDel(null)}
        title={`Eliminar obra ${confirmDel?.nome}?`}
        description="Esta ação não pode ser desfeita."
        confirmLabel="Eliminar"
        tone="destructive"
        onConfirm={() => {
          if (confirmDel) {
            deleteObra(confirmDel.id);
            toast.success("Obra eliminada");
            setConfirmDel(null);
          }
        }}
      />
    </div>
  );
}

function ObraActions({ obra, onEdit, onDelete }: { obra: Obra; onEdit: () => void; onDelete: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild><Link to="/app/obras/$id" params={{ id: obra.id }}><Eye className="mr-2 h-4 w-4" />Ver detalhes</Link></DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/app/orcamentos/novo" search={{ clienteId: obra.clienteId, obraId: obra.id }}>
            <FileText className="mr-2 h-4 w-4" />Criar orçamento
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive" onClick={onDelete}><Trash2 className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
