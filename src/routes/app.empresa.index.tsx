import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { provincias, type Empresa } from "@/lib/mock-data";
import { ImagePlus, Save } from "lucide-react";
import { toast } from "sonner";
import { useObraMZStore } from "@/store/obramz-store";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/app/empresa/")({ component: PerfilEmpresa });

function PerfilEmpresa() {
  const empresa = useObraMZStore((s) => s.empresa);
  const updateEmpresa = useObraMZStore((s) => s.updateEmpresa);
  const [form, setForm] = useState<Empresa>(empresa);

  useEffect(() => { setForm(empresa); }, [empresa]);

  const patch = (p: Partial<Empresa>) => setForm((f) => ({ ...f, ...p }));

  const save = () => {
    if (!form.nome.trim()) { toast.error("O nome da empresa é obrigatório"); return; }
    updateEmpresa(form);
    toast.success("Perfil atualizado");
  };

  return (
    <div>
      <PageHeader
        title="Perfil da Empresa"
        description="Dados usados nos seus orçamentos e recibos."
        actions={<Button className="bg-primary hover:bg-primary-dark" onClick={save}><Save className="mr-1 h-4 w-4" />Guardar</Button>}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="mb-4 text-sm font-semibold">Identidade</div>
          <div className="flex items-center gap-4">
            <div className="grid h-24 w-24 place-items-center rounded-xl border-2 border-dashed border-border bg-muted text-muted-foreground">
              <ImagePlus className="h-7 w-7" />
            </div>
            <div>
              <Button variant="outline" size="sm" onClick={() => toast("Upload de logótipo em breve")}>Carregar logótipo</Button>
              <div className="mt-1 text-xs text-muted-foreground">Aparece nos orçamentos e recibos.</div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Nome da empresa"><Input value={form.nome} onChange={(e) => patch({ nome: e.target.value })} /></Field>
            <Field label="NUIT"><Input value={form.nuit} onChange={(e) => patch({ nuit: e.target.value })} /></Field>
            <Field label="Telefone"><Input value={form.telefone} onChange={(e) => patch({ telefone: e.target.value })} /></Field>
            <Field label="Email"><Input type="email" value={form.email} onChange={(e) => patch({ email: e.target.value })} /></Field>
            <Field label="Website"><Input value={form.website} onChange={(e) => patch({ website: e.target.value })} /></Field>
            <Field label="Província">
              <Select value={form.provincia} onValueChange={(v) => patch({ provincia: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{provincias.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Cidade"><Input value={form.cidade} onChange={(e) => patch({ cidade: e.target.value })} /></Field>
            <div className="sm:col-span-2"><Field label="Endereço"><Input value={form.endereco} onChange={(e) => patch({ endereco: e.target.value })} /></Field></div>
            <div className="sm:col-span-2"><Field label="Descrição"><Textarea rows={3} value={form.descricao} onChange={(e) => patch({ descricao: e.target.value })} /></Field></div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="mb-4 text-sm font-semibold">Dados de pagamento</div>
            <div className="space-y-4">
              <Field label="Banco / IBAN"><Input value={form.banco} onChange={(e) => patch({ banco: e.target.value })} /></Field>
              <Field label="M-Pesa"><Input value={form.mpesa} onChange={(e) => patch({ mpesa: e.target.value })} /></Field>
              <Field label="e-Mola"><Input value={form.emola} onChange={(e) => patch({ emola: e.target.value })} /></Field>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
