/**
 * Erros do Domínio do Inventário — Core Domain Errors
 * Categoria: core/shared/errors
 *
 * Lançados pelas entidades, fábricas, serviços de domínio e operações do Engine.
 * O Core NUNCA importa a camada Application.
 */

export abstract class InventoryDomainError extends Error {
  abstract readonly code: string;
  readonly recoverable: boolean;
  readonly context?: Readonly<Record<string, unknown>>;

  constructor(message: string, recoverable = false, context?: Readonly<Record<string, unknown>>) {
    super(message);
    this.name = this.constructor.name;
    this.recoverable = recoverable;
    this.context = context;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Lançado quando a quantidade em stock físico é insuficiente para uma saída */
export class InsufficientStockError extends InventoryDomainError {
  readonly code = "INSUFFICIENT_STOCK";

  constructor(materialId: string, locationId: string, requested: number, available: number) {
    super(
      `Stock físico insuficiente para o material ${materialId} na localização ${locationId}. Pedido: ${requested}, Disponível: ${available}.`,
      true,
      { materialId, locationId, requested, available },
    );
  }
}

/** Lançado quando o stock disponível (onHand - reserved) é insuficiente para uma reserva ou saída */
export class InsufficientAvailableStockError extends InventoryDomainError {
  readonly code = "INSUFFICIENT_AVAILABLE_STOCK";

  constructor(materialId: string, locationId: string, requested: number, available: number) {
    super(
      `Stock disponível insuficiente para reserva/saída do material ${materialId} na localização ${locationId}. Pedido: ${requested}, Disponível: ${available}.`,
      true,
      { materialId, locationId, requested, available },
    );
  }
}

/** Lançado quando a quantidade fornecida é inválida (<= 0, NaN, Infinity) */
export class InvalidInventoryQuantityError extends InventoryDomainError {
  readonly code = "INVALID_INVENTORY_QUANTITY";

  constructor(field: string, value: unknown) {
    super(
      `Quantidade inválida para ${field}: ${String(value)}. Deve ser um número finito positivo.`,
      true,
      { field, value },
    );
  }
}

/** Lançado quando o preço ou custo unitário é inválido (< 0, NaN, Infinity) */
export class InvalidInventoryCostError extends InventoryDomainError {
  readonly code = "INVALID_INVENTORY_COST";

  constructor(field: string, value: unknown) {
    super(
      `Custo inválido para ${field}: ${String(value)}. Deve ser um número não-negativo finito.`,
      true,
      { field, value },
    );
  }
}

/** Lançado em conflito de concorrência otimista (versão diferente da esperada no saldo) */
export class InventoryBalanceConflictError extends InventoryDomainError {
  readonly code = "INVENTORY_BALANCE_CONFLICT";

  constructor(balanceId: string, expectedVersion: number | null, actualVersion: number) {
    super(
      `Conflito de concorrência otimista no saldo ${balanceId}. Versão esperada: ${expectedVersion}, Versão atual: ${actualVersion}.`,
      true,
      { balanceId, expectedVersion, actualVersion },
    );
  }
}

/** Lançado quando uma operação com a mesma idempotencyKey está a ser processada simultaneamente */
export class InventoryOperationAlreadyProcessingError extends InventoryDomainError {
  readonly code = "OPERATION_ALREADY_PROCESSING";

  constructor(idempotencyKey: string) {
    super(
      `A operação com a chave de idempotência '${idempotencyKey}' já está em processamento.`,
      true,
      { idempotencyKey },
    );
  }
}

/** Lançado quando uma reserva não é encontrada */
export class InventoryReservationNotFoundError extends InventoryDomainError {
  readonly code = "RESERVATION_NOT_FOUND";

  constructor(reservationId: string) {
    super(`Reserva de inventário '${reservationId}' não foi encontrada.`, true, { reservationId });
  }
}

/** Lançado quando o estado de uma reserva invalida a operação solicitada */
export class InventoryReservationStateError extends InventoryDomainError {
  readonly code = "RESERVATION_STATE_ERROR";

  constructor(reservationId: string, currentStatus: string, expectedAction: string) {
    super(
      `Operação '${expectedAction}' inválida para a reserva '${reservationId}' no estado atual '${currentStatus}'.`,
      true,
      { reservationId, currentStatus, expectedAction },
    );
  }
}

/** Lançado quando uma transferência é inválida (ex: origem = destino) */
export class InventoryTransferValidationError extends InventoryDomainError {
  readonly code = "TRANSFER_VALIDATION_ERROR";

  constructor(message: string, context?: Readonly<Record<string, unknown>>) {
    super(message, true, context);
  }
}

/** Lançado quando um movimento já foi estornado anteriormente */
export class InventoryMovementAlreadyReversedError extends InventoryDomainError {
  readonly code = "MOVEMENT_ALREADY_REVERSED";

  constructor(movementId: string, reversalMovementId?: string) {
    super(
      `O movimento '${movementId}' já foi estornado pelo movimento '${reversalMovementId ?? "desconhecido"}'.`,
      false,
      { movementId, reversalMovementId },
    );
  }
}

/** Lançado quando ocorre uma falha irrecuperável na reconstrução de saldos */
export class InventoryBalanceRebuildError extends InventoryDomainError {
  readonly code = "BALANCE_REBUILD_ERROR";

  constructor(message: string, context?: Readonly<Record<string, unknown>>) {
    super(message, false, context);
  }
}

/** Lançado quando uma operação viola a política de inventário (ex: saldo negativo proibido) */
export class InventoryPolicyViolationError extends InventoryDomainError {
  readonly code = "POLICY_VIOLATION";

  constructor(policyRule: string, message: string) {
    super(`Violação de Política de Inventário (${policyRule}): ${message}`, true, { policyRule });
  }
}
