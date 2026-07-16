import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, HardHat, FileText, Wallet, BarChart3,
  Building2, Settings, LogOut, HelpCircle,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useObraMZStore } from "@/store/obramz-store";
import { initials } from "@/lib/format";

const items = [
  { title: "Visão Geral", url: "/app", icon: LayoutDashboard, exact: true },
  { title: "Clientes", url: "/app/clientes", icon: Users },
  { title: "Obras", url: "/app/obras", icon: HardHat },
  { title: "Orçamentos", url: "/app/orcamentos", icon: FileText },
  { title: "Pagamentos", url: "/app/pagamentos", icon: Wallet },
  { title: "Relatórios", url: "/app/relatorios", icon: BarChart3 },
];

const secondary = [
  { title: "Perfil da Empresa", url: "/app/empresa", icon: Building2 },
  { title: "Configurações", url: "/app/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const empresa = useObraMZStore((s) => s.empresa);
  const utilizador = useObraMZStore((s) => s.utilizador);
  const isActive = (url: string, exact?: boolean) =>
    exact ? pathname === url : pathname === url || pathname.startsWith(url + "/");

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border/60 p-4">
        <Link to="/app" className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground font-black">
            O
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <div className="text-sm font-bold tracking-tight text-sidebar-foreground">ObraMZ</div>
            <div className="text-[11px] uppercase tracking-wider text-sidebar-foreground/60">
              Gestão de obras
            </div>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url, item.exact)}
                    tooltip={item.title}
                    className="data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:hover:bg-primary/90"
                  >
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">Empresa</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondary.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                    className="data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:hover:bg-primary/90"
                  >
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/60 p-3">
        <div className="mb-2 rounded-lg bg-sidebar-accent/60 p-3 group-data-[collapsible=icon]:hidden">
          <div className="flex items-start gap-2">
            <HelpCircle className="mt-0.5 h-4 w-4 text-primary" />
            <div className="min-w-0">
              <div className="text-xs font-semibold text-sidebar-foreground">Precisa de ajuda?</div>
              <div className="text-[11px] text-sidebar-foreground/60">
                Consulte o guia rápido do ObraMZ.
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
              {initials(utilizador.nome)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <div className="truncate text-sm font-semibold text-sidebar-foreground">
              {utilizador.nome}
            </div>
            <div className="truncate text-[11px] text-sidebar-foreground/60">{empresa.nome}</div>
          </div>
          <Link
            to="/entrar"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground group-data-[collapsible=icon]:hidden"
            title="Terminar sessão"
          >
            <LogOut className="h-4 w-4" />
          </Link>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
