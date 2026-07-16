import { useEffect, useMemo, useRef, useState } from "react";
import type { Pagamento, MetodoPagamento, EstadoPagamento, PagamentoComprovativo } from "@/lib/mock-data";
import { metodoPagamentoLabel, estadoPagamentoLabel, totalOrcamento } from "@/lib/mock-data";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useObraMZStore, totalsPorObra } from "@/store/obramz-store";
import { toast } from "sonner";
import { Paperclip, Eye, Trash2, RefreshCw, AlertTriangle } from "lucide-react";
import { formatMZN } from "@/lib/format";
import { ConfirmDialog } from "@/components/common/confirm-dialog";

type Form = Omit<Pagamento, "id" | "criadoEm">;

const empty = (defaults?: Partial<Form>): Form => ({
  clienteId: "", obraId: undefined, orcamentoId: undefined,
  valor: 0, data: new Date().toISOString().slice(0, 10),
  metodo: "mpesa", referencia: "", estado: "confirmado", observacoes: "",
  comprovativo: undefined,
  ...defaults,
});

export function PaymentFormDialog({
  open, onOpenChange, pagamento, defaults, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  pagamento?: Pagamento | null;
  defaults?: Partial<Form>;
  onSaved?: (p: Pagamento) => void;
}) {
  const clientes = useObraMZStore((s) => s.clientes);
  const obras = useObraMZStore((s) => s.obras);
  const orcamentos = useObraMZStore((s) => s.orcamentos);
  const createPagamento = useObraMZStore((s) => s.createPagamento);
  const updatePagamento = useObraMZStore((s) => s.updatePagamento);

  const [form, setForm] = useState<Form>(empty(defaults));
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [warnExcesso, setWarnExcesso] = useState(false);
  const [pendingSave, setPendingSave] = useState<Form | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (pagamento) {
        const { id: _id, criadoEm: _c, ...rest } = pagamento;
        setForm(rest);
      } else setForm(empty(defaults));
      setErrors({});
    }
  }, [open, pagamento, defaults]);

  const patch = (p: Partial<Form>) => setForm((f) => ({ ...f, ...p }));

  const obrasCliente = useMemo(
    () => (form.clienteId ? obras.filter((o) => o.clienteId === form.clienteId) : obras),
    [form.clienteId, obras],
  );
  const orcamentosCliente = useMemo(
    () => (form.clienteId ? orcamentos.filter((o) => o.clienteId === form.clienteId) : orcamentos),
    [form.clienteId, orcamentos],
  );

  const saldoPendente = useMemo(() => {
    if (form.orcamentoId) {
      const orc = orcamentos.find((o) => o.id === form.orcamentoId);
      if (!orc) return null;
      const total = totalOrcamento(orc).total;
      const recebidoOrc = useObraMZStore
        .getState()
        .pagamentos
        .filter((p) => p.orcamentoId === orc.id && p.estado === "confirmado" && (!pagamento || p.id !== pagamento.id))
        .reduce((s, p) => s + p.valor, 0);
      return Math.max(0, total - recebidoOrc);
    }
    if (form.obraId) {
      const t = totalsPorObra(form.obraId);
      const jaRegistado = pagamento && pagamento.obraId === form.obraId ? pagamento.valor : 0;
      return Math.max(0, t.pendente + jaRegistado);
    }
    return null;
  }, [form.obraId, form.orcamentoId, orcamentos, pagamento]);

  const doSave = (data: Form) => {
    if (pagamento) {
      updatePagamento(pagamento.id, data);
      toast.success("Pagamento atualizado");
      onSaved?.({ ...pagamento, ...data });
    } else {
      const p = createPagamento(data);
      toast.success("Pagamento registado");
      onSaved?.(p);
    }
    onOpenChange(false);
  };

  const submit = () => {
    const errs: Partial<Record<keyof Form, string>> = {};
    if (!form.clienteId) errs.clienteId = "Selecione um cliente";
    if (!form.data) errs.data = "Data obrigatória";
    if (!form.metodo) errs.metodo = "Selecione um método";
    if (!(form.valor > 0)) errs.valor = "Valor deve ser maior que zero";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    if (saldoPendente !== null && form.valor > saldoPendente && form.estado === "confirmado") {
      setPendingSave(form);
      setWarnExcesso(true);
      return;
    }
    doSave(form);
  };

  const onFile = async (file: File | null) => {
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { toast.error("Ficheiro grande demais (máx. 3 MB)"); return; }
    const dataUrl = await new Promise<string>((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.readAsDataURL(file);
    });
    const comp: PagamentoComprovativo = {
      nome: file.name, tipo: file.type || "file",
      dataUrl, enviadoEm: new Date().toISOString(),
    };
    patch({ comprovativo: comp });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{pagamento ? "Editar pagamento" : "Registar pagamento"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label>Cliente <span className="text-destructive">*</span></Label>
              <Select value={form.clienteId} onValueChange={(v) => patch({ clienteId: v, obraId: undefined, orcamentoId: undefined })}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>{clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
              {errors.clienteId && <p className="text-xs text-destructive">{errors.clienteId}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Obra</Label>
                <Select
                  value={form.obraId ?? "none"}
                  onValueChange={(v) => patch({ obraId: v === "none" ? undefined : v })}
                >
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem obra</SelectItem>
                    {obrasCliente.map((o) => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Orçamento</Label>
                <Select
                  value={form.orcamentoId ?? "none"}
                  onValueChange={(v) => patch({ orcamentoId: v === "none" ? undefined : v })}
                >
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem orçamento</SelectItem>
                    {orcamentosCliente.map((o) => <SelectItem key={o.id} value={o.id}>{o.numero}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Valor (MZN) <span className="text-destructive">*</span></Label>
                <Input type="number" min={0} step="0.01" value={form.valor}
                  onChange={(e) => patch({ valor: Math.max(0, +e.target.value || 0) })} />
                {errors.valor && <p className="text-xs text-destructive">{errors.valor}</p>}
                {saldoPendente !== null && (
                  <p className="text-xs text-muted-foreground">Saldo pendente: {formatMZN(saldoPendente)}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Data <span className="text-destructive">*</span></Label>
                <Input type="date" value={form.data} onChange={(e) => patch({ data: e.target.value })} />
                {errors.data && <p className="text-xs text-destructive">{errors.data}</p>}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Método <span className="text-destructive">*</span></Label>
                <Select value={form.metodo} onValueChange={(v) => patch({ metodo: v as MetodoPagamento })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(metodoPagamentoLabel) as MetodoPagamento[]).map((m) =>
                      <SelectItem key={m} value={m}>{metodoPagamentoLabel[m]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Select value={form.estado} onValueChange={(v) => patch({ estado: v as EstadoPagamento })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(estadoPagamentoLabel) as EstadoPagamento[]).map((e) =>
                      <SelectItem key={e} value={e}>{estadoPagamentoLabel[e]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Referência</Label>
              <Input value={form.referencia} onChange={(e) => patch({ referencia: e.target.value })} placeholder="Nº transação" />
            </div>
            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea rows={2} value={form.observacoes ?? ""} onChange={(e) => patch({ observacoes: e.target.value })} />
            </div>

            <div className="space-y-1.5">
              <Label>Comprovativo</Label>
              <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden"
                onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
              {form.comprovativo ? (
                <div className="flex items-center gap-2 rounded-lg border border-border p-2">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  <div className="min-w-0 flex-1 text-xs">
                    <div className="truncate font-medium">{form.comprovativo.nome}</div>
                    <div className="text-muted-foreground">{form.comprovativo.tipo}</div>
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => window.open(form.comprovativo!.dataUrl, "_blank")}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => fileRef.current?.click()}>
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => patch({ comprovativo: undefined })}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  <Paperclip className="mr-1 h-4 w-4" />Adicionar comprovativo
                </Button>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button className="bg-primary hover:bg-primary-dark" onClick={submit}>
              {pagamento ? "Guardar alterações" : "Registar pagamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={warnExcesso}
        onOpenChange={(o) => { if (!o) { setWarnExcesso(false); setPendingSave(null); } }}
        title={<span className="inline-flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" />Valor superior ao saldo pendente</span>}
        description={<>O valor registado é superior ao saldo pendente ({saldoPendente !== null ? formatMZN(saldoPendente) : "—"}). Confirma que pretende continuar?</>}
        confirmLabel="Continuar mesmo assim"
        onConfirm={() => {
          if (pendingSave) doSave(pendingSave);
          setWarnExcesso(false);
          setPendingSave(null);
        }}
      />
    </>
  );
}
