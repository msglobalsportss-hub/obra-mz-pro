import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, StatusBadge } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, MapPin, Calendar, HardHat } from "lucide-react";
import { obras, clientes, clienteById, provincias, tiposObra, estadoObraLabel } from "@/lib/mock-data";
import type { EstadoObra } from "@/lib/mock-data";
import { formatDate, formatMZN } from "@/lib/format";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/obras/")({ component: ObrasPage });

const toneFor = (e: EstadoObra) =>
  e === "concluida" ? "success" :
  e === "em_andamento" ? "primary" :
  e === "suspensa" ? "warning" :
  e === "cancelada" ? "destructive" : "muted";

function ObrasPage() {
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<string>("all");
  const [cliente, setCliente] = useState<string>("all");
  const [openNew, setOpenNew] = useState(false);

  const list = useMemo(() => obras.filter((o) =>
    (estado === "all" || o.estado === estado) &&
    (cliente === "all" || o.clienteId === cliente) &&
    o.nome.toLowerCase().includes(q.toLowerCase())
  ), [q, estado, cliente]);

  return (
    <div>
      <PageHeader
        title="Obras"
        description="Todas as obras da sua empreiteira."
        actions={
          <Dialog open={openNew} onOpenChange={setOpenNew}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary-dark"><Plus className="mr-1 h-4 w-4" />Nova obra</Button>
            </DialogTrigger>
            <NovaObraDialog onDone={() => setOpenNew(false)} />
          </Dialog>
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
              <SelectItem value="planeada">Planeada</SelectItem>
              <SelectItem value="em_andamento">Em andamento</SelectItem>
              <SelectItem value="suspensa">Suspensa</SelectItem>
              <SelectItem value="concluida">Concluída</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((o) => (
                <TableRow key={o.id} className="cursor-pointer" onClick={() => window.location.assign(`/app/obras/${o.id}`)}>
                  <TableCell>
                    <Link to="/app/obras/$id" params={{ id: o.id }} className="font-medium hover:text-primary">{o.nome}</Link>
                    <div className="text-xs text-muted-foreground">{o.tipo}</div>
                  </TableCell>
                  <TableCell className="text-sm">{clienteById(o.clienteId)?.nome}</TableCell>
                  <TableCell className="text-sm">{o.cidade}, {o.provincia}</TableCell>
                  <TableCell><StatusBadge tone={toneFor(o.estado)}>{estadoObraLabel[o.estado]}</StatusBadge></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={o.progresso} className="h-1.5 flex-1" />
                      <span className="w-9 text-xs font-semibold">{o.progresso}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{formatMZN(o.valorPrevisto)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="grid gap-3 lg:hidden">
          {list.map((o) => (
            <Link key={o.id} to="/app/obras/$id" params={{ id: o.id }}>
              <Card className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{o.nome}</div>
                    <div className="text-xs text-muted-foreground">{clienteById(o.clienteId)?.nome}</div>
                  </div>
                  <StatusBadge tone={toneFor(o.estado)}>{estadoObraLabel[o.estado]}</StatusBadge>
                </div>
                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{o.cidade}</span>
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
            </Link>
          ))}
        </div>

        {list.length === 0 && (
          <div className="py-16 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground"><HardHat className="h-5 w-5" /></div>
            <div className="mt-3 text-sm font-semibold">Nenhuma obra encontrada</div>
          </div>
        )}
      </Card>
    </div>
  );
}

function NovaObraDialog({ onDone }: { onDone: () => void }) {
  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader><DialogTitle>Nova obra</DialogTitle></DialogHeader>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2"><Label>Nome da obra</Label><Input placeholder="Ex.: Moradia T3 — Machava" /></div>
        <div className="space-y-1.5">
          <Label>Cliente</Label>
          <Select><SelectTrigger><SelectValue placeholder="Selecionar cliente" /></SelectTrigger>
            <SelectContent>{clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Tipo de obra</Label>
          <Select><SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
            <SelectContent>{tiposObra.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Província</Label>
          <Select><SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
            <SelectContent>{provincias.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label>Cidade / Distrito</Label><Input /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label>Endereço</Label><Input /></div>
        <div className="space-y-1.5"><Label>Data de início</Label><Input type="date" /></div>
        <div className="space-y-1.5"><Label>Data prevista de conclusão</Label><Input type="date" /></div>
        <div className="space-y-1.5"><Label>Valor previsto (MZN)</Label><Input type="number" placeholder="0" /></div>
        <div className="space-y-1.5">
          <Label>Estado</Label>
          <Select defaultValue="planeada"><SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="planeada">Planeada</SelectItem>
              <SelectItem value="em_andamento">Em andamento</SelectItem>
              <SelectItem value="suspensa">Suspensa</SelectItem>
              <SelectItem value="concluida">Concluída</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2"><Label>Responsável</Label><Input placeholder="Ex.: Eng. Mário Sitoe" /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label>Descrição / Observações</Label><Textarea rows={3} /></div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onDone}>Cancelar</Button>
        <Button className="bg-primary hover:bg-primary-dark" onClick={() => { toast.success("Obra criada (demo)"); onDone(); }}>Guardar obra</Button>
      </DialogFooter>
    </DialogContent>
  );
}
