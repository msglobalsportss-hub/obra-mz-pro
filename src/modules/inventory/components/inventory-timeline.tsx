/**
 * Timeline Reutilizável: InventoryTimeline
 * Categoria: components
 *
 * Exibe a linha do tempo cronológica de movimentos e eventos correlacionados (Seção 18).
 * Agrupa visualmente eventos com o mesmo correlationId (ex: TRANSFER_OUT + TRANSFER_IN).
 */

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InventoryStatusBadge } from "./inventory-status-badge";
import { formatDate } from "@/lib/format";
import {
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  ArrowLeftRight,
  Clock,
  ShieldCheck,
  Tag,
} from "lucide-react";
import type { StockMovementView } from "../store/inventory-store.types";

export interface TimelineItem {
  id: string;
  type: string;
  title: string;
  occurredAt: string;
  actorId?: string;
  materialName?: string;
  quantity?: number;
  locationName?: string;
  referenceId?: string;
  correlationId?: string;
  details?: string;
}

interface InventoryTimelineProps {
  movements: readonly StockMovementView[];
  materialNames?: Record<string, string>;
  locationNames?: Record<string, string>;
}

export function InventoryTimeline({
  movements,
  materialNames = {},
  locationNames = {},
}: InventoryTimelineProps) {
  if (!movements || movements.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        Nenhum evento registado na linha do tempo.
      </p>
    );
  }

  // Agrupar movimentos por correlationId se houver movimentos emparelhados (ex: transferências)
  const grouped = movements.reduce(
    (acc, mov) => {
      const key = mov.correlationId || mov.id;
      if (!acc[key]) acc[key] = [];
      acc[key]!.push(mov);
      return acc;
    },
    {} as Record<string, StockMovementView[]>,
  );

  const groupKeys = Object.keys(grouped);

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
      {groupKeys.map((key) => {
        const items = grouped[key]!;
        const first = items[0]!;
        const isTransferGroup = items.length > 1 && first.movementType.includes("transfer");

        return (
          <div key={key} className="relative group">
            {/* Ícone Indicador no eixo vertical */}
            <div className="absolute -left-6 top-1 p-1 rounded-full bg-card border border-border shadow-2xs text-muted-foreground group-hover:border-primary/50 group-hover:text-primary transition-colors">
              {isTransferGroup ? (
                <ArrowLeftRight className="w-3.5 h-3.5 text-blue-500" />
              ) : first.movementType.includes("in") || first.movementType.includes("receipt") ? (
                <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500" />
              ) : first.movementType.includes("out") ||
                first.movementType.includes("consumption") ? (
                <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
              )}
            </div>

            <Card className="border-border/60 bg-card hover:border-border/80 transition-colors">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      {isTransferGroup
                        ? "Transferência Emparelhada de Stock"
                        : first.movementType === "delivery_receipt"
                          ? "Receção de Entrega"
                          : first.movementType === "consumption"
                            ? "Consumo em Obra"
                            : first.movementType}
                    </span>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                      {first.referenceType}: {first.referenceId}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {formatDate(first.occurredAt)}
                  </span>
                </div>

                {/* Linhas de Movimento do Grupo */}
                <div className="space-y-1.5 pt-1">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="text-xs flex items-center justify-between bg-muted/40 p-2 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {materialNames[item.materialId] ?? item.materialId}
                        </span>
                        <span className="text-muted-foreground">
                          (
                          {locationNames[
                            item.destinationLocationId || item.sourceLocationId || ""
                          ] ??
                            (item.destinationLocationId || item.sourceLocationId)}
                          )
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono font-medium">
                        <span
                          className={
                            item.movementType.includes("in") ||
                            item.movementType.includes("receipt")
                              ? "text-emerald-600"
                              : "text-rose-600"
                          }
                        >
                          {item.movementType.includes("in") || item.movementType.includes("receipt")
                            ? "+"
                            : "-"}
                          {item.quantity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/30">
                  <span>Correlation: {first.correlationId}</span>
                  {first.tenantId && <span>Tenant: {first.tenantId}</span>}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
