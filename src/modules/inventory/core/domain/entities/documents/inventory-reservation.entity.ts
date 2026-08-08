/**
 * Entidade de Domínio: InventoryReservation
 * Categoria: Documents
 *
 * Representa uma reserva de material para uma referência de negócio (ADR-007).
 */

import type {
  InventoryReservationId,
  TenantId,
  CompanyId,
  MaterialId,
  InventoryLocationId,
  ProjectId,
  ActorId,
} from "../../../shared/primitives";
import type {
  CorrelationId,
  IdempotencyKey,
  ISO8601String,
  Quantity,
} from "../../../types/aliases";
import type { InventoryReferenceType, InventoryReservationStatus } from "../../../types/enums";

export interface InventoryReservation {
  readonly id: InventoryReservationId;
  readonly tenantId: TenantId;
  readonly companyId: CompanyId;

  readonly materialId: MaterialId;
  readonly locationId: InventoryLocationId;

  readonly projectId?: ProjectId;

  readonly quantity: Quantity;
  readonly fulfilledQuantity: Quantity;
  readonly releasedQuantity: Quantity;

  readonly status: InventoryReservationStatus;

  readonly referenceType: InventoryReferenceType;
  readonly referenceId: string;
  readonly referenceNumber?: string;

  readonly requiredAt?: ISO8601String;
  readonly expiresAt?: ISO8601String;

  readonly correlationId: CorrelationId;
  readonly idempotencyKey: IdempotencyKey;

  readonly createdAt: ISO8601String;
  readonly updatedAt: ISO8601String;
  readonly confirmedAt?: ISO8601String;
  readonly completedAt?: ISO8601String;
  readonly cancelledAt?: ISO8601String;

  readonly createdBy?: ActorId;
  readonly updatedBy?: ActorId;

  readonly cancellationReason?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
