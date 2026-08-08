/**
 * Entidade de Domínio: InventoryAuditLog
 * Categoria: State / Inventory
 *
 * Registo de auditoria das operações de inventário.
 */

import type { InventoryAuditLogId, TenantId, CompanyId, ActorId } from "../../../shared/primitives";
import type { CorrelationId, CausationId, ISO8601String } from "../../../types/aliases";
import type {
  InventoryAuditableEntityType,
  InventoryAuditAction,
  InventoryReferenceType,
} from "../../../types/enums";

export interface InventoryAuditLog {
  readonly id: InventoryAuditLogId;
  readonly tenantId: TenantId;
  readonly companyId: CompanyId;

  readonly entityType: InventoryAuditableEntityType;
  readonly entityId: string;

  readonly action: InventoryAuditAction;

  readonly actorId?: ActorId;

  readonly correlationId?: CorrelationId;
  readonly causationId?: CausationId;

  readonly referenceType?: InventoryReferenceType;
  readonly referenceId?: string;

  readonly occurredAt: ISO8601String;

  readonly previousState?: Readonly<Record<string, unknown>>;
  readonly nextState?: Readonly<Record<string, unknown>>;

  readonly metadata?: Readonly<Record<string, unknown>>;
}
