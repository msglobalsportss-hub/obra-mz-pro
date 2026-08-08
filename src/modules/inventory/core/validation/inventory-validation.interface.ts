/**
 * Contratos da camada de Validação Arquitetural de Inventário.
 */

import type { InventoryLocationRef } from "../types";

export interface InventoryValidationResult {
  isValid: boolean;
  errors: Array<{
    code: string;
    message: string;
    field?: string;
  }>;
}

export interface StockValidationContext {
  materialId: string;
  locationRef: InventoryLocationRef;
  requestedQuantity: number;
}
