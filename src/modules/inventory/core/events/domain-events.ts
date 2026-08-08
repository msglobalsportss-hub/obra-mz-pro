/**
 * Eventos de Domínio Internos — Core Domain Events
 * Categoria: core/events
 *
 * Emitidos pelo Inventory Engine durante a execução das operações.
 * Permanecem internos ao módulo de Inventário.
 */

import type { StockMovement } from "../domain/entities";
import type {
  TenantId,
  CompanyId,
  MaterialId,
  InventoryLocationId,
  ActorId,
} from "../shared/primitives";
import type { CorrelationId, CausationId, ISO8601String, IdempotencyKey } from "../types/aliases";

export interface InventoryDomainEventHeader {
  readonly eventId: string;
  readonly eventType: string;
  readonly tenantId: TenantId;
  readonly companyId: CompanyId;
  readonly aggregateId: string;
  readonly correlationId: CorrelationId;
  readonly causationId?: CausationId;
  readonly idempotencyKey: IdempotencyKey;
  readonly occurredAt: ISO8601String;
  readonly actorId?: ActorId;
  readonly sourceModule: string;
}

export interface InventoryDomainEvent<TPayload = unknown> {
  readonly header: InventoryDomainEventHeader;
  readonly payload: TPayload;
}

// ---------------------------------------------------------------------------
// Payloads dos Eventos de Domínio
// ---------------------------------------------------------------------------

export interface StockReceivedPayload {
  readonly movementId: string;
  readonly materialId: MaterialId;
  readonly locationId: InventoryLocationId;
  readonly quantity: number;
  readonly unitCost: number;
  readonly totalCost: number;
  readonly resultingAverageCost?: number;
  readonly balanceKey: string;
}

export interface StockIssuedPayload {
  readonly movementId: string;
  readonly materialId: MaterialId;
  readonly locationId: InventoryLocationId;
  readonly quantity: number;
  readonly unitCost: number;
  readonly totalCost: number;
  readonly balanceKey: string;
}

export interface StockReservedPayload {
  readonly reservationId: string;
  readonly materialId: MaterialId;
  readonly locationId: InventoryLocationId;
  readonly quantity: number;
  readonly balanceKey: string;
}

export interface StockReservationReleasedPayload {
  readonly reservationId: string;
  readonly materialId: MaterialId;
  readonly locationId: InventoryLocationId;
  readonly releasedQuantity: number;
  readonly balanceKey: string;
}

export interface StockReservationConsumedPayload {
  readonly reservationId: string;
  readonly movementId: string;
  readonly materialId: MaterialId;
  readonly locationId: InventoryLocationId;
  readonly consumedQuantity: number;
  readonly balanceKey: string;
}

export interface StockTransferredPayload {
  readonly transferOutMovementId: string;
  readonly transferInMovementId: string;
  readonly materialId: MaterialId;
  readonly sourceLocationId: InventoryLocationId;
  readonly destinationLocationId: InventoryLocationId;
  readonly quantity: number;
  readonly unitCost: number;
}

export interface StockAdjustedPayload {
  readonly movementId: string;
  readonly materialId: MaterialId;
  readonly locationId: InventoryLocationId;
  readonly differenceQuantity: number;
  readonly reasonCode: string;
  readonly balanceKey: string;
}

export interface StockMovementReversedPayload {
  readonly originalMovementId: string;
  readonly reversalMovementId: string;
  readonly materialId: MaterialId;
  readonly locationId: InventoryLocationId;
  readonly quantity: number;
}

export interface InventoryBalanceChangedPayload {
  readonly balanceId: string;
  readonly balanceKey: string;
  readonly materialId: MaterialId;
  readonly locationId: InventoryLocationId;
  readonly onHandQuantity: number;
  readonly reservedQuantity: number;
  readonly availableQuantity: number;
  readonly averageCost: number;
  readonly totalValue: number;
  readonly version: number;
}

export interface InventoryOperationCompletedPayload {
  readonly operationId: string;
  readonly idempotencyKey: IdempotencyKey;
  readonly movementIds: readonly string[];
  readonly status: "completed" | "replayed";
}

export interface InventoryBalancesRebuiltPayload {
  readonly processedMovements: number;
  readonly rebuiltBalances: number;
  readonly correctedBalances: number;
  readonly completedAt: ISO8601String;
}

// ---------------------------------------------------------------------------
// Tipos de Eventos de Domínio Concretos
// ---------------------------------------------------------------------------
export type StockReceivedDomainEvent = InventoryDomainEvent<StockReceivedPayload>;
export type StockIssuedDomainEvent = InventoryDomainEvent<StockIssuedPayload>;
export type StockReservedDomainEvent = InventoryDomainEvent<StockReservedPayload>;
export type StockReservationReleasedDomainEvent =
  InventoryDomainEvent<StockReservationReleasedPayload>;
export type StockReservationConsumedDomainEvent =
  InventoryDomainEvent<StockReservationConsumedPayload>;
export type StockTransferredDomainEvent = InventoryDomainEvent<StockTransferredPayload>;
export type StockAdjustedDomainEvent = InventoryDomainEvent<StockAdjustedPayload>;
export type StockMovementReversedDomainEvent = InventoryDomainEvent<StockMovementReversedPayload>;
export type InventoryBalanceChangedDomainEvent =
  InventoryDomainEvent<InventoryBalanceChangedPayload>;
export type InventoryOperationCompletedDomainEvent =
  InventoryDomainEvent<InventoryOperationCompletedPayload>;
export type InventoryBalancesRebuiltDomainEvent =
  InventoryDomainEvent<InventoryBalancesRebuiltPayload>;
