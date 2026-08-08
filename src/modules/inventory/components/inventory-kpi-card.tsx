/**
 * Componente KPI: InventoryKpiCard
 * Categoria: components
 *
 * Cartão de indicador chave de desempenho do Inventário.
 * Suporta loading skeleton, tooltip explicativo e rota clicável de navegação.
 */

import React, { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { HelpCircle, ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface InventoryKpiCardProps {
  title: string;
  value: ReactNode;
  subtitle?: string;
  icon: React.ElementType;
  description?: string;
  href?: string;
  loading?: boolean;
  variant?: "default" | "amber" | "rose" | "emerald" | "blue" | "purple";
}

export function InventoryKpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  description,
  href,
  loading = false,
  variant = "default",
}: InventoryKpiCardProps) {
  const variantStyles = {
    default: "text-muted-foreground bg-muted/50",
    amber: "text-amber-600 bg-amber-500/10 border-amber-500/20",
    rose: "text-rose-600 bg-rose-500/10 border-rose-500/20",
    emerald: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
    blue: "text-blue-600 bg-blue-500/10 border-blue-500/20",
    purple: "text-purple-600 bg-purple-500/10 border-purple-500/20",
  };

  const cardContent = (
    <Card
      className={cn(
        "transition-all duration-200 hover:shadow-md border-border/60 relative overflow-hidden",
        href && "cursor-pointer hover:border-primary/40 group",
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase truncate">
              {title}
            </span>
            {description && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/60 hover:text-muted-foreground shrink-0 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    <p>{description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className={cn("p-2.5 rounded-xl shrink-0", variantStyles[variant])}>
            <Icon className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3">
          {loading ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <div className="text-2xl font-bold tracking-tight text-foreground">{value}</div>
          )}
          {subtitle && (
            <p className="mt-1 text-xs text-muted-foreground flex items-center justify-between">
              <span>{subtitle}</span>
              {href && (
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-transform" />
              )}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link to={href}>{cardContent}</Link>;
  }

  return cardContent;
}
