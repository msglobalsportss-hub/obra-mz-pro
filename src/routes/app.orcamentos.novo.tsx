import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { clientes, obras, unidades, categorias } from "@/lib/mock-data";
import { formatMZN } from "@/lib/format";
import { Plus, Trash2, GripVertical, FileText, Send, Save, Eye } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/orcamentos/novo")({ component: NovoOrcamento });

type Item = {
  id: string;
  descricao: string;
  categoria: string;
  unidade: string;
  quantidade: number;
  precoUnitario: number;
  desconto: number;
};

function NovoOrcamento() {
  const nav = useNavigate();
  const [itens, setItens] = useState<Item[]>([
    { id: "1", descricao: "Escavação e movimento de terras", categoria: "Preliminares", unidade: "m³", quantidade: 50, precoUnitario: 850, desconto: 0 },
    { id: "2", descricao: "Fundação em betão armado", categoria: "Fundação", unidade: "m³", quantidade: 20, precoUnitario: 8500, desconto: 0 },
  ]);
  const [descontoGeral, setDescontoGeral] = useState(0);
  const [imposto, setImposto] = useState(0);
  const [custosAdicionais, setCustosAdicionais] = useState(0);

  const subtotal = useMemo(
    () => itens.reduce((s, i) => s + i.quantidade * i.precoUnitario - i.desconto, 0),
    [itens],
  );
  const total = subtotal - descontoGeral + imposto + custosAdicionais;

  const addItem = () => setItens([...itens, { id: crypto.randomUUID(), descricao: "", categoria: categorias[0], unidade: "unidade", quantidade: 1, precoUnitario: 0, desconto: 0 }]);
  const dupItem = (id: string) => {
    const i = itens.find((x) => x.id === id);
    if (i) setItens([...itens, { ...i, id: crypto.randomUUID() }]);
  };
  const rmItem = (id: string) => setItens(itens.filter((x) => x.id !== id));
  const patch = (id: string, p: Partial<Item>) => setItens(itens.map((i) => i.id === id ? { ...i, ...p } : i));

  return (
    <div>
      <PageHeader
        title="Novo orçamento"
        description={<Link to="/app/orcamentos" className="hover:text-primary">Orçamentos</Link>}
        actions={
          <>
            <Button variant="outline" onClick={() => toast("Rascunho guardado")}><Save className="mr-1 h-4 w-4" />Guardar rascunho</Button>
            <Button variant="outline" onClick={() => nav({ to: "/app/orcamentos/$id", params: { id: "orc1" } })}><Eye className="mr-1 h-4 w-4" />Pré-visualizar</Button>
            <Button className="bg-primary hover:bg-primary-dark" onClick={() => { toast.success("Orçamento enviado (demo)"); nav({ to: "/app/orcamentos" }); }}>
              <Send className="mr-1 h-4 w-4" />Guardar e enviar
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="text-sm font-semibold">Informações principais</div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Número</Label><Input defaultValue="ORC-2026-0085" disabled /></div>
            <div className="space-y-1.5"><Label>Data de emissão</Label><Input type="date" defaultValue="2026-07-15" /></div>
            <div className="space-y-1.5"><Label>Validade</Label><Input type="date" defaultValue="2026-08-15" /></div>
            <div className="space-y-1.5">
              <Label>Cliente</Label>
              <Select><SelectTrigger><SelectValue placeholder="Selecionar cliente" /></SelectTrigger>
                <SelectContent>{clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Obra (opcional)</Label>
              <Select><SelectTrigger><SelectValue placeholder="Selecionar obra" /></SelectTrigger>
                <SelectContent>{obras.map((o) => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2"><Label>Título</Label><Input defaultValue="Construção de moradia T3" /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label>Descrição do serviço</Label><Textarea rows={2} placeholder="Breve descrição..." /></div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="text-sm font-semibold">Resumo</div>
          <div className="mt-4 space-y-2 text-sm">
            <Row k="Subtotal" v={formatMZN(subtotal)} />
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Desconto geral</span>
              <Input type="number" className="h-8 w-32 text-right" value={descontoGeral} onChange={(e) => setDescontoGeral(+e.target.value || 0)} />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Imposto</span>
              <Input type="number" className="h-8 w-32 text-right" value={imposto} onChange={(e) => setImposto(+e.target.value || 0)} />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Custos adicionais</span>
              <Input type="number" className="h-8 w-32 text-right" value={custosAdicionais} onChange={(e) => setCustosAdicionais(+e.target.value || 0)} />
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
                    <Input value={i.descricao} onChange={(e) => patch(i.id, { descricao: e.target.value })} />
                  </div>
                  <div className="sm:col-span-3">
                    <Label className="text-xs">Categoria</Label>
                    <Select value={i.categoria} onValueChange={(v) => patch(i.id, { categoria: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{categorias.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-3">
                    <Label className="text-xs">Unidade</Label>
                    <Select value={i.unidade} onValueChange={(v) => patch(i.id, { unidade: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{unidades.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-3">
                    <Label className="text-xs">Quantidade</Label>
                    <Input type="number" value={i.quantidade} onChange={(e) => patch(i.id, { quantidade: +e.target.value || 0 })} />
                  </div>
                  <div className="sm:col-span-3">
                    <Label className="text-xs">Preço unitário</Label>
                    <Input type="number" value={i.precoUnitario} onChange={(e) => patch(i.id, { precoUnitario: +e.target.value || 0 })} />
                  </div>
                  <div className="sm:col-span-3">
                    <Label className="text-xs">Desconto</Label>
                    <Input type="number" value={i.desconto} onChange={(e) => patch(i.id, { desconto: +e.target.value || 0 })} />
                  </div>
                  <div className="sm:col-span-3">
                    <Label className="text-xs">Total</Label>
                    <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm font-semibold">
                      {formatMZN(i.quantidade * i.precoUnitario - i.desconto)}
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex flex-col gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => dupItem(i.id)}><FileText className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => rmItem(i.id)}><Trash2 className="h-4 w-4" /></Button>
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
          <Textarea rows={4} placeholder="Notas adicionais visíveis no PDF" />
        </div>
        <div className="space-y-1.5">
          <Label>Condições comerciais</Label>
          <Textarea rows={4} defaultValue="30% de sinal, 40% durante a execução, 30% na entrega." />
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
