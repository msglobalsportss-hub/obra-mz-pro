/**
 * Event Publisher em Memória: InMemoryEventPublisher
 * Categoria: infrastructure/event-bus
 *
 * Implementação em memória da interface IInventoryEventPublisher.
 * Coleta eventos durante a execução da transação e publica-os apenas após o commit.
 */

import type {
  IInventoryEventPublisher,
  PendingIntegrationEvent,
} from "../../core/events/event-publisher.interface";
import type { InventoryDomainEvent } from "../../core/events/domain-events";

export type IntegrationEventHandler = (event: PendingIntegrationEvent) => Promise<void> | void;

export class InMemoryEventPublisher implements IInventoryEventPublisher {
  private domainEventsQueue: InventoryDomainEvent[] = [];
  private integrationEventsQueue: PendingIntegrationEvent[] = [];
  private handlers: IntegrationEventHandler[] = [];

  subscribe(handler: IntegrationEventHandler): () => void {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    };
  }

  collectDomainEvent(event: InventoryDomainEvent): void {
    this.domainEventsQueue.push(event);
  }

  collectIntegrationEvent(event: PendingIntegrationEvent): void {
    this.integrationEventsQueue.push(event);
  }

  async publishCollectedEvents(): Promise<void> {
    const toPublish = [...this.integrationEventsQueue];
    this.domainEventsQueue = [];
    this.integrationEventsQueue = [];

    for (const event of toPublish) {
      for (const handler of this.handlers) {
        try {
          await handler(event);
        } catch (err) {
          console.error(
            `[InMemoryEventPublisher] Falha ao entregar evento ${event.eventType}:`,
            err,
          );
        }
      }
    }
  }

  clear(): void {
    this.domainEventsQueue = [];
    this.integrationEventsQueue = [];
  }
}
