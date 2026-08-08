/**
 * Entidades de Domínio: StockTransfer e StockTransferItem
 * Categoria: Documents
 *
 * Representa a transferência de materiais entre duas localizações.
 */

import type {
  StockTransferId,
  StockTransferItemId,
  InventoryLocationId,
  TenantId,
  CompanyId,
  MaterialId,
  ProjectId,
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
import type { InventoryReferenceType, StockTransferStatus } from "../../../types/enums";

export interface StockTransfer {
  readonly id: StockTransferId;
  readonly tenantId: TenantId;
  readonly companyId: CompanyId;

  readonly transferNumber: string;

  readonly sourceLocationId: InventoryLocationId;
  readonly destinationLocationId: InventoryLocationId;

  readonly status: StockTransferStatus;

  readonly requestedAt: ISO8601String;
  readonly approvedAt?: ISO8601String;
  readonly dispatchedAt?: ISO8601String;
  readonly receivedAt?: ISO8601String;
  readonly cancelledAt?: ISO8601String;

  readonly requestedBy?: ActorId;
  readonly approvedBy?: ActorId;
  readonly dispatchedBy?: ActorId;
  readonly receivedBy?: ActorId;

  readonly projectId?: ProjectId;

  readonly referenceType?: InventoryReferenceType;
  readonly referenceId?: string;

  readonly correlationId: CorrelationId;
  readonly idempotencyKey: IdempotencyKey;

  readonly notes?: string;
  readonly cancellationReason?: string;

  readonly createdAt: ISO8601String;
  readonly updatedAt: ISO8601String;
}

export interface StockTransferItem {
  readonly id: StockTransferItemId;
  readonly transferId: StockTransferId;

  readonly materialId: MaterialId;

  readonly requestedQuantity: Quantity;
  readonly approvedQuantity: Quantity;
  readonly dispatchedQuantity: Quantity;
  readonly receivedQuantity: Quantity;

  readonly unitCost?: UnitPrice;

  readonly batchId?: InventoryBatchId;
  readonly expirationDate?: ISO8601String;

  readonly notes?: string;

  readonly createdAt: ISO8601String;
  readonly updatedAt: ISO8601String;
}
