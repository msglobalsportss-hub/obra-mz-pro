import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Search, MoreHorizontal, Eye, Pencil, HardHat, FileText, Trash2, Building2, User, Users } from "lucide-react";
import { provincias, type Cliente } from "@/lib/mock-data";
import { formatMZN, initials } from "@/lib/format";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useObraMZStore, totalsPorCliente } from "@/store/obramz-store";
import { ClientFormDialog } from "@/components/clients/client-form-dialog";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";

export const Route = createFileRoute("/app/clientes/")({ component: ClientesPage });

function ClientesPage() {
  const clientes = useObraMZStore((s) => s.clientes);
  const deleteCliente = useObraMZStore((s) => s.deleteCliente);
  const [q, setQ] = useState("");
  const [prov, setProv] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [obraFor, setObraFor] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<Cliente | null>(null);

  const filtered = useMemo(() => {
    const query = q.toLowerCase().trim();
    return clientes.filter((c) =>
      (prov === "all" || c.provincia === prov) &&
      (!query ||
        c.nome.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        c.telefone.includes(query)),
    );
  }, [q, prov, clientes]);

  const openNew = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (c: Cliente) => { setEditing(c); setFormOpen(true); };

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Gerir os clientes da sua empreiteira."
        actions={
          <Button className="bg-primary hover:bg-primary-dark" onClick={openNew}>
            <Plus className="mr-1 h-4 w-4" />Novo cliente
          </Button>
        }
      />

      <Card className="p-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Pesquisar por nome, email ou telefone..." className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select value={prov} onValueChange={setProv}>
            <SelectTrigger className="sm:w-56"><SelectValue placeholder="Província" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as províncias</SelectItem>
              {provincias.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={clientes.length === 0 ? Users : Search}
            title={clientes.length === 0 ? "Ainda sem clientes" : "Nenhum cliente encontrado"}
            description={clientes.length === 0 ? "Comece por criar o primeiro cliente da sua empreiteira." : "Tente ajustar os filtros ou pesquisar por outro termo."}
            action={clientes.length === 0 && <Button onClick={openNew} className="bg-primary hover:bg-primary-dark"><Plus className="mr-1 h-4 w-4" />Criar cliente</Button>}
          />
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-lg border border-border md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contactos</TableHead>
                    <TableHead>NUIT</TableHead>
                    <TableHead className="text-center">Obras</TableHead>
                    <TableHead className="text-right">Total orçado</TableHead>
                    <TableHead className="text-right">Recebido</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => {
                    const t = totalsPorCliente(c.id);
                    return (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9"><AvatarFallback className="bg-primary-soft text-primary-dark text-xs font-bold">{initials(c.nome)}</AvatarFallback></Avatar>
                            <div className="min-w-0">
                              <Link to="/app/clientes/$id" params={{ id: c.id }} className="block truncate font-medium hover:text-primary">{c.nome}</Link>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                {c.tipo === "empresa" ? <Building2 className="h-3 w-3" /> : <User className="h-3 w-3" />}
                                {c.tipo === "empresa" ? "Empresa" : "Particular"} · {c.cidade || c.provincia}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{c.telefone}</div>
                          <div className="text-xs text-muted-foreground">{c.email}</div>
                        </TableCell>
                        <TableCell className="text-sm">{c.nuit || "—"}</TableCell>
                        <TableCell className="text-center font-semibold">{t.obras.length}</TableCell>
                        <TableCell className="text-right font-semibold">{formatMZN(t.orcado)}</TableCell>
                        <TableCell className="text-right font-semibold text-success">{formatMZN(t.recebido)}</TableCell>
                        <TableCell>
                          <RowActions
                            cliente={c}
                            onEdit={() => openEdit(c)}
                            onNewObra={() => setObraFor(c.id)}
                            onDelete={() => setConfirmDel(c)}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="grid gap-3 md:hidden">
              {filtered.map((c) => {
                const t = totalsPorCliente(c.id);
                return (
                  <Card key={c.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10"><AvatarFallback className="bg-primary-soft text-primary-dark text-xs font-bold">{initials(c.nome)}</AvatarFallback></Avatar>
                      <div className="min-w-0 flex-1">
                        <Link to="/app/clientes/$id" params={{ id: c.id }} className="block truncate font-semibold">{c.nome}</Link>
                        <div className="text-xs text-muted-foreground">{c.telefone}</div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                          <div><div className="text-muted-foreground">Obras</div><div className="font-semibold">{t.obras.length}</div></div>
                          <div><div className="text-muted-foreground">Recebido</div><div className="font-semibold">{formatMZN(t.recebido)}</div></div>
                        </div>
                      </div>
                      <RowActions
                        cliente={c}
                        onEdit={() => openEdit(c)}
                        onNewObra={() => setObraFor(c.id)}
                        onDelete={() => setConfirmDel(c)}
                      />
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </Card>

      <ClientFormDialog open={formOpen} onOpenChange={setFormOpen} cliente={editing} />
      <ProjectFormDialog
        open={!!obraFor}
        onOpenChange={(o) => !o && setObraFor(null)}
        defaultClienteId={obraFor ?? undefined}
      />
      <ConfirmDialog
        open={!!confirmDel}
        onOpenChange={(o) => !o && setConfirmDel(null)}
        title={`Eliminar cliente ${confirmDel?.nome}?`}
        description="Esta ação não pode ser desfeita. Obras, orçamentos e pagamentos associados manter-se-ão no sistema."
        confirmLabel="Eliminar"
        tone="destructive"
        onConfirm={() => {
          if (confirmDel) {
            deleteCliente(confirmDel.id);
            toast.success("Cliente eliminado");
            setConfirmDel(null);
          }
        }}
      />
    </div>
  );
}

function RowActions({
  cliente, onEdit, onNewObra, onDelete,
}: { cliente: Cliente; onEdit: () => void; onNewObra: () => void; onDelete: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild><Link to="/app/clientes/$id" params={{ id: cliente.id }}><Eye className="mr-2 h-4 w-4" />Ver detalhes</Link></DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
        <DropdownMenuItem onClick={onNewObra}><HardHat className="mr-2 h-4 w-4" />Criar obra</DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/app/orcamentos/novo" search={{ clienteId: cliente.id }}>
            <FileText className="mr-2 h-4 w-4" />Criar orçamento
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive" onClick={onDelete}>
          <Trash2 className="mr-2 h-4 w-4" />Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
