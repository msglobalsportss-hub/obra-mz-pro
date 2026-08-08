/**
 * Arquitetura de Políticas de Inventário por Material.
 * Permite suporte a regras de stock individualizadas.
 */

import type { InventoryCostingMethod } from "../types";

export interface MaterialInventoryPolicy {
  materialId: string;
  minStock?: number;
  maxStock?: number;
  allowNegativeStock: boolean;
  allowReservations: boolean;
  allowTransfers: boolean;
  costingMethod: InventoryCostingMethod;
  requiresBatch: boolean;
  requiresExpirationDate: boolean;
}

export interface IInventoryPolicyEvaluator {
  evaluateMovementPolicy(
    policy: MaterialInventoryPolicy,
    requestedQuantity: number,
    currentAvailableStock: number,
  ): boolean;
}
