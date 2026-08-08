/**
 * DTOs da Camada Application — Public & Internal Application DTOs
 * Categoria: application/dto
 */

import type {
  StockMovementType,
  StockAdjustmentType,
  StockAdjustmentReasonCode,
  InventoryStockState,
} from "../../core/types/enums";
import type {
  Quantity,
  UnitPrice,
  ISO8601String,
  CorrelationId,
  IdempotencyKey,
} from "../../core/types/aliases";
import type { InventoryReference } from "../../core/contracts/shared";

export interface BaseInventoryRequestDTO {
  readonly tenantId: string;
  readonly companyId: string;
  readonly actorId?: string;
  readonly correlationId?: CorrelationId;
  readonly idempotencyKey: IdempotencyKey;
  readonly sourceModule?: string;
  readonly reference?: InventoryReference;
}

export interface ReceiveStockInputDTO extends BaseInventoryRequestDTO {
  readonly materialId: string;
  readonly locationId: string;
  readonly quantity: Quantity;
  readonly unitCost: UnitPrice;
  readonly batchId?: string;
  readonly expirationDate?: ISO8601String;
  readonly stockState?: InventoryStockState;
  readonly movementType?: StockMovementType;
}

export interface IssueStockInputDTO extends BaseInventoryRequestDTO {
  readonly materialId: string;
  readonly locationId: string;
  readonly quantity: Quantity;
  readonly batchId?: string;
  readonly expirationDate?: ISO8601String;
  readonly stockState?: InventoryStockState;
  readonly movementType?: StockMovementType;
}

export interface TransferStockInputDTO extends BaseInventoryRequestDTO {
  readonly materialId: string;
  readonly sourceLocationId: string;
  readonly destinationLocationId: string;
  readonly quantity: Quantity;
  readonly batchId?: string;
  readonly expirationDate?: ISO8601String;
  readonly stockState?: InventoryStockState;
}

export interface ReserveStockInputDTO extends BaseInventoryRequestDTO {
  readonly materialId: string;
  readonly locationId: string;
  readonly quantity: Quantity;
  readonly projectId?: string;
  readonly requiredAt?: ISO8601String;
  readonly expiresAt?: ISO8601String;
}

export interface ReleaseReservationInputDTO extends BaseInventoryRequestDTO {
  readonly reservationId: string;
  readonly quantityToRelease?: Quantity;
  readonly reason?: string;
}

export interface ConsumeReservationInputDTO extends BaseInventoryRequestDTO {
  readonly reservationId: string;
  readonly quantityToConsume?: Quantity;
}

export interface AdjustmentItemDTO {
  readonly materialId: string;
  readonly quantity: number;
  readonly unitCost?: number;
  readonly stockState?: InventoryStockState;
  readonly batchId?: string;
  readonly expirationDate?: ISO8601String;
  readonly notes?: string;
}

export interface AdjustStockInputDTO extends BaseInventoryRequestDTO {
  readonly locationId: string;
  readonly adjustmentType: StockAdjustmentType;
  readonly reasonCode: StockAdjustmentReasonCode;
  readonly reasonDescription: string;
  readonly items: readonly AdjustmentItemDTO[];
}

export interface ReverseMovementInputDTO extends BaseInventoryRequestDTO {
  readonly movementIdToReverse: string;
  readonly reason: string;
}

export interface InventoryExecutionOutputDTO {
  readonly success: boolean;
  readonly operationId: string;
  readonly movementIds: readonly string[];
  readonly status: "completed" | "replayed";
  readonly timestamp: ISO8601String;
  readonly idempotencyKey: string;
}
