/**
 * Componente Visual: InventoryStatusBadge
 * Categoria: components
 *
 * Badge padronizada do Design System do ObraMZ para estados do inventário.
 * Mapeia estados de stock (disponível, stock baixo, sem stock, reservado, stock negativo, inconsistente).
 */

import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldAlert,
  ArrowLeftRight,
} from "lucide-react";

export type InventoryStatusType =
  | "available"
  | "low_stock"
  | "out_of_stock"
  | "reserved"
  | "negative"
  | "inactive"
  | "inconsistent"
  | "confirmed"
  | "replayed"
  | "processing"
  | "failed"
  | "active"
  | "fulfilled"
  | "released";

interface InventoryStatusBadgeProps {
  status: InventoryStatusType | string;
  className?: string;
  showIcon?: boolean;
}

export function InventoryStatusBadge({
  status,
  className,
  showIcon = true,
}: InventoryStatusBadgeProps) {
  switch (status) {
    case "available":
    case "active":
    case "confirmed":
    case "fulfilled":
      return (
        <Badge
          variant="outline"
          className={cn(
            "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 gap-1 font-medium",
            className,
          )}
        >
          {showIcon && <CheckCircle2 className="w-3.5 h-3.5" />}
          <span>
            {status === "available"
              ? "Disponível"
              : status === "confirmed"
                ? "Confirmado"
                : status === "fulfilled"
                  ? "Concluída"
                  : "Ativa"}
          </span>
        </Badge>
      );

    case "low_stock":
      return (
        <Badge
          variant="outline"
          className={cn(
            "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 gap-1 font-medium",
            className,
          )}
        >
          {showIcon && <AlertTriangle className="w-3.5 h-3.5" />}
          <span>Stock Baixo</span>
        </Badge>
      );

    case "out_of_stock":
    case "failed":
      return (
        <Badge
          variant="outline"
          className={cn(
            "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-400 gap-1 font-medium",
            className,
          )}
        >
          {showIcon && <XCircle className="w-3.5 h-3.5" />}
          <span>{status === "out_of_stock" ? "Esgotado" : "Falhou"}</span>
        </Badge>
      );

    case "reserved":
      return (
        <Badge
          variant="outline"
          className={cn(
            "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400 gap-1 font-medium",
            className,
          )}
        >
          {showIcon && <Clock className="w-3.5 h-3.5" />}
          <span>Reservado</span>
        </Badge>
      );

    case "negative":
    case "inconsistent":
      return (
        <Badge
          variant="outline"
          className={cn(
            "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:bg-purple-500/20 dark:text-purple-400 gap-1 font-medium",
            className,
          )}
        >
          {showIcon && <ShieldAlert className="w-3.5 h-3.5" />}
          <span>{status === "negative" ? "Stock Negativo" : "Inconsistência"}</span>
        </Badge>
      );

    case "replayed":
      return (
        <Badge
          variant="outline"
          className={cn(
            "bg-sky-500/10 text-sky-600 border-sky-500/20 dark:bg-sky-500/20 dark:text-sky-400 gap-1 font-medium",
            className,
          )}
        >
          {showIcon && <ArrowLeftRight className="w-3.5 h-3.5" />}
          <span>Replayed (Idempotente)</span>
        </Badge>
      );

    case "released":
    case "inactive":
    default:
      return (
        <Badge variant="secondary" className={cn("gap-1 font-medium", className)}>
          <span>
            {status === "released" ? "Libertada" : status === "inactive" ? "Inativo" : status}
          </span>
        </Badge>
      );
  }
}
