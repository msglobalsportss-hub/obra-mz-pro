import { useState, useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  HardHat,
  Briefcase,
  CalendarCheck,
  Package,
  Boxes,
  ArrowLeftRight,
  Clock,
  TrendingDown,
  ShoppingCart,
  Truck,
  Building2,
  FileText,
  Wallet,
  TrendingUp,
  BarChart3,
  Bell,
  Settings,
  HelpCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useObraMZStore } from "@/store/obramz-store";
import { initials } from "@/lib/format";

interface SidebarSubItem {
  title: string;
  url?: string;
  icon: React.ElementType;
  exact?: boolean;
  disabled?: boolean;
}

interface SidebarSectionGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  items: SidebarSubItem[];
}

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const utilizador = useObraMZStore((s) => s.utilizador);

  // Verificação de grupo ativo para expansão automática (6 Grupos Congelados)
  const isPrincipalActive =
    pathname === "/app" ||
    pathname.startsWith("/app/clientes") ||
    pathname.startsWith("/app/obras");
  const isOperacoesActive =
    pathname.startsWith("/app/equipas") || pathname.startsWith("/app/presencas");
  const isInventarioActive =
    pathname.startsWith("/app/materiais") ||
    pathname.startsWith("/app/fornecedores") ||
    pathname.startsWith("/app/compras") ||
    pathname.startsWith("/app/inventory");
  const isAnaliseActive = pathname.startsWith("/app/relatorios");
  const isFinanceiroActive =
    pathname.startsWith("/app/orcamentos") || pathname.startsWith("/app/pagamentos");
  const isEmpresaActive =
    pathname.startsWith("/app/empresa") || pathname.startsWith("/app/configuracoes");

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    principal: isPrincipalActive,
    operacoes: isOperacoesActive,
    inventario: isInventarioActive,
    analise: isAnaliseActive,
    financeiro: isFinanceiroActive,
    empresa: isEmpresaActive,
  });

  // Atualizar auto-expansão ao mudar de rota
  useEffect(() => {
    setOpenGroups((prev) => ({
      ...prev,
      principal: prev.principal || isPrincipalActive,
      operacoes: prev.operacoes || isOperacoesActive,
      inventario: prev.inventario || isInventarioActive,
      analise: prev.analise || isAnaliseActive,
      financeiro: prev.financeiro || isFinanceiroActive,
      empresa: prev.empresa || isEmpresaActive,
    }));
  }, [
    pathname,
    isPrincipalActive,
    isOperacoesActive,
    isInventarioActive,
    isAnaliseActive,
    isFinanceiroActive,
    isEmpresaActive,
  ]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const isItemActive = (url?: string, exact?: boolean) => {
    if (!url) return false;
    return exact ? pathname === url : pathname === url || pathname.startsWith(url + "/");
  };

  // Estrutura da Sidebar — Arquitetura Oficial Congelada de 6 Grupos (Fase 3.6)
  const groupSections: SidebarSectionGroup[] = [
    {
      id: "principal",
      label: "PRINCIPAL",
      icon: LayoutDashboard,
      items: [
        { title: "Visão Geral", url: "/app", icon: LayoutDashboard, exact: true },
        { title: "Clientes", url: "/app/clientes", icon: Users },
        { title: "Obras", url: "/app/obras", icon: HardHat },
      ],
    },
    {
      id: "operacoes",
      label: "OPERAÇÕES",
      icon: Briefcase,
      items: [
        { title: "Equipas", url: "/app/equipas", icon: Briefcase },
        { title: "Presenças", url: "/app/presencas", icon: CalendarCheck },
      ],
    },
    {
      id: "inventario",
      label: "INVENTÁRIO",
      icon: Package,
      items: [
        { title: "Materiais", url: "/app/materiais", icon: Package },
        { title: "Fornecedores", url: "/app/fornecedores", icon: Building2 },
        { title: "Compras", url: "/app/compras", icon: ShoppingCart },
        { title: "Entregas", url: "/app/inventory/deliveries", icon: Truck },
      ],
    },
    {
      id: "analise",
      label: "ANÁLISE",
      icon: BarChart3,
      items: [
        { title: "Relatórios", url: "/app/relatorios", icon: BarChart3 },
        { title: "Documentos", url: "/app/documentos", icon: FileText, disabled: true },
        { title: "Alertas", url: "/app/alertas", icon: Bell, disabled: true },
        { title: "Atividades", url: "/app/atividades", icon: Clock, disabled: true },
      ],
    },
    {
      id: "financeiro",
      label: "FINANCEIRO",
      icon: Wallet,
      items: [
        { title: "Orçamentos", url: "/app/orcamentos", icon: FileText },
        { title: "Pagamentos", url: "/app/pagamentos", icon: Wallet, exact: true },
        { title: "Despesas", url: "/app/despesas", icon: TrendingDown, disabled: true },
        { title: "Fluxo de Caixa", url: "/app/pagamentos/caixa", icon: TrendingUp, disabled: true },
      ],
    },
    {
      id: "empresa",
      label: "EMPRESA",
      icon: Building2,
      items: [
        { title: "Perfil da Empresa", url: "/app/empresa", icon: Building2, exact: true },
        {
          title: "Utilizadores e Permissões",
          url: "/app/utilizadores",
          icon: Users,
          disabled: true,
        },
        { title: "Armazéns", url: "/app/empresa/armazens", icon: Boxes },
        { title: "Configurações", url: "/app/configuracoes", icon: Settings },
      ],
    },
  ];

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

      <SidebarContent className="px-2 py-3 space-y-2">
        {/* GRUPOS MODULARES OFICIAIS (6 GRUPOS CONGELADOS) */}
        {groupSections.map((group) => {
          const isOpen = !!openGroups[group.id];
          const hasActiveChild = group.items.some((i) => isItemActive(i.url, i.exact));

          return (
            <SidebarGroup key={group.id} className="py-0">
              <SidebarMenuItem className="list-none">
                <SidebarMenuButton
                  onClick={() => toggleGroup(group.id)}
                  tooltip={group.label}
                  className={`group/op data-[active=true]:bg-primary/10 ${
                    hasActiveChild ? "font-semibold text-primary" : "text-sidebar-foreground/80"
                  }`}
                >
                  <group.icon className="h-4 w-4" />
                  <span className="flex-1 text-left text-xs font-semibold uppercase tracking-wider">
                    {group.label}
                  </span>
                  {isOpen ? (
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 ml-auto opacity-70" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 ml-auto opacity-70" />
                  )}
                </SidebarMenuButton>

                {isOpen && (
                  <div className="pl-4 pr-1 py-1 space-y-1 border-l border-sidebar-border/60 ml-3.5 mt-1 group-data-[collapsible=icon]:hidden">
                    {group.items.map((subItem) => {
                      const active = isItemActive(subItem.url, subItem.exact);

                      if (subItem.disabled || !subItem.url) {
                        return (
                          <div
                            key={subItem.title}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-sidebar-foreground/40 opacity-60 cursor-not-allowed select-none"
                            title="Disponível em breve"
                          >
                            <subItem.icon className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{subItem.title}</span>
                            <span className="ml-auto text-[9px] font-normal px-1.5 py-0.2 rounded bg-sidebar-border/40 text-sidebar-foreground/40">
                              Em breve
                            </span>
                          </div>
                        );
                      }

                      return (
                        <SidebarMenuItem key={subItem.url} className="list-none">
                          <SidebarMenuButton
                            asChild
                            isActive={active}
                            tooltip={subItem.title}
                            className="h-8 text-xs data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:hover:bg-primary/90"
                          >
                            <Link to={subItem.url}>
                              <subItem.icon className="h-3.5 w-3.5 mr-2" />
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </div>
                )}
              </SidebarMenuItem>
            </SidebarGroup>
          );
        })}
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
              {initials(utilizador?.nome || "Utilizador")}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <div className="truncate text-sm font-semibold text-sidebar-foreground">
              {utilizador?.nome || "Utilizador"}
            </div>
            <div className="truncate text-[11px] text-sidebar-foreground/60">
              {utilizador?.cargo || "Gerente"}
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
