/**
 * Identificadores de tipos de eventos de domínio e de integração do Módulo de Inventário.
 */

export const InventoryDomainEventTypes = {
  STOCK_MOVEMENT_CREATED: "inventory.domain.stock_movement_created",
  INVENTORY_BALANCE_CHANGED: "inventory.domain.balance_changed",
  STOCK_RESERVED: "inventory.domain.stock_reserved",
  STOCK_RELEASED: "inventory.domain.stock_released",
  STOCK_TRANSFERRED: "inventory.domain.stock_transferred",
  STOCK_ADJUSTED: "inventory.domain.stock_adjusted",
} as const;

export type InventoryDomainEventType =
  (typeof InventoryDomainEventTypes)[keyof typeof InventoryDomainEventTypes];

export const InventoryIntegrationEventTypes = {
  DELIVERY_CONFIRMED: "integration.delivery_confirmed",
  PURCHASE_ORDER_APPROVED: "integration.purchase_order_approved",
  CONSUMPTION_REGISTERED: "integration.consumption_registered",
  INVENTORY_TRANSFER_COMPLETED: "integration.transfer_completed",
} as const;

export type InventoryIntegrationEventType =
  (typeof InventoryIntegrationEventTypes)[keyof typeof InventoryIntegrationEventTypes];
