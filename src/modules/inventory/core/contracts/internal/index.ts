/**
 * Contratos Internos (Internal Contracts).
 * Utilizados exclusivamente dentro dos componentes internos do módulo Inventory Core.
 * NÃO podem ser exportados pela API pública do módulo (src/modules/inventory/index.ts).
 */

import type { InventoryLocationRef } from "../../types";
import type { InventoryCorrelationContext } from "../shared";

export interface IInternalEngineState {
  isInitialized: boolean;
  activeLocksMap: Map<string, string>;
}

export interface IInternalMovementExecutionContext {
  materialId: string;
  sourceLocation?: InventoryLocationRef;
  targetLocation?: InventoryLocationRef;
  quantity: number;
  unitPrice?: number;
  correlationContext?: InventoryCorrelationContext;
}

export interface IInternalBalanceCalculationRequest {
  materialId: string;
  locationRef: InventoryLocationRef;
  includeReserved?: boolean;
}
