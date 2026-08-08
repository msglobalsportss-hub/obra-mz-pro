/**
 * Contratos Externos (External Contracts).
 * Contratos públicos para comunicação com outros módulos (Compras, Entregas, Materiais, Obras, Financeiro, etc.).
 * Serão re-exportados pela API pública (src/modules/inventory/index.ts).
 */

import type { InventoryLocationRef, InventoryLocationType } from "../../types";
import type {
  InventoryCorrelationContext,
  InventoryOperationResult,
  InventoryReference,
} from "../shared";

/** Contrato de consulta de saldo público */
export interface InventoryBalanceQueryRequest {
  materialId: string;
  locationType?: InventoryLocationType;
  locationId?: string;
  projectId?: string;
}

export interface InventoryBalanceDTO {
  materialId: string;
  locationRef: InventoryLocationRef;
  physicalStock: number;
  reservedStock: number;
  availableStock: number;
  averageUnitCost: number;
  totalValue: number;
}

/** Contrato de entrada de stock por recepção de compra / entrega */
export interface StockEntryRequest {
  reference: InventoryReference;
  materialId: string;
  destinationLocation: InventoryLocationRef;
  quantity: number;
  unitPrice: number;
  context?: InventoryCorrelationContext;
}

/** Contrato de requisição / consumo de material para Obra */
export interface StockConsumptionRequest {
  reference: InventoryReference;
  materialId: string;
  sourceLocation: InventoryLocationRef;
  quantity: number;
  context?: InventoryCorrelationContext;
}

/** Contrato de transferência entre localizações */
export interface StockTransferRequest {
  reference: InventoryReference;
  materialId: string;
  sourceLocation: InventoryLocationRef;
  destinationLocation: InventoryLocationRef;
  quantity: number;
  context?: InventoryCorrelationContext;
}

export type StockOperationResult = InventoryOperationResult<{
  transactionId: string;
  movementIds: string[];
}>;
