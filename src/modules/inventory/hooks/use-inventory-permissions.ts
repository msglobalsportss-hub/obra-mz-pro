/**
 * Hook Central de Permissões de Inventário — useInventoryPermissions
 * Categoria: hooks
 *
 * Centraliza os sinalizadores de permissão da UI (ADR & Seção 21).
 * Impede condições espalhadas como `if (user.role === 'admin')` nos componentes React.
 */

import { useMemo } from "react";
import { useObraMZStore } from "@/store/obramz-store";

export interface InventoryPermissions {
  readonly canView: boolean;
  readonly canReceive: boolean;
  readonly canIssue: boolean;
  readonly canReserve: boolean;
  readonly canTransfer: boolean;
  readonly canAdjust: boolean;
  readonly canReverse: boolean;
  readonly canRebuild: boolean;
  readonly canRunHealthCheck: boolean;
  readonly canViewReports: boolean;
  readonly isAdmin: boolean;

  // Permissões específicas do Centro Operacional de Receções & Entregas
  readonly canViewDeliveries: boolean;
  readonly canInspectDelivery: boolean;
  readonly canReceiveDelivery: boolean;
  readonly canConfirmDelivery: boolean;
  readonly canRejectDelivery: boolean;
  readonly canCancelDelivery: boolean;
  readonly canChangeDestination: boolean;
  readonly canManageDocs: boolean;
  readonly canExport: boolean;
}

export function useInventoryPermissions(): InventoryPermissions {
  const utilizador = useObraMZStore((s) => s.utilizador);

  return useMemo(() => {
    if (!utilizador) {
      return {
        canView: false,
        canReceive: false,
        canIssue: false,
        canReserve: false,
        canTransfer: false,
        canAdjust: false,
        canReverse: false,
        canRebuild: false,
        canRunHealthCheck: false,
        canViewReports: false,
        isAdmin: false,
        canViewDeliveries: false,
        canInspectDelivery: false,
        canReceiveDelivery: false,
        canConfirmDelivery: false,
        canRejectDelivery: false,
        canCancelDelivery: false,
        canChangeDestination: false,
        canManageDocs: false,
        canExport: false,
      };
    }

    const role = utilizador.role ?? "GESTOR";
    const isAdmin = role === "ADMIN" || role === "GESTOR";

    return {
      canView: true,
      canReceive: true,
      canIssue: true,
      canReserve: true,
      canTransfer: true,
      canAdjust: isAdmin,
      canReverse: isAdmin,
      canRebuild: isAdmin,
      canRunHealthCheck: isAdmin,
      canViewReports: true,
      isAdmin,

      canViewDeliveries: true,
      canInspectDelivery: true,
      canReceiveDelivery: true,
      canConfirmDelivery: isAdmin,
      canRejectDelivery: isAdmin,
      canCancelDelivery: isAdmin,
      canChangeDestination: isAdmin,
      canManageDocs: true,
      canExport: true,
    };
  }, [utilizador]);
}
