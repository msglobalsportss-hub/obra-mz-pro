/**
 * Erros da Camada Application — Application Orchestration & Integration Errors
 * Categoria: application/errors
 *
 * Lançados por Use Cases, Facades, Mappers e Handlers de Integração.
 */

export abstract class InventoryApplicationError extends Error {
  abstract readonly code: string;
  readonly context?: Readonly<Record<string, unknown>>;

  constructor(message: string, context?: Readonly<Record<string, unknown>>) {
    super(message);
    this.name = this.constructor.name;
    this.context = context;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Lançado quando uma entrega já foi processada anteriormente para o inventário */
export class InventoryDeliveryAlreadyProcessedError extends InventoryApplicationError {
  readonly code = "DELIVERY_ALREADY_PROCESSED";

  constructor(deliveryId: string, idempotencyKey: string) {
    super(
      `A entrega '${deliveryId}' já foi processada para o inventário com a chave '${idempotencyKey}'.`,
      { deliveryId, idempotencyKey },
    );
  }
}

/** Lançado quando o mapeamento de DTOs ou contextos falha */
export class InventoryApplicationMappingError extends InventoryApplicationError {
  readonly code = "APPLICATION_MAPPING_ERROR";

  constructor(target: string, reason: string) {
    super(`Falha ao mapear DTO para '${target}': ${reason}`, { target, reason });
  }
}

/** Lançado quando os dados de um pedido idempotente repetido não coincidem com o registo original */
export class InventoryIdempotencyMismatchError extends InventoryApplicationError {
  readonly code = "IDEMPOTENCY_MISMATCH";

  constructor(idempotencyKey: string) {
    super(
      `Operação repetida com a chave de idempotência '${idempotencyKey}' mas com parâmetros divergentes da execução original.`,
      { idempotencyKey },
    );
  }
}
