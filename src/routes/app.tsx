import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useObraMZStore } from "@/store/obramz-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { initials } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const utilizador = useObraMZStore((s) => s.utilizador);
  const hydrated = useHydrated();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/40">
        <AppSidebar />
        <SidebarInset className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-3 backdrop-blur sm:px-6">
            <SidebarTrigger className="-ml-1" />
            <div className="hidden flex-1 md:block">
              <div className="relative max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Pesquisar clientes, obras, orçamentos..." className="h-9 pl-9" />
              </div>
            </div>
            <div className="flex flex-1 items-center justify-end gap-2 md:flex-none">
              <button className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Notificações">
                <Bell className="h-4 w-4" />
              </button>
              <div className="hidden text-right sm:block">
                <div className="text-xs font-semibold leading-tight text-foreground">{utilizador?.nome || "Utilizador"}</div>
                <div className="text-[11px] leading-tight text-muted-foreground">{utilizador?.cargo || "Gestor"}</div>
              </div>
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                  {initials(utilizador?.nome || "Utilizador")}
                </AvatarFallback>
              </Avatar>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            {hydrated ? <Outlet /> : <LoadingShell />}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function LoadingShell() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}
