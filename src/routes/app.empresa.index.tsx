import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { empresa, provincias } from "@/lib/mock-data";
import { ImagePlus, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/empresa/")({ component: PerfilEmpresa });

function PerfilEmpresa() {
  return (
    <div>
      <PageHeader
        title="Perfil da Empresa"
        description="Dados usados nos seus orçamentos e recibos."
        actions={<Button className="bg-primary hover:bg-primary-dark" onClick={() => toast.success("Alterações guardadas")}><Save className="mr-1 h-4 w-4" />Guardar</Button>}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="mb-4 text-sm font-semibold">Identidade</div>
          <div className="flex items-center gap-4">
            <div className="grid h-24 w-24 place-items-center rounded-xl border-2 border-dashed border-border bg-muted text-muted-foreground">
              <ImagePlus className="h-7 w-7" />
            </div>
            <div>
              <Button variant="outline" size="sm">Carregar logótipo</Button>
              <div className="mt-1 text-xs text-muted-foreground">Aparece nos orçamentos e recibos.</div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Nome da empresa"><Input defaultValue={empresa.nome} /></Field>
            <Field label="NUIT"><Input defaultValue={empresa.nuit} /></Field>
            <Field label="Telefone"><Input defaultValue={empresa.telefone} /></Field>
            <Field label="Email"><Input defaultValue={empresa.email} /></Field>
            <Field label="Website"><Input defaultValue={empresa.website} /></Field>
            <Field label="Província">
              <Select defaultValue={empresa.provincia}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{provincias.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Cidade"><Input defaultValue={empresa.cidade} /></Field>
            <div className="sm:col-span-2"><Field label="Endereço"><Input defaultValue={empresa.endereco} /></Field></div>
            <div className="sm:col-span-2"><Field label="Descrição"><Textarea rows={3} defaultValue={empresa.descricao} /></Field></div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="mb-4 text-sm font-semibold">Dados de pagamento</div>
            <div className="space-y-4">
              <Field label="Banco / IBAN"><Input defaultValue={empresa.banco} /></Field>
              <Field label="M-Pesa"><Input defaultValue={empresa.mpesa} /></Field>
              <Field label="e-Mola"><Input defaultValue={empresa.emola} /></Field>
            </div>
          </Card>
          <Card className="p-6">
            <div className="mb-4 text-sm font-semibold">Padrões dos orçamentos</div>
            <div className="space-y-4">
              <Field label="Termos padrão"><Textarea rows={2} defaultValue="Orçamento válido por 30 dias." /></Field>
              <Field label="Condições padrão"><Textarea rows={2} defaultValue="30% de sinal, 40% durante a execução, 30% na entrega." /></Field>
              <Field label="Assinatura digital">
                <div className="grid h-20 place-items-center rounded-md border border-dashed border-border bg-muted/50 text-xs text-muted-foreground">
                  Carregar imagem da assinatura
                </div>
              </Field>
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
