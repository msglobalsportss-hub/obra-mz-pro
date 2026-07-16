import { useEffect, useState } from "react";
import type { ObraEvento, TimelineEventoTipo } from "@/lib/mock-data";
import { tipoEventoLabel } from "@/lib/mock-data";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useObraMZStore } from "@/store/obramz-store";
import { formatDate } from "@/lib/format";
import { Pencil, Trash2, Plus, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/confirm-dialog";

type Form = Omit<ObraEvento, "id">;

const empty: Form = {
  data: new Date().toISOString().slice(0, 10),
  titulo: "", descricao: "", tipo: "nota", visibilidade: "publica",
};

export function TimelineEditor({ obraId, eventos }: { obraId: string; eventos: ObraEvento[] }) {
  const addEvento = useObraMZStore((s) => s.addObraEvento);
  const updateEvento = useObraMZStore((s) => s.updateObraEvento);
  const deleteEvento = useObraMZStore((s) => s.deleteObraEvento);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ObraEvento | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const sorted = [...eventos].sort((a, b) => b.data.localeCompare(a.data));

  const openNew = () => { setEditing(null); setOpen(true); };
  const openEdit = (e: ObraEvento) => { setEditing(e); setOpen(true); };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold">Linha temporal</div>
        <Button size="sm" variant="outline" onClick={openNew}><Plus className="mr-1 h-3.5 w-3.5" />Novo evento</Button>
      </div>
      {sorted.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Ainda sem acontecimentos. Adicione o primeiro para documentar o progresso.
        </div>
      ) : (
        <ol className="space-y-3">
          {sorted.map((e) => (
            <li key={e.id} className="flex gap-3 rounded-lg border border-border p-3">
              <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-sm font-medium">{e.titulo}</div>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {tipoEventoLabel[e.tipo]}
                  </span>
                  {e.visibilidade === "privada" && (
                    <span className="inline-flex items-center gap-0.5 rounded bg-warning-soft px-1.5 py-0.5 text-[10px] font-medium text-warning-foreground">
                      <EyeOff className="h-3 w-3" />Privado
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">{formatDate(e.data)}</div>
                {e.descricao && <div className="mt-1 text-xs text-muted-foreground">{e.descricao}</div>}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(e)} aria-label="Editar">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setConfirmDel(e.id)} aria-label="Eliminar">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <EventoDialog
        open={open} onOpenChange={setOpen} evento={editing}
        onSave={(data) => {
          if (editing) {
            updateEvento(obraId, { ...editing, ...data });
            toast.success("Evento atualizado");
          } else {
            addEvento(obraId, data);
            toast.success("Evento adicionado");
          }
        }}
      />
      <ConfirmDialog
        open={!!confirmDel}
        onOpenChange={(o) => !o && setConfirmDel(null)}
        title="Eliminar evento?"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Eliminar"
        tone="destructive"
        onConfirm={() => {
          if (confirmDel) {
            deleteEvento(obraId, confirmDel);
            toast.success("Evento eliminado");
            setConfirmDel(null);
          }
        }}
      />
    </div>
  );
}

function EventoDialog({
  open, onOpenChange, evento, onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  evento: ObraEvento | null;
  onSave: (data: Form) => void;
}) {
  const [form, setForm] = useState<Form>(empty);
  useEffect(() => {
    if (open) {
      if (evento) {
        const { id: _id, ...rest } = evento;
        setForm(rest);
      } else setForm(empty);
    }
  }, [open, evento]);
  const patch = (p: Partial<Form>) => setForm((f) => ({ ...f, ...p }));

  const submit = () => {
    if (!form.titulo.trim()) { toast.error("Título obrigatório"); return; }
    if (!form.data) { toast.error("Data obrigatória"); return; }
    onSave(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{evento ? "Editar evento" : "Novo evento"}</DialogTitle></DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Data</Label>
              <Input type="date" value={form.data} onChange={(e) => patch({ data: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => patch({ tipo: v as TimelineEventoTipo })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(tipoEventoLabel) as TimelineEventoTipo[]).map((t) =>
                    <SelectItem key={t} value={t}>{tipoEventoLabel[t]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Título</Label>
            <Input value={form.titulo} onChange={(e) => patch({ titulo: e.target.value })} placeholder="Ex.: Fundação concluída" />
          </div>
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea rows={3} value={form.descricao ?? ""} onChange={(e) => patch({ descricao: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Visibilidade</Label>
            <Select value={form.visibilidade} onValueChange={(v) => patch({ visibilidade: v as "publica" | "privada" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="publica"><span className="inline-flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" />Público</span></SelectItem>
                <SelectItem value="privada"><span className="inline-flex items-center gap-1.5"><EyeOff className="h-3.5 w-3.5" />Privado</span></SelectItem>
              </SelectContent>
            </Select>
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
