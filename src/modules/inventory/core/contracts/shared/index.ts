/**
 * Contratos neutros partilhados (Shared Contracts).
 * Podem ser utilizados internamente e expostos a módulos externos.
 */

import type { ActorId, TenantId, CompanyId } from "../../shared/primitives";
import type {
  CausationId,
  CorrelationId,
  EventId,
  ISO8601String,
  IdempotencyKey,
} from "../../types/aliases";

export interface InventoryCorrelationContext {
  tenantId?: TenantId;
  companyId?: CompanyId;
  actorId?: ActorId;
  correlationId?: CorrelationId;
  causationId?: CausationId;
  idempotencyKey?: IdempotencyKey;
}

export interface InventoryEventMetadata extends InventoryCorrelationContext {
  eventId: EventId;
  eventType: string;
  occurredAt: ISO8601String;
  version: number;
}

export interface InventoryReference {
  referenceType:
    | "PURCHASE_ORDER"
    | "DELIVERY"
    | "PROJECT_REQUISITION"
    | "TRANSFER"
    | "ADJUSTMENT"
    | (string & {});
  referenceId: string;
}

export interface InventoryOperationResult<T = void> {
  success: boolean;
  data?: T;
  errorCode?: string;
  errorMessage?: string;
  timestamp: ISO8601String;
}

export type { InventoryTransactionContext } from "./inventory-transaction-context";
