import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/recuperar-password")({ component: Recuperar });

function Recuperar() {
  return (
    <AuthShell
      title="Recuperar password"
      subtitle="Enviaremos um link para o seu email."
      footer={<>Lembra-se da password? <Link to="/entrar" className="font-semibold text-primary">Entrar</Link></>}
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          toast.success("Se o email existir, receberá um link de recuperação.");
        }}
      >
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input required type="email" placeholder="voce@empresa.co.mz" />
        </div>
        <Button type="submit" className="w-full bg-primary hover:bg-primary-dark">Enviar link</Button>
      </form>
    </AuthShell>
  );
}
