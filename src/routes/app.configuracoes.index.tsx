import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useObraMZStore } from "@/store/obramz-store";
import type { Utilizador } from "@/lib/mock-data";
import { toast } from "sonner";
import { RotateCcw, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";

export const Route = createFileRoute("/app/configuracoes/")({ component: Configuracoes });

function Configuracoes() {
  const utilizador = useObraMZStore((s) => s.utilizador);
  const updateUtilizador = useObraMZStore((s) => s.updateUtilizador);
  const resetDemoData = useObraMZStore((s) => s.resetDemoData);
  const [form, setForm] = useState<Utilizador>(utilizador);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => { setForm(utilizador); }, [utilizador]);

  return (
    <div>
      <PageHeader title="Configurações" description="Preferências da conta e da aplicação." />

      <Tabs defaultValue="conta">
        <TabsList>
          <TabsTrigger value="conta">Dados pessoais</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
          <TabsTrigger value="preferencias">Preferências</TabsTrigger>
          <TabsTrigger value="dados">Dados</TabsTrigger>
        </TabsList>

        <TabsContent value="conta" className="mt-4">
          <Card className="p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome"><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></Field>
              <Field label="Cargo"><Input value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} /></Field>
              <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            </div>
            <div className="mt-6">
              <Button className="bg-primary hover:bg-primary-dark" onClick={() => { updateUtilizador(form); toast.success("Guardado"); }}>
                <Save className="mr-1 h-4 w-4" />Guardar
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="password" className="mt-4">
          <Card className="max-w-md p-6">
            <div className="space-y-4">
              <Field label="Password atual"><Input type="password" /></Field>
              <Field label="Nova password"><Input type="password" /></Field>
              <Field label="Confirmar nova password"><Input type="password" /></Field>
            </div>
            <div className="mt-6"><Button className="bg-primary hover:bg-primary-dark" onClick={() => toast.success("Password atualizada (demo)")}>Atualizar password</Button></div>
          </Card>
        </TabsContent>

        <TabsContent value="notificacoes" className="mt-4">
          <Card className="p-6 space-y-5">
            {[
              { t: "Novos pagamentos", d: "Receber notificação quando um pagamento for registado." },
              { t: "Orçamentos aceites", d: "Aviso quando um cliente aceitar um orçamento." },
              { t: "Prazos de obra", d: "Alertas para obras próximas do prazo de conclusão." },
              { t: "Orçamentos a expirar", d: "Aviso 3 dias antes da validade." },
            ].map((n) => (
              <div key={n.t} className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold">{n.t}</div>
                  <div className="text-xs text-muted-foreground">{n.d}</div>
                </div>
                <Switch defaultChecked />
              </div>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="preferencias" className="mt-4">
          <Card className="p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Moeda">
                <Select defaultValue="MZN"><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="MZN">MZN — Metical</SelectItem></SelectContent>
                </Select>
              </Field>
              <Field label="Formato de data">
                <Select defaultValue="dmy"><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="dmy">DD/MM/AAAA</SelectItem></SelectContent>
                </Select>
              </Field>
              <Field label="Validade padrão dos orçamentos (dias)"><Input type="number" defaultValue={30} /></Field>
              <Field label="Imposto padrão (%)"><Input type="number" defaultValue={0} /></Field>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="dados" className="mt-4">
          <Card className="border-warning/40 p-6">
            <div className="text-sm font-semibold">Repor dados de demonstração</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Repõe todos os clientes, obras, orçamentos e pagamentos ao estado inicial de demonstração.
              As suas alterações serão perdidas.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => setConfirmReset(true)}>
              <RotateCcw className="mr-1 h-4 w-4" />Repor demonstração
            </Button>
          </Card>

          <Card className="mt-4 border-destructive/40 p-6">
            <div className="text-sm font-semibold text-destructive">Eliminar conta</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Esta ação é irreversível (demo).
            </p>
            <Button variant="destructive" className="mt-4" onClick={() => toast.error("Eliminar conta (demo)")}>
              <Trash2 className="mr-1 h-4 w-4" />Eliminar conta permanentemente
            </Button>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Repor dados de demonstração?"
        description="Todas as alterações serão substituídas pelos dados iniciais."
        confirmLabel="Repor"
        onConfirm={() => { resetDemoData(); toast.success("Dados de demonstração repostos"); }}
      />
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
