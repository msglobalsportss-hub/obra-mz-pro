/**
 * Entidades de Domínio: StockAdjustment e StockAdjustmentItem
 * Categoria: Documents
 *
 * Representa o documento de ajuste de inventário (ADR-008).
 */

import type {
  StockAdjustmentId,
  StockAdjustmentItemId,
  InventoryLocationId,
  TenantId,
  CompanyId,
  MaterialId,
  InventoryBatchId,
  ActorId,
} from "../../../shared/primitives";
import type {
  CorrelationId,
  IdempotencyKey,
  ISO8601String,
  Quantity,
  UnitPrice,
} from "../../../types/aliases";
import type {
  InventoryReferenceType,
  InventoryStockState,
  StockAdjustmentReasonCode,
  StockAdjustmentStatus,
  StockAdjustmentType,
} from "../../../types/enums";

export interface StockAdjustment {
  readonly id: StockAdjustmentId;
  readonly tenantId: TenantId;
  readonly companyId: CompanyId;

  readonly adjustmentNumber: string;
  readonly locationId: InventoryLocationId;

  readonly type: StockAdjustmentType;
  readonly status: StockAdjustmentStatus;

  readonly reasonCode: StockAdjustmentReasonCode;
  readonly reason: string;

  readonly referenceType?: InventoryReferenceType;
  readonly referenceId?: string;

  readonly correlationId: CorrelationId;
  readonly idempotencyKey: IdempotencyKey;

  readonly requestedAt: ISO8601String;
  readonly approvedAt?: ISO8601String;
  readonly confirmedAt?: ISO8601String;
  readonly cancelledAt?: ISO8601String;

  readonly requestedBy?: ActorId;
  readonly approvedBy?: ActorId;
  readonly confirmedBy?: ActorId;

  readonly notes?: string;
  readonly cancellationReason?: string;

  readonly createdAt: ISO8601String;
  readonly updatedAt: ISO8601String;
}

export interface StockAdjustmentItem {
  readonly id: StockAdjustmentItemId;
  readonly adjustmentId: StockAdjustmentId;

  readonly materialId: MaterialId;

  readonly systemQuantity: Quantity;
  readonly countedQuantity: Quantity;
  readonly differenceQuantity: Quantity;

  readonly unitCost?: UnitPrice;

  readonly stockState: InventoryStockState;

  readonly batchId?: InventoryBatchId;
  readonly expirationDate?: ISO8601String;

  readonly notes?: string;

  readonly createdAt: ISO8601String;
  readonly updatedAt: ISO8601String;
}
