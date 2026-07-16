import { useEffect, useState } from "react";
import type { Cliente } from "@/lib/mock-data";
import { provincias } from "@/lib/mock-data";
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

type Form = Omit<Cliente, "id" | "criadoEm">;

const emptyForm: Form = {
  nome: "", tipo: "particular", telefone: "", telefone2: "", email: "",
  nuit: "", provincia: "Maputo", cidade: "", endereco: "", observacoes: "",
};

export function ClientFormDialog({
  open, onOpenChange, cliente, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  cliente?: Cliente | null;
  onSaved?: (c: Cliente) => void;
}) {
  const createCliente = useObraMZStore((s) => s.createCliente);
  const updateCliente = useObraMZStore((s) => s.updateCliente);
  const [form, setForm] = useState<Form>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});

  useEffect(() => {
    if (open) {
      setForm(cliente ? { ...emptyForm, ...cliente } : emptyForm);
      setErrors({});
    }
  }, [open, cliente]);

  const patch = (p: Partial<Form>) => setForm((f) => ({ ...f, ...p }));

  const submit = () => {
    const errs: Partial<Record<keyof Form, string>> = {};
    if (!form.nome.trim()) errs.nome = "Obrigatório";
    if (!form.telefone.trim()) errs.telefone = "Obrigatório";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) errs.email = "Email inválido";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    if (cliente) {
      updateCliente(cliente.id, form);
      toast.success("Cliente atualizado");
      onSaved?.({ ...cliente, ...form });
    } else {
      const c = createCliente(form);
      toast.success("Cliente criado");
      onSaved?.(c);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{cliente ? "Editar cliente" : "Novo cliente"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Nome / Empresa <span className="text-destructive">*</span></Label>
            <Input value={form.nome} onChange={(e) => patch({ nome: e.target.value })} placeholder="Ex.: João Mabote" />
            {errors.nome && <p className="text-xs text-destructive">{errors.nome}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={form.tipo} onValueChange={(v) => patch({ tipo: v as Cliente["tipo"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="particular">Particular</SelectItem>
                <SelectItem value="empresa">Empresa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>NUIT</Label>
            <Input value={form.nuit} onChange={(e) => patch({ nuit: e.target.value })} placeholder="100200300" />
          </div>
          <div className="space-y-1.5">
            <Label>Telefone principal <span className="text-destructive">*</span></Label>
            <Input value={form.telefone} onChange={(e) => patch({ telefone: e.target.value })} placeholder="+258 84 000 0000" />
            {errors.telefone && <p className="text-xs text-destructive">{errors.telefone}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Telefone alternativo</Label>
            <Input value={form.telefone2 ?? ""} onChange={(e) => patch({ telefone2: e.target.value })} placeholder="Opcional" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => patch({ email: e.target.value })} placeholder="cliente@email.mz" />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Província</Label>
            <Select value={form.provincia} onValueChange={(v) => patch({ provincia: v })}>
              <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
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
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Observações</Label>
            <Textarea rows={3} value={form.observacoes ?? ""} onChange={(e) => patch({ observacoes: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="bg-primary hover:bg-primary-dark" onClick={submit}>
            {cliente ? "Guardar alterações" : "Guardar cliente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
