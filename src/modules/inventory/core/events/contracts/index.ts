/**
 * Contratos de interfaces de eventos de inventário.
 * Isento de implementação concreta nesta fase.
 */

import type { InventoryEventMetadata } from "../../contracts/shared";

export interface IInventoryEvent<TPayload = unknown> {
  metadata: InventoryEventMetadata;
  payload: TPayload;
}

export interface IInventoryEventHandler<TEvent extends IInventoryEvent = IInventoryEvent> {
  handle(event: TEvent): Promise<void>;
}

export interface IInventoryEventBus {
  publish<TEvent extends IInventoryEvent>(event: TEvent): Promise<void>;
  subscribe<TEvent extends IInventoryEvent>(
    eventType: string,
    handler: IInventoryEventHandler<TEvent>,
  ): void;
}
