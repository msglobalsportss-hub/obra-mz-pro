import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/criar-conta")({ component: CriarConta });

function scorePw(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

function CriarConta() {
  const nav = useNavigate();
  const [pw, setPw] = useState("");
  const score = useMemo(() => scorePw(pw), [pw]);
  const labels = ["Muito fraca", "Fraca", "Média", "Forte", "Muito forte"];
  const colors = ["bg-destructive", "bg-destructive", "bg-warning", "bg-success", "bg-success"];

  return (
    <AuthShell
      title="Criar conta"
      subtitle="Comece a organizar as suas obras em poucos minutos."
      footer={<>Já tem conta? <Link to="/entrar" className="font-semibold text-primary">Entrar</Link></>}
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          toast.success("Conta criada. Bem-vindo ao ObraMZ!");
          nav({ to: "/onboarding" });
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Nome completo</Label>
            <Input required placeholder="Ex.: António Machava" />
          </div>
          <div className="space-y-1.5">
            <Label>Nome da empresa</Label>
            <Input required placeholder="Ex.: Construções Horizonte" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Telefone</Label>
            <Input required placeholder="+258 84 000 0000" />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input required type="email" placeholder="voce@empresa.co.mz" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Password</Label>
          <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} required />
          <div className="mt-2 flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={cn("h-1.5 flex-1 rounded-full", i < score ? colors[score - 1] : "bg-muted")} />
            ))}
          </div>
          {pw && <div className="text-xs text-muted-foreground">Força: <span className="font-medium">{labels[Math.max(0, score - 1)]}</span></div>}
        </div>
        <div className="space-y-1.5">
          <Label>Confirmar password</Label>
          <Input type="password" required />
        </div>
        <div className="flex items-start gap-2">
          <Checkbox id="terms" required className="mt-0.5" />
          <Label htmlFor="terms" className="text-sm font-normal leading-relaxed">
            Aceito os <a className="font-semibold text-primary" href="#">termos</a> e a{" "}
            <a className="font-semibold text-primary" href="#">política de privacidade</a>.
          </Label>
        </div>
        <Button type="submit" className="w-full bg-primary hover:bg-primary-dark">Criar conta</Button>
      </form>
    </AuthShell>
  );
}
