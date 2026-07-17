import { useEffect, useState } from "react";
import type { ObraFase, EstadoFase } from "@/lib/mock-data";
import { estadoFaseLabel } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useObraMZStore } from "@/store/obramz-store";
import { StatusBadge } from "@/components/page-header";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ListChecks, Pencil, Plus, RefreshCcw, Trash2 } from "lucide-react";

type Form = Omit<ObraFase, "id" | "ordem">;

const empty: Form = {
  nome: "",
  descricao: "",
  estado: "pendente",
  progresso: 0,
  inicio: "",
  fim: "",
};

const toneFor = (e: EstadoFase) =>
  e === "concluida" ? "success" : e === "em_andamento" ? "primary" : "muted";

export function PhasesEditor({ obraId, fases }: { obraId: string; fases: ObraFase[] }) {
  const addFase = useObraMZStore((s) => s.addObraFase);
  const updateFase = useObraMZStore((s) => s.updateObraFase);
  const deleteFase = useObraMZStore((s) => s.deleteObraFase);
  const reorder = useObraMZStore((s) => s.reorderObraFases);
  const aplicar = useObraMZStore((s) => s.aplicarProgressoFases);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ObraFase | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const sorted = [...fases].sort((a, b) => a.ordem - b.ordem);
  const media = sorted.length
    ? Math.round(sorted.reduce((s, f) => s + (f.progresso ?? 0), 0) / sorted.length)
    : 0;

  const openNew = () => { setEditing(null); setOpen(true); };
  const openEdit = (f: ObraFase) => { setEditing(f); setOpen(true); };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold">Fases da obra</div>
          <div className="text-xs text-muted-foreground">
            {sorted.length} fase{sorted.length === 1 ? "" : "s"} · progresso médio {media}%
          </div>
        </div>
        <div className="flex gap-2">
          {sorted.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => { aplicar(obraId); toast.success(`Progresso da obra atualizado para ${media}%`); }}>
              <RefreshCcw className="mr-1 h-3.5 w-3.5" />Aplicar à obra
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={openNew}>
            <Plus className="mr-1 h-3.5 w-3.5" />Nova fase
          </Button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-10 text-center">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-muted text-muted-foreground">
            <ListChecks className="h-5 w-5" />
          </div>
          <div className="text-sm font-medium">Sem fases definidas</div>
          <div className="text-xs text-muted-foreground">Divida a obra em etapas (fundação, alvenaria, cobertura…) para acompanhar o progresso.</div>
          <Button size="sm" variant="outline" className="mt-2" onClick={openNew}>
            <Plus className="mr-1 h-3.5 w-3.5" />Adicionar primeira fase
          </Button>
        </div>
      ) : (
        <ol className="space-y-2">
          {sorted.map((f, idx) => (
            <li key={f.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary-dark">
                  {idx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-medium">{f.nome}</div>
                    <StatusBadge tone={toneFor(f.estado)}>{estadoFaseLabel[f.estado]}</StatusBadge>
                    {(f.inicio || f.fim) && (
                      <span className="text-[11px] text-muted-foreground">
                        {f.inicio ? formatDate(f.inicio) : "—"} → {f.fim ? formatDate(f.fim) : "—"}
                      </span>
                    )}
                  </div>
                  {f.descricao && <div className="mt-1 text-xs text-muted-foreground">{f.descricao}</div>}
                  <div className="mt-2 flex items-center gap-3">
                    <Progress value={f.progresso} className="h-1.5 flex-1" />
                    <span className="w-10 text-right text-xs font-semibold text-primary">{f.progresso}%</span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                  <Button variant="ghost" size="icon" className="h-7 w-7" disabled={idx === 0} onClick={() => reorder(obraId, f.id, "cima")} aria-label="Subir">
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" disabled={idx === sorted.length - 1} onClick={() => reorder(obraId, f.id, "baixo")} aria-label="Descer">
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(f)} aria-label="Editar">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setConfirmDel(f.id)} aria-label="Eliminar">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      <FaseDialog
        open={open}
        onOpenChange={setOpen}
        fase={editing}
        onSave={(data) => {
          if (editing) {
            updateFase(obraId, editing.id, data);
            toast.success("Fase atualizada");
          } else {
            addFase(obraId, data);
            toast.success("Fase adicionada");
          }
        }}
      />
      <ConfirmDialog
        open={!!confirmDel}
        onOpenChange={(o) => !o && setConfirmDel(null)}
        title="Eliminar fase?"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Eliminar"
        tone="destructive"
        onConfirm={() => {
          if (confirmDel) {
            deleteFase(obraId, confirmDel);
            toast.success("Fase eliminada");
            setConfirmDel(null);
          }
        }}
      />
    </div>
  );
}

function FaseDialog({
  open, onOpenChange, fase, onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  fase: ObraFase | null;
  onSave: (data: Form) => void;
}) {
  const [form, setForm] = useState<Form>(empty);
  useEffect(() => {
    if (open) {
      if (fase) {
        const { id: _id, ordem: _o, ...rest } = fase;
        setForm(rest);
      } else setForm(empty);
    }
  }, [open, fase]);
  const patch = (p: Partial<Form>) => setForm((f) => ({ ...f, ...p }));

  const submit = () => {
    if (!form.nome.trim()) { toast.error("Nome obrigatório"); return; }
    const progresso = Math.max(0, Math.min(100, Math.round(form.progresso ?? 0)));
    const estado: EstadoFase = progresso === 100 ? "concluida" : progresso > 0 && form.estado === "pendente" ? "em_andamento" : form.estado;
    onSave({ ...form, progresso, estado });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{fase ? "Editar fase" : "Nova fase"}</DialogTitle></DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input value={form.nome} onChange={(e) => patch({ nome: e.target.value })} placeholder="Ex.: Fundação" />
          </div>
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea rows={2} value={form.descricao ?? ""} onChange={(e) => patch({ descricao: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Início previsto</Label>
              <Input type="date" value={form.inicio ?? ""} onChange={(e) => patch({ inicio: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Fim previsto</Label>
              <Input type="date" value={form.fim ?? ""} onChange={(e) => patch({ fim: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={form.estado} onValueChange={(v) => patch({ estado: v as EstadoFase, progresso: v === "concluida" ? 100 : form.progresso })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(estadoFaseLabel) as EstadoFase[]).map((e) =>
                    <SelectItem key={e} value={e}>{estadoFaseLabel[e]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Progresso (%)</Label>
              <Input type="number" min={0} max={100} value={form.progresso} onChange={(e) => patch({ progresso: parseInt(e.target.value || "0", 10) })} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="bg-primary hover:bg-primary-dark" onClick={submit}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
