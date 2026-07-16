import { createFileRoute, Link, useParams, useNavigate } from "@tanstack/react-router";
import { PageHeader, StatusBadge } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  totalOrcamento, estadoObraLabel, estadoOrcamentoLabel, metodoPagamentoLabel,
} from "@/lib/mock-data";
import { formatDate, formatMZN, initials } from "@/lib/format";
import { StatCard } from "@/components/stat-card";
import { Wallet, HardHat, FileText, TrendingDown, Phone, Mail, MapPin, Building2, Pencil, Trash2, Plus } from "lucide-react";
import { useObraMZStore, totalsPorCliente } from "@/store/obramz-store";
import { useState } from "react";
import { ClientFormDialog } from "@/components/clients/client-form-dialog";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/app/clientes/$id")({ component: ClienteDetalhe });

function ClienteDetalhe() {
  const { id } = useParams({ from: "/app/clientes/$id" });
  const nav = useNavigate();
  const cliente = useObraMZStore((s) => s.clientes.find((c) => c.id === id));
  const obras = useObraMZStore((s) => s.obras.filter((o) => o.clienteId === id));
  const orcamentos = useObraMZStore((s) => s.orcamentos.filter((o) => o.clienteId === id));
  const pagamentos = useObraMZStore((s) => s.pagamentos.filter((p) => p.clienteId === id));
  const deleteCliente = useObraMZStore((s) => s.deleteCliente);

  const [editOpen, setEditOpen] = useState(false);
  const [obraOpen, setObraOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  if (!cliente) {
    return (
      <Card className="p-8 text-center">
        <div className="text-sm font-semibold">Cliente não encontrado.</div>
        <div className="mt-2"><Link to="/app/clientes" className="text-primary">Voltar para clientes</Link></div>
      </Card>
    );
  }

  const t = totalsPorCliente(cliente.id);

  return (
    <div>
      <PageHeader
        title={cliente.nome}
        description={<><Link to="/app/clientes" className="hover:text-primary">Clientes</Link> · {cliente.tipo === "empresa" ? "Empresa" : "Particular"}</>}
        actions={
          <>
            <Button variant="outline" onClick={() => setEditOpen(true)}><Pencil className="mr-1 h-4 w-4" />Editar</Button>
            <Button variant="outline" onClick={() => setConfirmDel(true)} className="text-destructive"><Trash2 className="mr-1 h-4 w-4" />Eliminar</Button>
            <Link to="/app/orcamentos/novo" search={{ clienteId: cliente.id }}>
              <Button className="bg-primary hover:bg-primary-dark"><Plus className="mr-1 h-4 w-4" />Novo orçamento</Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14"><AvatarFallback className="bg-primary-soft text-primary-dark font-bold">{initials(cliente.nome)}</AvatarFallback></Avatar>
            <div className="min-w-0">
              <div className="font-semibold">{cliente.nome}</div>
              <div className="text-xs text-muted-foreground">NUIT {cliente.nuit || "—"}</div>
            </div>
          </div>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex items-start gap-2"><Phone className="mt-0.5 h-4 w-4 text-muted-foreground" /><span>{cliente.telefone}{cliente.telefone2 && ` · ${cliente.telefone2}`}</span></div>
            <div className="flex items-start gap-2"><Mail className="mt-0.5 h-4 w-4 text-muted-foreground" /><span>{cliente.email || "—"}</span></div>
            <div className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" /><span>{[cliente.endereco, cliente.cidade, cliente.provincia].filter(Boolean).join(", ") || "—"}</span></div>
            {cliente.tipo === "empresa" && <div className="flex items-start gap-2"><Building2 className="mt-0.5 h-4 w-4 text-muted-foreground" />Empresa</div>}
            {cliente.observacoes && <div className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">{cliente.observacoes}</div>}
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          <StatCard label="Obras" value={obras.length} icon={HardHat} tone="primary" />
          <StatCard label="Orçamentos" value={orcamentos.length} icon={FileText} tone="primary" />
          <StatCard label="Recebido" value={formatMZN(t.recebido)} icon={Wallet} tone="success" />
          <StatCard label="Saldo pendente" value={formatMZN(t.pendente)} icon={TrendingDown} tone="warning" />
        </div>
      </div>

      <Tabs defaultValue="obras" className="mt-6">
        <TabsList>
          <TabsTrigger value="obras">Obras ({obras.length})</TabsTrigger>
          <TabsTrigger value="orcamentos">Orçamentos ({orcamentos.length})</TabsTrigger>
          <TabsTrigger value="pagamentos">Pagamentos ({pagamentos.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="obras" className="mt-4">
          <Card>
            <div className="flex items-center justify-between border-b p-3">
              <div className="text-sm font-semibold">Obras do cliente</div>
              <Button size="sm" variant="outline" onClick={() => setObraOpen(true)}><Plus className="mr-1 h-3.5 w-3.5" />Nova obra</Button>
            </div>
            <div className="divide-y">
              {obras.map((o) => (
                <Link key={o.id} to="/app/obras/$id" params={{ id: o.id }} className="flex items-center justify-between gap-4 p-4 hover:bg-muted/50">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{o.nome}</div>
                    <div className="text-xs text-muted-foreground">{o.cidade} · {formatDate(o.inicio)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{formatMZN(o.valorPrevisto)}</div>
                    <StatusBadge tone={o.estado === "concluida" ? "success" : o.estado === "em_andamento" ? "primary" : o.estado === "suspensa" ? "warning" : o.estado === "cancelada" ? "destructive" : "muted"}>
                      {estadoObraLabel[o.estado]}
                    </StatusBadge>
                  </div>
                </Link>
              ))}
              {obras.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">Sem obras.</div>}
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="orcamentos" className="mt-4">
          <Card>
            <div className="divide-y">
              {orcamentos.map((o) => (
                <Link key={o.id} to="/app/orcamentos/$id" params={{ id: o.id }} className="flex items-center justify-between gap-4 p-4 hover:bg-muted/50">
                  <div>
                    <div className="font-medium">{o.numero}</div>
                    <div className="text-xs text-muted-foreground">{o.titulo}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{formatMZN(totalOrcamento(o).total)}</div>
                    <StatusBadge tone={o.estado === "aceite" ? "success" : o.estado === "rejeitado" || o.estado === "cancelado" || o.estado === "expirado" ? "destructive" : "primary"}>{estadoOrcamentoLabel[o.estado]}</StatusBadge>
                  </div>
                </Link>
              ))}
              {orcamentos.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">Sem orçamentos.</div>}
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="pagamentos" className="mt-4">
          <Card>
            <div className="divide-y">
              {pagamentos.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-4 p-4">
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

      <ClientFormDialog open={editOpen} onOpenChange={setEditOpen} cliente={cliente} />
      <ProjectFormDialog open={obraOpen} onOpenChange={setObraOpen} defaultClienteId={cliente.id} />
      <ConfirmDialog
        open={confirmDel}
        onOpenChange={setConfirmDel}
        title={`Eliminar ${cliente.nome}?`}
        description="Esta ação não pode ser desfeita."
        confirmLabel="Eliminar"
        tone="destructive"
        onConfirm={() => {
          deleteCliente(cliente.id);
          toast.success("Cliente eliminado");
          nav({ to: "/app/clientes" });
        }}
      />
    </div>
  );
}
