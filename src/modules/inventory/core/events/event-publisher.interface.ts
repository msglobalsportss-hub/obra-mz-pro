/**
 * Contrato de Publicação de Eventos — Event Publisher Interface
 * Categoria: core/events
 *
 * Desacopla o Core de qualquer implementação concreta de Event Bus ou Store.
 * O Core interage apenas através desta interface.
 */

import type { InventoryDomainEvent } from "./domain-events";

export interface PendingIntegrationEvent {
  readonly eventId: string;
  readonly eventType: string;
  readonly payload: unknown;
  readonly occurredAt: string;
  readonly tenantId: string;
  readonly companyId: string;
  readonly correlationId: string;
}

export interface IInventoryEventPublisher {
  /**
   * Coleta eventos de domínio gerados durante o caso de uso.
   */
  collectDomainEvent(event: InventoryDomainEvent): void;

  /**
   * Coleta eventos de integração que deverão ser publicados pós-commit.
   */
  collectIntegrationEvent(event: PendingIntegrationEvent): void;

  /**
   * Dispara a publicação dos eventos de integração após o commit da Unit of Work.
   * Em caso de falha de publicação, a alteração de inventário confirmada NÃO é revertida.
   */
  publishCollectedEvents(): Promise<void>;

  /**
   * Limpa a fila de eventos pendentes (ex: em caso de rollback).
   */
  clear(): void;
}
