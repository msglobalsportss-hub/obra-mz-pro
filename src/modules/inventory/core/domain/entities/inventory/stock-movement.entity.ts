/**
 * Entidade de Domínio: StockMovement — FONTE ÚNICA DE VERDADE
 * Categoria: State / Inventory
 *
 * Representa uma alteração imutável de stock. É o registo histórico
 * de toda a actividade de inventário do ObraMZ.
 */

import type {
  StockMovementId,
  InventoryLocationId,
  TenantId,
  CompanyId,
  MaterialId,
  InventoryBatchId,
  ActorId,
} from "../../../shared/primitives";
import type {
  CorrelationId,
  CausationId,
  IdempotencyKey,
  ISO8601String,
  MoneyAmount,
  Quantity,
  UnitPrice,
} from "../../../types/aliases";
import type {
  StockMovementType,
  StockMovementStatus,
  InventoryStockState,
  InventoryReferenceType,
} from "../../../types/enums";

export interface StockMovement {
  readonly id: StockMovementId;
  readonly tenantId: TenantId;
  readonly companyId: CompanyId;

  readonly materialId: MaterialId;

  readonly movementType: StockMovementType;
  readonly status: StockMovementStatus;

  readonly sourceLocationId?: InventoryLocationId;
  readonly destinationLocationId?: InventoryLocationId;

  readonly quantity: Quantity;

  readonly unitCost?: UnitPrice;
  readonly totalCost?: MoneyAmount;
  readonly resultingAverageCost?: UnitPrice;

  readonly stockState: InventoryStockState;

  readonly batchId?: InventoryBatchId;
  readonly expirationDate?: ISO8601String;

  readonly referenceType: InventoryReferenceType;
  readonly referenceId: string;
  readonly referenceNumber?: string;

  readonly correlationId: CorrelationId;
  readonly causationId?: CausationId;
  readonly idempotencyKey: IdempotencyKey;

  readonly occurredAt: ISO8601String;
  readonly confirmedAt?: ISO8601String;

  readonly createdAt: ISO8601String;
  readonly createdBy?: ActorId;

  readonly reversalOfMovementId?: StockMovementId;
  readonly reversedByMovementId?: StockMovementId;

  readonly metadata?: Readonly<Record<string, unknown>>;
}
