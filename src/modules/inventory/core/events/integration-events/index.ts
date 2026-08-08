/**
 * Contratos de Eventos de Integração entre Módulos.
 */

import type { InventoryLocationRef } from "../../types";
import type { IInventoryEvent } from "../contracts";
import type { InventoryIntegrationEventTypes } from "../event-types";

export interface DeliveryConfirmedPayload {
  deliveryId: string;
  purchaseOrderId?: string;
  items: Array<{
    materialId: string;
    receivedQuantity: number;
    acceptedQuantity: number;
    unitPrice: number;
  }>;
  destinationLocation: InventoryLocationRef;
}

export type DeliveryConfirmedEvent = IInventoryEvent<DeliveryConfirmedPayload> & {
  metadata: { eventType: typeof InventoryIntegrationEventTypes.DELIVERY_CONFIRMED };
};

export interface PurchaseOrderApprovedPayload {
  purchaseOrderId: string;
  supplierId: string;
  items: Array<{
    materialId: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export type PurchaseOrderApprovedEvent = IInventoryEvent<PurchaseOrderApprovedPayload> & {
  metadata: { eventType: typeof InventoryIntegrationEventTypes.PURCHASE_ORDER_APPROVED };
};

export interface ConsumptionRegisteredPayload {
  requisitionId: string;
  projectId: string;
  materialId: string;
  consumedQuantity: number;
}

export type ConsumptionRegisteredEvent = IInventoryEvent<ConsumptionRegisteredPayload> & {
  metadata: { eventType: typeof InventoryIntegrationEventTypes.CONSUMPTION_REGISTERED };
};

export interface InventoryTransferCompletedPayload {
  transferId: string;
  materialId: string;
  quantity: number;
  sourceLocation: InventoryLocationRef;
  destinationLocation: InventoryLocationRef;
}

export type InventoryTransferCompletedEvent = IInventoryEvent<InventoryTransferCompletedPayload> & {
  metadata: { eventType: typeof InventoryIntegrationEventTypes.INVENTORY_TRANSFER_COMPLETED };
};
