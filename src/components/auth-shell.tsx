import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { HardHat } from "lucide-react";

export function AuthShell({
  title, subtitle, children, footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-screen bg-muted/30 lg:grid-cols-2">
      <div className="hidden bg-gradient-to-br from-primary to-primary-dark p-12 text-primary-foreground lg:flex lg:flex-col">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/15 backdrop-blur font-black">O</div>
          <span className="text-lg font-bold">ObraMZ</span>
        </Link>
        <div className="mt-auto max-w-md">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 backdrop-blur">
            <HardHat className="h-7 w-7" />
          </div>
          <h2 className="mt-6 text-3xl font-bold leading-tight">
            Organize os seus orçamentos e obras num só lugar.
          </h2>
          <p className="mt-4 text-primary-foreground/80">
            Feito para empreiteiros em Moçambique — simples, rápido, profissional.
          </p>
        </div>
      </div>
      <div className="flex min-h-screen items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground font-black">O</div>
            <span className="text-lg font-bold">ObraMZ</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
