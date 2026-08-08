/**
 * Entidades de Domínio: PhysicalInventoryCount e PhysicalInventoryCountItem
 * Categoria: Documents
 *
 * Representa o processo formal de contagem física de inventário (ADR-008).
 */

import type {
  PhysicalInventoryCountId,
  PhysicalInventoryCountItemId,
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
} from "../../../types/aliases";
import type {
  InventoryStockState,
  PhysicalInventoryCountScope,
  PhysicalInventoryCountStatus,
} from "../../../types/enums";

export interface PhysicalInventoryCount {
  readonly id: PhysicalInventoryCountId;
  readonly tenantId: TenantId;
  readonly companyId: CompanyId;

  readonly countNumber: string;
  readonly locationId: InventoryLocationId;

  readonly status: PhysicalInventoryCountStatus;
  readonly scope: PhysicalInventoryCountScope;

  readonly startedAt?: ISO8601String;
  readonly completedAt?: ISO8601String;
  readonly reconciledAt?: ISO8601String;
  readonly cancelledAt?: ISO8601String;

  readonly startedBy?: ActorId;
  readonly completedBy?: ActorId;
  readonly reconciledBy?: ActorId;

  readonly correlationId: CorrelationId;
  readonly idempotencyKey: IdempotencyKey;

  readonly notes?: string;
  readonly cancellationReason?: string;

  readonly createdAt: ISO8601String;
  readonly updatedAt: ISO8601String;
}

export interface PhysicalInventoryCountItem {
  readonly id: PhysicalInventoryCountItemId;
  readonly physicalCountId: PhysicalInventoryCountId;

  readonly materialId: MaterialId;
  readonly locationId: InventoryLocationId;

  readonly stockState: InventoryStockState;

  readonly batchId?: InventoryBatchId;
  readonly expirationDate?: ISO8601String;

  readonly expectedQuantity: Quantity;
  readonly countedQuantity?: Quantity;
  readonly differenceQuantity?: Quantity;

  readonly countedAt?: ISO8601String;
  readonly countedBy?: ActorId;

  readonly notes?: string;

  readonly createdAt: ISO8601String;
  readonly updatedAt: ISO8601String;
}
