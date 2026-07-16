import { useEffect, useState } from "react";
import type { Obra, EstadoObra } from "@/lib/mock-data";
import { provincias, tiposObra, estadoObraLabel } from "@/lib/mock-data";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useObraMZStore } from "@/store/obramz-store";
import { toast } from "sonner";

type Form = Omit<Obra, "id" | "criadoEm" | "eventos" | "progressoAtualizadoEm">;

function todayISO() { return new Date().toISOString().slice(0, 10); }
function inMonths(n: number) {
  const d = new Date(); d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
}

const emptyForm = (defaultClienteId?: string): Form => ({
  nome: "", clienteId: defaultClienteId ?? "", tipo: tiposObra[0],
  descricao: "", provincia: "Maputo", cidade: "", endereco: "",
  inicio: todayISO(), fimPrevisto: inMonths(3),
  progresso: 0, valorPrevisto: 0, estado: "planeada",
  responsavel: "", observacoes: "",
});

export function ProjectFormDialog({
  open, onOpenChange, obra, defaultClienteId, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  obra?: Obra | null;
  defaultClienteId?: string;
  onSaved?: (o: Obra) => void;
}) {
  const clientes = useObraMZStore((s) => s.clientes);
  const createObra = useObraMZStore((s) => s.createObra);
  const updateObra = useObraMZStore((s) => s.updateObra);
  const [form, setForm] = useState<Form>(emptyForm(defaultClienteId));
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});

  useEffect(() => {
    if (open) {
      if (obra) {
        const { id: _id, criadoEm: _c, eventos: _e, progressoAtualizadoEm: _p, ...rest } = obra;
        setForm(rest);
      } else {
        setForm(emptyForm(defaultClienteId));
      }
      setErrors({});
    }
  }, [open, obra, defaultClienteId]);

  const patch = (p: Partial<Form>) => setForm((f) => ({ ...f, ...p }));

  const submit = () => {
    const errs: Partial<Record<keyof Form, string>> = {};
    if (!form.nome.trim()) errs.nome = "Obrigatório";
    if (!form.clienteId) errs.clienteId = "Selecione um cliente";
    if (form.valorPrevisto < 0) errs.valorPrevisto = "Não pode ser negativo";
    if (form.progresso < 0 || form.progresso > 100) errs.progresso = "0 a 100";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    if (obra) {
      updateObra(obra.id, form);
      toast.success("Obra atualizada");
      onSaved?.({ ...obra, ...form });
    } else {
      const o = createObra(form);
      toast.success("Obra criada");
      onSaved?.(o);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{obra ? "Editar obra" : "Nova obra"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Nome da obra <span className="text-destructive">*</span></Label>
            <Input value={form.nome} onChange={(e) => patch({ nome: e.target.value })} placeholder="Ex.: Moradia T3 — Matola" />
            {errors.nome && <p className="text-xs text-destructive">{errors.nome}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Cliente <span className="text-destructive">*</span></Label>
            <Select value={form.clienteId} onValueChange={(v) => patch({ clienteId: v })}>
              <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
              <SelectContent>{clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
            </Select>
            {errors.clienteId && <p className="text-xs text-destructive">{errors.clienteId}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Tipo de obra</Label>
            <Select value={form.tipo} onValueChange={(v) => patch({ tipo: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{tiposObra.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Província</Label>
            <Select value={form.provincia} onValueChange={(v) => patch({ provincia: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{provincias.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Cidade / Distrito</Label>
            <Input value={form.cidade} onChange={(e) => patch({ cidade: e.target.value })} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Endereço</Label>
            <Input value={form.endereco} onChange={(e) => patch({ endereco: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Data de início</Label>
            <Input type="date" value={form.inicio} onChange={(e) => patch({ inicio: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Data prevista de conclusão</Label>
            <Input type="date" value={form.fimPrevisto} onChange={(e) => patch({ fimPrevisto: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Valor previsto (MZN)</Label>
            <Input type="number" min={0} value={form.valorPrevisto}
              onChange={(e) => patch({ valorPrevisto: Math.max(0, +e.target.value || 0) })} />
            {errors.valorPrevisto && <p className="text-xs text-destructive">{errors.valorPrevisto}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Estado</Label>
            <Select value={form.estado} onValueChange={(v) => patch({ estado: v as EstadoObra })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(estadoObraLabel) as EstadoObra[]).map((e) =>
                  <SelectItem key={e} value={e}>{estadoObraLabel[e]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Responsável</Label>
            <Input value={form.responsavel} onChange={(e) => patch({ responsavel: e.target.value })} placeholder="Ex.: Eng. Mário Sitoe" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Descrição</Label>
            <Textarea rows={2} value={form.descricao} onChange={(e) => patch({ descricao: e.target.value })} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Observações</Label>
            <Textarea rows={2} value={form.observacoes ?? ""} onChange={(e) => patch({ observacoes: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="bg-primary hover:bg-primary-dark" onClick={submit}>
            {obra ? "Guardar alterações" : "Guardar obra"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
