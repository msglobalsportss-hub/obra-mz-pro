import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  unidades, categorias, type OrcamentoItem, type EstadoOrcamento, type Orcamento,
  totalOrcamento,
} from "@/lib/mock-data";
import { formatMZN } from "@/lib/format";
import { Plus, Trash2, GripVertical, FileText, Send, Save, Eye } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useObraMZStore } from "@/store/obramz-store";
import { openWhatsApp } from "@/lib/whatsapp";

const searchSchema = z.object({
  editar: z.string().optional(),
  clienteId: z.string().optional(),
  obraId: z.string().optional(),
});

export const Route = createFileRoute("/app/orcamentos/novo")({
  validateSearch: (search) => searchSchema.parse(search),
  component: NovoOrcamento,
});

function todayISO() { return new Date().toISOString().slice(0, 10); }
function addDaysISO(days: number, from: Date = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function newItem(): OrcamentoItem {
  return { id: crypto.randomUUID(), descricao: "", categoria: categorias[0], unidade: "unidade", quantidade: 1, precoUnitario: 0, desconto: 0 };
}

function NovoOrcamento() {
  const nav = useNavigate();
  const search = Route.useSearch();
  const clientes = useObraMZStore((s) => s.clientes);
  const obras = useObraMZStore((s) => s.obras);
  const createOrcamento = useObraMZStore((s) => s.createOrcamento);
  const updateOrcamento = useObraMZStore((s) => s.updateOrcamento);
  const updateOrcamentoEstado = useObraMZStore((s) => s.updateOrcamentoEstado);
  const empresa = useObraMZStore((s) => s.empresa);
  const existing = useObraMZStore((s) => (search.editar ? s.orcamentos.find((o) => o.id === search.editar) : undefined));

  const [clienteId, setClienteId] = useState(existing?.clienteId ?? search.clienteId ?? "");
  const [obraId, setObraId] = useState<string | undefined>(existing?.obraId ?? search.obraId ?? undefined);
  const [titulo, setTitulo] = useState(existing?.titulo ?? "");
  const [descricao, setDescricao] = useState(existing?.descricao ?? "");
  const [emissao, setEmissao] = useState(existing?.emissao ?? todayISO());
  const [validade, setValidade] = useState(existing?.validade ?? addDaysISO(30));
  const [itens, setItens] = useState<OrcamentoItem[]>(existing?.itens ?? [newItem()]);
  const [descontoGeral, setDescontoGeral] = useState(existing?.descontoGeral ?? 0);
  const [imposto, setImposto] = useState(existing?.imposto ?? 0);
  const [custosAdicionais, setCustosAdicionais] = useState(existing?.custosAdicionais ?? 0);
  const [notas, setNotas] = useState(existing?.notas ?? "");
  const [condicoes, setCondicoes] = useState(existing?.condicoes ?? "30% de sinal, 40% durante a execução, 30% na entrega.");

  // If store rehydrates after mount and 'existing' becomes available, sync once.
  useEffect(() => {
    if (existing && !titulo && !itens[0]?.descricao) {
      setClienteId(existing.clienteId);
      setObraId(existing.obraId);
      setTitulo(existing.titulo);
      setDescricao(existing.descricao);
      setEmissao(existing.emissao);
      setValidade(existing.validade);
      setItens(existing.itens);
      setDescontoGeral(existing.descontoGeral);
      setImposto(existing.imposto);
      setCustosAdicionais(existing.custosAdicionais);
      setNotas(existing.notas);
      setCondicoes(existing.condicoes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing?.id]);

  const obrasFiltradas = useMemo(
    () => (clienteId ? obras.filter((o) => o.clienteId === clienteId) : obras),
    [clienteId, obras],
  );

  const subtotal = useMemo(
    () => itens.reduce((s, i) => s + Math.max(0, i.quantidade) * Math.max(0, i.precoUnitario) - Math.max(0, i.desconto), 0),
    [itens],
  );
  const total = Math.max(0, subtotal - descontoGeral + imposto + custosAdicionais);

  const addItem = () => setItens((prev) => [...prev, newItem()]);
  const dupItem = (id: string) => {
    setItens((prev) => {
      const i = prev.find((x) => x.id === id);
      return i ? [...prev, { ...i, id: crypto.randomUUID() }] : prev;
    });
  };
  const rmItem = (id: string) => setItens((prev) => (prev.length > 1 ? prev.filter((x) => x.id !== id) : prev));
  const patchItem = (id: string, p: Partial<OrcamentoItem>) => setItens((prev) => prev.map((i) => i.id === id ? { ...i, ...p } : i));

  const build = (estado: EstadoOrcamento) => {
    if (!clienteId) { toast.error("Selecione um cliente"); return null; }
    if (!titulo.trim()) { toast.error("Adicione um título"); return null; }
    if (itens.some((i) => !i.descricao.trim())) { toast.error("Todos os itens precisam de descrição"); return null; }
    return {
      clienteId,
      obraId: obraId || undefined,
      titulo: titulo.trim(),
      descricao,
      emissao,
      validade,
      estado,
      itens,
      descontoGeral, imposto, custosAdicionais,
      notas,
      condicoes,
    };
  };

  const save = (estado: EstadoOrcamento, afterShareOnWhatsApp = false) => {
    const data = build(estado);
    if (!data) return;
    let saved: Orcamento | null = null;
    if (existing) {
      updateOrcamento(existing.id, data);
      if (existing.estado !== estado) updateOrcamentoEstado(existing.id, estado);
      saved = { ...existing, ...data };
      toast.success("Orçamento atualizado");
    } else {
      saved = createOrcamento(data);
      toast.success(`Orçamento ${saved.numero} criado`);
    }
    if (saved && afterShareOnWhatsApp) {
      const cli = clientes.find((c) => c.id === saved!.clienteId);
      if (cli) {
        const msg = `Olá ${cli.nome},\n\nSegue o orçamento *${saved.numero}* — ${saved.titulo}.\nValor total: *${formatMZN(totalOrcamento(saved).total)}*\nValidade: ${saved.validade}\n\nCumprimentos,\n${empresa.nome}`;
        openWhatsApp(cli.telefone, msg);
      }
    }
    if (saved) nav({ to: "/app/orcamentos/$id", params: { id: saved.id } });
  };

  return (
    <div>
      <PageHeader
        title={existing ? `Editar ${existing.numero}` : "Novo orçamento"}
        description={<Link to="/app/orcamentos" className="hover:text-primary">Orçamentos</Link>}
        actions={
          <>
            <Button variant="outline" onClick={() => save("rascunho")}><Save className="mr-1 h-4 w-4" />Guardar rascunho</Button>
            <Button variant="outline" onClick={() => save(existing?.estado ?? "rascunho")}><Eye className="mr-1 h-4 w-4" />Guardar e ver</Button>
            <Button className="bg-primary hover:bg-primary-dark" onClick={() => save("enviado", true)}>
              <Send className="mr-1 h-4 w-4" />Guardar e enviar
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="text-sm font-semibold">Informações principais</div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Número</Label><Input value={existing?.numero ?? "Automático"} disabled /></div>
            <div className="space-y-1.5"><Label>Data de emissão</Label><Input type="date" value={emissao} onChange={(e) => setEmissao(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Validade</Label><Input type="date" value={validade} onChange={(e) => setValidade(e.target.value)} /></div>
            <div className="space-y-1.5">
              <Label>Cliente <span className="text-destructive">*</span></Label>
              <Select value={clienteId} onValueChange={(v) => { setClienteId(v); setObraId(undefined); }}>
                <SelectTrigger><SelectValue placeholder="Selecionar cliente" /></SelectTrigger>
                <SelectContent>{clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Obra (opcional)</Label>
              <Select value={obraId ?? "none"} onValueChange={(v) => setObraId(v === "none" ? undefined : v)}>
                <SelectTrigger><SelectValue placeholder="Selecionar obra" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem obra</SelectItem>
                  {obrasFiltradas.map((o) => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Título <span className="text-destructive">*</span></Label>
              <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Construção de moradia T3" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Descrição do serviço</Label>
              <Textarea rows={2} value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Breve descrição..." />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="text-sm font-semibold">Resumo</div>
          <div className="mt-4 space-y-2 text-sm">
            <Row k="Subtotal" v={formatMZN(subtotal)} />
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Desconto geral</span>
              <Input type="number" min={0} className="h-8 w-32 text-right" value={descontoGeral} onChange={(e) => setDescontoGeral(Math.max(0, +e.target.value || 0))} />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Imposto</span>
              <Input type="number" min={0} className="h-8 w-32 text-right" value={imposto} onChange={(e) => setImposto(Math.max(0, +e.target.value || 0))} />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Custos adicionais</span>
              <Input type="number" min={0} className="h-8 w-32 text-right" value={custosAdicionais} onChange={(e) => setCustosAdicionais(Math.max(0, +e.target.value || 0))} />
            </div>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-primary-soft p-3">
              <span className="text-sm font-semibold text-primary-dark">Total</span>
              <span className="text-lg font-bold text-primary-dark">{formatMZN(total)}</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mt-4 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm font-semibold">Itens do orçamento</div>
          <Button variant="outline" size="sm" onClick={addItem}><Plus className="mr-1 h-4 w-4" />Adicionar item</Button>
        </div>

        <div className="space-y-3">
          {itens.map((i, idx) => (
            <div key={i.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start gap-2">
                <div className="mt-2 hidden text-muted-foreground sm:block"><GripVertical className="h-4 w-4" /></div>
                <div className="grid flex-1 gap-2 sm:grid-cols-12">
                  <div className="sm:col-span-6">
                    <Label className="text-xs">Descrição</Label>
                    <Input value={i.descricao} onChange={(e) => patchItem(i.id, { descricao: e.target.value })} />
                  </div>
                  <div className="sm:col-span-3">
                    <Label className="text-xs">Categoria</Label>
                    <Select value={i.categoria} onValueChange={(v) => patchItem(i.id, { categoria: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{categorias.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-3">
                    <Label className="text-xs">Unidade</Label>
                    <Select value={i.unidade} onValueChange={(v) => patchItem(i.id, { unidade: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{unidades.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-3">
                    <Label className="text-xs">Quantidade</Label>
                    <Input type="number" min={0} step="0.01" value={i.quantidade} onChange={(e) => patchItem(i.id, { quantidade: Math.max(0, +e.target.value || 0) })} />
                  </div>
                  <div className="sm:col-span-3">
                    <Label className="text-xs">Preço unitário</Label>
                    <Input type="number" min={0} step="0.01" value={i.precoUnitario} onChange={(e) => patchItem(i.id, { precoUnitario: Math.max(0, +e.target.value || 0) })} />
                  </div>
                  <div className="sm:col-span-3">
                    <Label className="text-xs">Desconto</Label>
                    <Input type="number" min={0} step="0.01" value={i.desconto} onChange={(e) => patchItem(i.id, { desconto: Math.max(0, +e.target.value || 0) })} />
                  </div>
                  <div className="sm:col-span-3">
                    <Label className="text-xs">Total</Label>
                    <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm font-semibold">
                      {formatMZN(Math.max(0, i.quantidade * i.precoUnitario - i.desconto))}
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex flex-col gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => dupItem(i.id)} aria-label="Duplicar"><FileText className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => rmItem(i.id)} aria-label="Remover"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">Item #{idx + 1}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-4 grid gap-4 p-5 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Notas</Label>
          <Textarea rows={4} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Notas adicionais visíveis no PDF" />
        </div>
        <div className="space-y-1.5">
          <Label>Condições comerciais</Label>
          <Textarea rows={4} value={condicoes} onChange={(e) => setCondicoes(e.target.value)} />
        </div>
      </Card>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}
