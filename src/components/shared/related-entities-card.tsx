import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Link2,
  FileText,
  Building2,
  Truck,
  Package,
  HardHat,
  BarChart2,
  ExternalLink,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

export interface RelatedEntityItem {
  type: "purchase_order" | "supplier" | "project" | "warehouse" | "material" | "delivery" | "movement";
  title: string;
  subtitle?: string;
  statusBadge?: { label: string; color?: string };
  metricsBadge?: string;
  lastActivityText?: string;
  statsSubtext?: string;
  linkTo: string;
  linkParams?: Record<string, string>;
}

interface RelatedEntitiesCardProps {
  title?: string;
  entities: RelatedEntityItem[];
  limit?: number;
  onViewAll?: () => void;
}

const ICON_MAP = {
  purchase_order: FileText,
  supplier: Building2,
  project: HardHat,
  warehouse: Building2,
  material: Package,
  delivery: Truck,
  movement: BarChart2,
};

const COLOR_MAP = {
  purchase_order: "text-blue-600 dark:text-blue-400 bg-blue-500/10",
  supplier: "text-purple-600 dark:text-purple-400 bg-purple-500/10",
  project: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
  warehouse: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10",
  material: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
  delivery: "text-sky-600 dark:text-sky-400 bg-sky-500/10",
  movement: "text-rose-600 dark:text-rose-400 bg-rose-500/10",
};

export function RelatedEntitiesCard({
  title = "Relacionados",
  entities,
  limit = 5,
  onViewAll,
}: RelatedEntitiesCardProps) {
  if (!entities || entities.length === 0) return null;

  const displayEntities = entities.slice(0, limit);
  const hasMore = entities.length > limit;

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="py-3 px-4 bg-muted/20 border-b border-border/60">
        <CardTitle className="text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-primary" />
            <span>{title} ({entities.length})</span>
          </div>
          {hasMore && onViewAll && (
            <Button size="xs" variant="ghost" onClick={onViewAll} className="h-6 text-[10px] text-primary">
              Ver tudo ({entities.length})
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-2">
        {displayEntities.map((item, idx) => {
          const IconComp = ICON_MAP[item.type] || Link2;
          const colorClass = COLOR_MAP[item.type] || "text-primary bg-primary/10";

          return (
            <div
              key={`${item.type}-${idx}`}
              className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-border/50 bg-background hover:bg-muted/30 transition-colors group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`p-1.5 rounded-md ${colorClass} shrink-0`}>
                  <IconComp className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-foreground truncate">{item.title}</span>
                    {item.statusBadge && (
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-1.5 py-0 ${item.statusBadge.color || ""}`}
                      >
                        {item.statusBadge.label}
                      </Badge>
                    )}
                    {item.metricsBadge && (
                      <Badge
                        variant="secondary"
                        className="text-[9px] px-1.5 py-0 font-mono bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      >
                        {item.metricsBadge}
                      </Badge>
                    )}
                  </div>
                  {(item.subtitle || item.lastActivityText || item.statsSubtext) && (
                    <div className="text-[10px] text-muted-foreground flex flex-wrap items-center gap-2">
                      {item.subtitle && <span className="truncate">{item.subtitle}</span>}
                      {item.lastActivityText && (
                        <span className="text-foreground font-medium truncate">• {item.lastActivityText}</span>
                      )}
                      {item.statsSubtext && (
                        <span className="text-emerald-600 font-mono truncate">• {item.statsSubtext}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs opacity-80 group-hover:opacity-100 shrink-0 gap-1 text-primary"
                asChild
              >
                <Link to={item.linkTo as any} params={item.linkParams as any}>
                  <span className="hidden sm:inline">Abrir</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
