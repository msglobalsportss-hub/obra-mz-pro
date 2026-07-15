import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { provincias } from "@/lib/mock-data";
import { Building2, Settings2, CheckCircle2, ImagePlus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({ component: Onboarding });

const steps = [
  { n: 1, t: "Empresa", i: Building2 },
  { n: 2, t: "Preferências", i: Settings2 },
  { n: 3, t: "Conclusão", i: CheckCircle2 },
];

function Onboarding() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);

  return (
    <div className="min-h-screen bg-muted/40 py-10">
      <div className="mx-auto max-w-3xl px-4">
        <Link to="/" className="mb-6 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground font-black">O</div>
          <span className="font-bold">ObraMZ</span>
        </Link>
        <Card className="p-8">
          {/* Stepper */}
          <div className="mb-8 flex items-center justify-between gap-2">
            {steps.map((s, i) => (
              <div key={s.n} className="flex flex-1 items-center">
                <div className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 text-sm font-bold",
                  step >= s.n ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground",
                )}>
                  {step > s.n ? <CheckCircle2 className="h-5 w-5" /> : s.n}
                </div>
                <div className="ml-3 hidden min-w-0 sm:block">
                  <div className={cn("text-xs uppercase tracking-wider", step >= s.n ? "text-primary font-semibold" : "text-muted-foreground")}>
                    Etapa {s.n}
                  </div>
                  <div className="text-sm font-semibold">{s.t}</div>
                </div>
                {i < steps.length - 1 && (
                  <div className={cn("mx-3 hidden h-0.5 flex-1 sm:block", step > s.n ? "bg-primary" : "bg-border")} />
                )}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold">Dados da empresa</h2>
                <p className="text-sm text-muted-foreground">Estes dados aparecerão nos seus orçamentos.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="grid h-20 w-20 place-items-center rounded-xl border-2 border-dashed border-border bg-muted text-muted-foreground">
                  <ImagePlus className="h-6 w-6" />
                </div>
                <div>
                  <Button variant="outline" size="sm">Carregar logótipo</Button>
                  <div className="mt-1 text-xs text-muted-foreground">PNG, JPG ou SVG · máx 2MB</div>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nome da empresa"><Input defaultValue="Construções Horizonte, Lda." /></Field>
                <Field label="NUIT"><Input defaultValue="400123456" /></Field>
                <Field label="Telefone"><Input defaultValue="+258 84 123 4567" /></Field>
                <Field label="Email"><Input defaultValue="geral@horizonte.co.mz" /></Field>
                <Field label="Província">
                  <Select defaultValue="Maputo Cidade">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{provincias.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Cidade / Distrito"><Input defaultValue="Maputo" /></Field>
                <div className="sm:col-span-2">
                  <Field label="Endereço"><Input defaultValue="Av. 24 de Julho, nº 1234" /></Field>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold">Preferências</h2>
                <p className="text-sm text-muted-foreground">Padrões usados nos seus orçamentos e relatórios.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Moeda padrão">
                  <Select defaultValue="MZN">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="MZN">MZN — Metical</SelectItem></SelectContent>
                  </Select>
                </Field>
                <Field label="Idioma">
                  <Select defaultValue="pt">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="pt">Português</SelectItem></SelectContent>
                  </Select>
                </Field>
                <Field label="Formato de data">
                  <Select defaultValue="dmy">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="dmy">DD/MM/AAAA</SelectItem></SelectContent>
                  </Select>
                </Field>
                <Field label="Validade padrão do orçamento (dias)"><Input type="number" defaultValue={30} /></Field>
                <Field label="Imposto opcional (%)"><Input type="number" defaultValue={0} /></Field>
              </div>
              <Field label="Condições comerciais padrão">
                <Textarea defaultValue="30% de sinal, 40% durante a execução, 30% na entrega." rows={3} />
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success-soft text-success">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h2 className="mt-4 text-xl font-bold">Tudo pronto!</h2>
                <p className="mt-1 text-sm text-muted-foreground">A sua conta ObraMZ está configurada.</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/40 p-5">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resumo</div>
                <dl className="mt-3 grid gap-2 text-sm">
                  <Row k="Empresa" v="Construções Horizonte, Lda." />
                  <Row k="NUIT" v="400123456" />
                  <Row k="Moeda" v="MZN" />
                  <Row k="Idioma" v="Português" />
                  <Row k="Validade padrão" v="30 dias" />
                </dl>
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
            <Button variant="ghost" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>
              Voltar
            </Button>
            {step < 3 ? (
              <Button className="bg-primary hover:bg-primary-dark" onClick={() => setStep((s) => s + 1)}>
                Continuar
              </Button>
            ) : (
              <Button
                className="bg-primary hover:bg-primary-dark"
                onClick={() => { toast.success("Bem-vindo ao ObraMZ!"); nav({ to: "/app" }); }}
              >
                Entrar no painel
              </Button>
            )}
          </div>
        </Card>
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
function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}
