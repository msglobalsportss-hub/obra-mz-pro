import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { utilizador } from "@/lib/mock-data";
import { toast } from "sonner";
import { Trash2, Save, Smartphone, Laptop } from "lucide-react";

export const Route = createFileRoute("/app/configuracoes/")({ component: Configuracoes });

function Configuracoes() {
  return (
    <div>
      <PageHeader title="Configurações" description="Preferências da conta e da aplicação." />

      <Tabs defaultValue="conta">
        <TabsList>
          <TabsTrigger value="conta">Dados pessoais</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
          <TabsTrigger value="preferencias">Preferências</TabsTrigger>
          <TabsTrigger value="sessoes">Sessões</TabsTrigger>
          <TabsTrigger value="conta-eliminar">Conta</TabsTrigger>
        </TabsList>

        <TabsContent value="conta" className="mt-4">
          <Card className="p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome"><Input defaultValue={utilizador.nome} /></Field>
              <Field label="Cargo"><Input defaultValue={utilizador.cargo} /></Field>
              <Field label="Email"><Input type="email" defaultValue={utilizador.email} /></Field>
              <Field label="Telefone"><Input defaultValue="+258 84 123 4567" /></Field>
            </div>
            <div className="mt-6"><Button className="bg-primary hover:bg-primary-dark" onClick={() => toast.success("Guardado")}><Save className="mr-1 h-4 w-4" />Guardar</Button></div>
          </Card>
        </TabsContent>

        <TabsContent value="password" className="mt-4">
          <Card className="max-w-md p-6">
            <div className="space-y-4">
              <Field label="Password atual"><Input type="password" /></Field>
              <Field label="Nova password"><Input type="password" /></Field>
              <Field label="Confirmar nova password"><Input type="password" /></Field>
            </div>
            <div className="mt-6"><Button className="bg-primary hover:bg-primary-dark" onClick={() => toast.success("Password atualizada")}>Atualizar password</Button></div>
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
              <Field label="Tema visual">
                <Select defaultValue="claro"><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="claro">Claro</SelectItem>
                    <SelectItem value="escuro">Escuro</SelectItem>
                    <SelectItem value="sistema">Automático</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="sessoes" className="mt-4">
          <Card className="p-6">
            <div className="space-y-4">
              {[
                { icon: Laptop, t: "MacBook Pro", d: "Maputo · Chrome · Sessão atual", ativa: true },
                { icon: Smartphone, t: "iPhone 14", d: "Maputo · Safari · há 2 dias", ativa: false },
              ].map((s) => (
                <div key={s.t} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-muted"><s.icon className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{s.t}{s.ativa && <span className="ml-2 rounded bg-success-soft px-1.5 py-0.5 text-[10px] font-semibold text-success">Ativa</span>}</div>
                    <div className="text-xs text-muted-foreground">{s.d}</div>
                  </div>
                  {!s.ativa && <Button variant="outline" size="sm" onClick={() => toast.success("Sessão terminada")}>Terminar</Button>}
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="conta-eliminar" className="mt-4">
          <Card className="border-destructive/40 p-6">
            <div className="text-sm font-semibold text-destructive">Eliminar conta</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Esta ação é irreversível. Todos os dados da sua conta serão apagados.
            </p>
            <Button variant="destructive" className="mt-4" onClick={() => toast.error("Eliminar conta (demo)")}>
              <Trash2 className="mr-1 h-4 w-4" />Eliminar conta permanentemente
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
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
