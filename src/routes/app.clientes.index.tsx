import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Search, MoreHorizontal, Eye, Pencil, HardHat, FileText, Trash2, Building2, User } from "lucide-react";
import { clientes, provincias } from "@/lib/mock-data";
import { formatDate, formatMZN, initials } from "@/lib/format";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/clientes/")({ component: ClientesPage });

function ClientesPage() {
  const [q, setQ] = useState("");
  const [prov, setProv] = useState<string>("all");
  const [openNew, setOpenNew] = useState(false);

  const filtered = useMemo(() => {
    return clientes.filter((c) =>
      (prov === "all" || c.provincia === prov) &&
      (c.nome.toLowerCase().includes(q.toLowerCase()) ||
        c.email.toLowerCase().includes(q.toLowerCase()) ||
        c.telefone.includes(q))
    );
  }, [q, prov]);

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Gerir os clientes da sua empreiteira."
        actions={
          <Dialog open={openNew} onOpenChange={setOpenNew}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary-dark"><Plus className="mr-1 h-4 w-4" />Novo cliente</Button>
            </DialogTrigger>
            <NovoClienteDialog onDone={() => setOpenNew(false)} />
          </Dialog>
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

        {/* Table (desktop) */}
        <div className="hidden overflow-hidden rounded-lg border border-border md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Cliente</TableHead>
                <TableHead>Contactos</TableHead>
                <TableHead>NUIT</TableHead>
                <TableHead className="text-center">Obras</TableHead>
                <TableHead className="text-right">Valor total</TableHead>
                <TableHead>Última atividade</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9"><AvatarFallback className="bg-primary-soft text-primary-dark text-xs font-bold">{initials(c.nome)}</AvatarFallback></Avatar>
                      <div className="min-w-0">
                        <Link to="/app/clientes/$id" params={{ id: c.id }} className="block truncate font-medium hover:text-primary">{c.nome}</Link>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {c.tipo === "empresa" ? <Building2 className="h-3 w-3" /> : <User className="h-3 w-3" />}
                          {c.tipo === "empresa" ? "Empresa" : "Particular"} · {c.cidade}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{c.telefone}</div>
                    <div className="text-xs text-muted-foreground">{c.email}</div>
                  </TableCell>
                  <TableCell className="text-sm">{c.nuit}</TableCell>
                  <TableCell className="text-center font-semibold">{c.obras}</TableCell>
                  <TableCell className="text-right font-semibold">{formatMZN(c.valorTotal)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(c.ultimaAtividade)}</TableCell>
                  <TableCell>
                    <RowActions clienteId={c.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Cards (mobile) */}
        <div className="grid gap-3 md:hidden">
          {filtered.map((c) => (
            <Card key={c.id} className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10"><AvatarFallback className="bg-primary-soft text-primary-dark text-xs font-bold">{initials(c.nome)}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1">
                  <Link to="/app/clientes/$id" params={{ id: c.id }} className="block truncate font-semibold">{c.nome}</Link>
                  <div className="text-xs text-muted-foreground">{c.telefone}</div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div><div className="text-muted-foreground">Obras</div><div className="font-semibold">{c.obras}</div></div>
                    <div><div className="text-muted-foreground">Total</div><div className="font-semibold">{formatMZN(c.valorTotal)}</div></div>
                  </div>
                </div>
                <RowActions clienteId={c.id} />
              </div>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
              <Search className="h-5 w-5" />
            </div>
            <div className="mt-3 text-sm font-semibold">Nenhum cliente encontrado</div>
            <div className="text-xs text-muted-foreground">Tente ajustar os filtros ou pesquisar por outro termo.</div>
          </div>
        )}
      </Card>
    </div>
  );
}

function RowActions({ clienteId }: { clienteId: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild><Link to="/app/clientes/$id" params={{ id: clienteId }}><Eye className="mr-2 h-4 w-4" />Ver detalhes</Link></DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast("Editar cliente (demo)")}><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast("Nova obra (demo)")}><HardHat className="mr-2 h-4 w-4" />Criar obra</DropdownMenuItem>
        <DropdownMenuItem asChild><Link to="/app/orcamentos/novo"><FileText className="mr-2 h-4 w-4" />Criar orçamento</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive" onClick={() => toast.error("Cliente eliminado (demo)")}><Trash2 className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NovoClienteDialog({ onDone }: { onDone: () => void }) {
  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader><DialogTitle>Novo cliente</DialogTitle></DialogHeader>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-1.5">
          <Label>Nome / Empresa</Label>
          <Input placeholder="Ex.: João Mabote" />
        </div>
        <div className="space-y-1.5">
          <Label>Tipo</Label>
          <Select defaultValue="particular">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="particular">Particular</SelectItem>
              <SelectItem value="empresa">Empresa</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label>NUIT</Label><Input placeholder="100200300" /></div>
        <div className="space-y-1.5"><Label>Telefone principal</Label><Input placeholder="+258 84 000 0000" /></div>
        <div className="space-y-1.5"><Label>Telefone alternativo</Label><Input placeholder="Opcional" /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label>Email</Label><Input type="email" placeholder="cliente@email.mz" /></div>
        <div className="space-y-1.5">
          <Label>Província</Label>
          <Select><SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
            <SelectContent>{provincias.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label>Cidade / Distrito</Label><Input /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label>Endereço</Label><Input /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label>Observações</Label><Textarea rows={3} /></div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onDone}>Cancelar</Button>
        <Button className="bg-primary hover:bg-primary-dark" onClick={() => { toast.success("Cliente criado (demo)"); onDone(); }}>Guardar cliente</Button>
      </DialogFooter>
    </DialogContent>
  );
}
