/**
 * Contratos de Eventos de Domínio do Módulo de Inventário.
 */

import type { InventoryLocationRef } from "../../types";
import type { IInventoryEvent } from "../contracts";
import type { InventoryDomainEventTypes } from "../event-types";

export interface StockMovementCreatedPayload {
  movementId: string;
  materialId: string;
  movementType: string;
  quantity: number;
  unitPrice?: number;
  sourceLocation?: InventoryLocationRef;
  targetLocation?: InventoryLocationRef;
}

export type StockMovementCreatedEvent = IInventoryEvent<StockMovementCreatedPayload> & {
  metadata: { eventType: typeof InventoryDomainEventTypes.STOCK_MOVEMENT_CREATED };
};

export interface InventoryBalanceChangedPayload {
  materialId: string;
  locationRef: InventoryLocationRef;
  previousBalance: number;
  newBalance: number;
  delta: number;
}

export type InventoryBalanceChangedEvent = IInventoryEvent<InventoryBalanceChangedPayload> & {
  metadata: { eventType: typeof InventoryDomainEventTypes.INVENTORY_BALANCE_CHANGED };
};

export interface StockReservedPayload {
  reservationId: string;
  materialId: string;
  locationRef: InventoryLocationRef;
  reservedQuantity: number;
}

export type StockReservedEvent = IInventoryEvent<StockReservedPayload> & {
  metadata: { eventType: typeof InventoryDomainEventTypes.STOCK_RESERVED };
};

export interface StockReleasedPayload {
  reservationId: string;
  materialId: string;
  releasedQuantity: number;
}

export type StockReleasedEvent = IInventoryEvent<StockReleasedPayload> & {
  metadata: { eventType: typeof InventoryDomainEventTypes.STOCK_RELEASED };
};

export interface StockTransferredPayload {
  transferId: string;
  materialId: string;
  sourceLocation: InventoryLocationRef;
  destinationLocation: InventoryLocationRef;
  quantity: number;
}

export type StockTransferredEvent = IInventoryEvent<StockTransferredPayload> & {
  metadata: { eventType: typeof InventoryDomainEventTypes.STOCK_TRANSFERRED };
};

export interface StockAdjustedPayload {
  adjustmentId: string;
  materialId: string;
  locationRef: InventoryLocationRef;
  quantityDelta: number;
  reason: string;
}

export type StockAdjustedEvent = IInventoryEvent<StockAdjustedPayload> & {
  metadata: { eventType: typeof InventoryDomainEventTypes.STOCK_ADJUSTED };
};
