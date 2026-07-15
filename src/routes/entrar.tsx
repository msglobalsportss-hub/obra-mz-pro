import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/entrar")({ component: Entrar });

function Entrar() {
  const nav = useNavigate();
  const [email, setEmail] = useState("antonio@horizonte.co.mz");
  const [pw, setPw] = useState("demo1234");
  return (
    <AuthShell
      title="Entrar na sua conta"
      subtitle="Aceda ao painel do ObraMZ."
      footer={<>Ainda não tem conta? <Link to="/criar-conta" className="font-semibold text-primary">Criar conta</Link></>}
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          toast.success("Sessão iniciada");
          nav({ to: "/app" });
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="pw">Password</Label>
            <Link to="/recuperar-password" className="text-xs font-semibold text-primary">Esqueci-me</Link>
          </div>
          <Input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} required />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="lembrar" defaultChecked />
          <Label htmlFor="lembrar" className="text-sm font-normal">Manter sessão iniciada</Label>
        </div>
        <Button type="submit" className="w-full bg-primary hover:bg-primary-dark">Entrar</Button>
        <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
          Modo de demonstração — qualquer email e password entram no painel.
        </div>
      </form>
    </AuthShell>
  );
}
