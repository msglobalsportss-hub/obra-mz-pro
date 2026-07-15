import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatusBadge } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StatCard } from "@/components/stat-card";
import { pagamentos, clientes, obras, orcamentos, clienteById, obraById, metodoPagamentoLabel, metricas } from "@/lib/mock-data";
import { formatDate, formatMZN } from "@/lib/format";
import { Plus, Wallet, TrendingUp, TrendingDown, CalendarRange, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/pagamentos/")({ component: PagamentosPage });

function PagamentosPage() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const m = metricas();
  const mesAtual = pagamentos.filter((p) => new Date(p.data).getMonth() === new Date().getMonth()).reduce((s, p) => s + p.valor, 0);

  const list = pagamentos.filter((p) => {
    const c = clienteById(p.clienteId)?.nome ?? "";
    return c.toLowerCase().includes(q.toLowerCase()) || p.referencia.toLowerCase().includes(q.toLowerCase());
  });

  return (
    <div>
      <PageHeader
        title="Pagamentos"
        description="Controlo dos pagamentos recebidos."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary-dark"><Plus className="mr-1 h-4 w-4" />Registar pagamento</Button>
            </DialogTrigger>
            <NovoPagamentoDialog onDone={() => setOpen(false)} />
          </Dialog>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total faturado" value={formatMZN(m.totalOrcado)} icon={TrendingUp} tone="primary" />
        <StatCard label="Total recebido" value={formatMZN(m.totalRecebido)} icon={Wallet} tone="success" />
        <StatCard label="Pendente" value={formatMZN(m.pendente)} icon={TrendingDown} tone="warning" />
        <StatCard label="Este mês" value={formatMZN(mesAtual)} icon={CalendarRange} />
      </div>

      <Card className="mt-6 p-4">
        <div className="mb-4 relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Pesquisar por cliente ou referência..." className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

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
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{clienteById(p.clienteId)?.nome}</TableCell>
                  <TableCell className="text-sm">{obraById(p.obraId)?.nome}</TableCell>
                  <TableCell className="text-sm">{formatDate(p.data)}</TableCell>
                  <TableCell className="text-sm">{metodoPagamentoLabel[p.metodo]}</TableCell>
                  <TableCell className="text-sm font-mono">{p.referencia}</TableCell>
                  <TableCell><StatusBadge tone="success">Confirmado</StatusBadge></TableCell>
                  <TableCell className="text-right font-semibold text-success">{formatMZN(p.valor)}</TableCell>
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
                  <div className="truncate font-semibold">{clienteById(p.clienteId)?.nome}</div>
                  <div className="truncate text-xs text-muted-foreground">{obraById(p.obraId)?.nome}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-success">{formatMZN(p.valor)}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(p.data)}</div>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="rounded bg-muted px-2 py-0.5">{metodoPagamentoLabel[p.metodo]}</span>
                <span className="font-mono text-muted-foreground">{p.referencia}</span>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}

function NovoPagamentoDialog({ onDone }: { onDone: () => void }) {
  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>Registar pagamento</DialogTitle></DialogHeader>
      <div className="grid gap-4">
        <div className="space-y-1.5"><Label>Cliente</Label>
          <Select><SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
            <SelectContent>{clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label>Obra</Label>
          <Select><SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
            <SelectContent>{obras.map((o) => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label>Orçamento associado (opcional)</Label>
          <Select><SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
            <SelectContent>{orcamentos.map((o) => <SelectItem key={o.id} value={o.id}>{o.numero}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Valor (MZN)</Label><Input type="number" placeholder="0" /></div>
          <div className="space-y-1.5"><Label>Data</Label><Input type="date" /></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Método</Label>
            <Select><SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mpesa">M-Pesa</SelectItem>
                <SelectItem value="emola">e-Mola</SelectItem>
                <SelectItem value="transferencia">Transferência bancária</SelectItem>
                <SelectItem value="deposito">Depósito bancário</SelectItem>
                <SelectItem value="numerario">Numerário</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Referência</Label><Input placeholder="Nº transação" /></div>
        </div>
        <div className="space-y-1.5"><Label>Observações</Label><Textarea rows={2} /></div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onDone}>Cancelar</Button>
        <Button className="bg-primary hover:bg-primary-dark" onClick={() => { toast.success("Pagamento registado (demo)"); onDone(); }}>Registar</Button>
      </DialogFooter>
    </DialogContent>
  );
}
