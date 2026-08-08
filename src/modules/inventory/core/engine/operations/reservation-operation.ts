/**
 * Operação de Domínio: ReservationOperation
 * Categoria: core/engine/operations
 *
 * Processa a criação, libertação e consumo de reservas de inventário (ADR-007).
 *
 * CONCEITO ARQUITETURAL (Refinamento 8):
 * 1. InventoryReservation é o documento de workflow.
 * 2. As alterações quantitativas são causadas por movimentos de reserva (reservation, reservation_release, consumption).
 * 3. O Rebuilder processa exclusivamente os movimentos, evitando contagem dupla com os documentos.
 * 4. Criar reserva: aumenta reservedQuantity, reduz availableQuantity, NÃO altera onHandQuantity.
 * 5. Libertar reserva: reduz reservedQuantity, aumenta availableQuantity, NÃO altera onHandQuantity.
 * 6. Consumir reserva: reduz reservedQuantity E reduz onHandQuantity.
 */

import type { InventoryTransactionContext } from "../../contracts/shared/inventory-transaction-context";
import type { InventoryRepositoryContext } from "../../domain/repositories";
import type {
  MaterialId,
  InventoryLocationId,
  InventoryReservationId,
  ProjectId,
} from "../../shared/primitives";
import type { InventoryStockState } from "../../types/enums";
import { StockMovementFactory } from "../../domain/factories/stock-movement.factory";
import { InventoryBalanceEngine } from "../inventory-balance-engine";
import type { StockMovement, InventoryBalance, InventoryReservation } from "../../domain/entities";
import { validateNonEmptyId, validatePositiveQuantity } from "../../validation";
import {
  InsufficientAvailableStockError,
  InvalidInventoryQuantityError,
  InventoryReservationNotFoundError,
  InventoryReservationStateError,
} from "../../shared/errors";
import { generateInventoryId, nowISO } from "../../helpers";
import { toInventoryReservationId } from "../../shared/primitives";

export interface ReserveStockCommand {
  readonly materialId: MaterialId;
  readonly locationId: InventoryLocationId;
  readonly quantity: number;
  readonly projectId?: ProjectId;
  readonly requiredAt?: string;
  readonly expiresAt?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface ReleaseReservationCommand {
  readonly reservationId: InventoryReservationId;
  readonly quantityToRelease?: number; // Se ausente, liberta o restante completo
  readonly reason?: string;
}

export interface ConsumeReservationCommand {
  readonly reservationId: InventoryReservationId;
  readonly quantityToConsume?: number; // Se ausente, consome o restante completo
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export class ReservationOperation {
  /**
   * Cria uma reserva de inventário.
   */
  static async reserve(
    context: InventoryTransactionContext,
    repositories: InventoryRepositoryContext,
    command: ReserveStockCommand,
  ): Promise<{
    reservation: InventoryReservation;
    movement: StockMovement;
    balance: InventoryBalance;
  }> {
    const { materialId, locationId, quantity } = command;

    const matErr = validateNonEmptyId(materialId, "materialId");
    if (matErr) throw new Error(matErr.message);

    const locErr = validateNonEmptyId(locationId, "locationId");
    if (locErr) throw new Error(locErr.message);

    const qErr = validatePositiveQuantity(quantity, "quantity");
    if (qErr) throw new InvalidInventoryQuantityError("quantity", quantity);

    // 1. Verificar saldo atual por dimensões
    const currentBalance = await repositories.balances.findByDimensions({
      tenantId: context.tenantId,
      companyId: context.companyId,
      materialId,
      locationId,
      stockState: "available",
    });

    const available = currentBalance?.availableQuantity ?? 0;

    // 2. Validar se o stock disponível é suficiente
    const policy = await repositories.policies.findByMaterial(
      context.tenantId,
      context.companyId,
      materialId,
      locationId,
    );
    if (!policy?.allowNegativeStock && available < quantity) {
      throw new InsufficientAvailableStockError(materialId, locationId, quantity, available);
    }

    const now = nowISO();
    const reservationId = toInventoryReservationId(generateInventoryId("res"));

    // 3. Criar movimento de reserva (movementType: 'reservation')
    const movement = StockMovementFactory.create({
      context,
      materialId,
      movementType: "reservation",
      sourceLocationId: locationId,
      quantity,
      stockState: "available",
      metadata: { ...command.metadata, reservationId },
    });

    await repositories.movements.appendMovement(movement);

    // 4. Projetar novo saldo (aumenta reserved, reduz available)
    const projectedBalance = InventoryBalanceEngine.projectBalance(currentBalance, movement);
    const expectedVersion = currentBalance ? currentBalance.version : null;
    await repositories.balances.storeBalanceProjection(projectedBalance, expectedVersion);

    // 5. Criar documento de reserva de workflow
    const refType: InventoryReferenceType =
      (context.reference?.referenceType as InventoryReferenceType) ?? "system";
    const refId = context.reference?.referenceId ?? context.idempotencyKey;

    const reservation: InventoryReservation = Object.freeze({
      id: reservationId,
      tenantId: context.tenantId,
      companyId: context.companyId,
      materialId,
      locationId,
      projectId: command.projectId,
      quantity,
      fulfilledQuantity: 0,
      releasedQuantity: 0,
      status: "active",
      referenceType: refType,
      referenceId: refId,
      requiredAt: command.requiredAt,
      expiresAt: command.expiresAt,
      correlationId: context.correlationId,
      idempotencyKey: context.idempotencyKey,
      createdAt: now,
      updatedAt: now,
      confirmedAt: now,
      createdBy: context.actorId,
      metadata: command.metadata,
    });

    await repositories.reservations.saveReservation(reservation);

    return { reservation, movement, balance: projectedBalance };
  }

  /**
   * Liberta uma reserva parcial ou totalmente.
   */
  static async release(
    context: InventoryTransactionContext,
    repositories: InventoryRepositoryContext,
    command: ReleaseReservationCommand,
  ): Promise<{
    reservation: InventoryReservation;
    movement: StockMovement;
    balance: InventoryBalance;
  }> {
    const reservation = await repositories.reservations.findById(command.reservationId);
    if (!reservation) {
      throw new InventoryReservationNotFoundError(command.reservationId);
    }

    if (reservation.status !== "active" && reservation.status !== "partially_fulfilled") {
      throw new InventoryReservationStateError(
        command.reservationId,
        reservation.status,
        "release",
      );
    }

    const activeRemaining =
      reservation.quantity - (reservation.fulfilledQuantity + reservation.releasedQuantity);
    const releaseQty = command.quantityToRelease ?? activeRemaining;

    if (releaseQty <= 0 || releaseQty > activeRemaining) {
      throw new InvalidInventoryQuantityError("quantityToRelease", releaseQty);
    }

    const currentBalance = await repositories.balances.findByDimensions({
      tenantId: context.tenantId,
      companyId: context.companyId,
      materialId: reservation.materialId,
      locationId: reservation.locationId,
      stockState: "available",
    });

    // Movimento de libertação de reserva
    const movement = StockMovementFactory.create({
      context,
      materialId: reservation.materialId,
      movementType: "reservation_release",
      sourceLocationId: reservation.locationId,
      quantity: releaseQty,
      stockState: "available",
      metadata: { reservationId: reservation.id, reason: command.reason },
    });

    await repositories.movements.appendMovement(movement);

    const projectedBalance = InventoryBalanceEngine.projectBalance(currentBalance, movement);
    await repositories.balances.storeBalanceProjection(
      projectedBalance,
      currentBalance ? currentBalance.version : null,
    );

    const newReleasedTotal = reservation.releasedQuantity + releaseQty;
    const isFullyReleased =
      reservation.fulfilledQuantity + newReleasedTotal >= reservation.quantity;

    const updatedReservation: InventoryReservation = Object.freeze({
      ...reservation,
      releasedQuantity: newReleasedTotal,
      status: isFullyReleased ? "released" : "partially_fulfilled",
      updatedAt: nowISO(),
      updatedBy: context.actorId,
      cancellationReason: command.reason,
    });

    await repositories.reservations.saveReservation(updatedReservation);

    return { reservation: updatedReservation, movement, balance: projectedBalance };
  }

  /**
   * Consome uma reserva (efetiva o consumo em obra).
   */
  static async consume(
    context: InventoryTransactionContext,
    repositories: InventoryRepositoryContext,
    command: ConsumeReservationCommand,
  ): Promise<{
    reservation: InventoryReservation;
    movement: StockMovement;
    balance: InventoryBalance;
  }> {
    const reservation = await repositories.reservations.findById(command.reservationId);
    if (!reservation) {
      throw new InventoryReservationNotFoundError(command.reservationId);
    }

    if (reservation.status !== "active" && reservation.status !== "partially_fulfilled") {
      throw new InventoryReservationStateError(
        command.reservationId,
        reservation.status,
        "consume",
      );
    }

    const activeRemaining =
      reservation.quantity - (reservation.fulfilledQuantity + reservation.releasedQuantity);
    const consumeQty = command.quantityToConsume ?? activeRemaining;

    if (consumeQty <= 0 || consumeQty > activeRemaining) {
      throw new InvalidInventoryQuantityError("quantityToConsume", consumeQty);
    }

    const currentBalance = await repositories.balances.findByDimensions({
      tenantId: context.tenantId,
      companyId: context.companyId,
      materialId: reservation.materialId,
      locationId: reservation.locationId,
      stockState: "available",
    });

    const currentWac = currentBalance?.averageCost ?? 0;

    // Movimento de consumo (movementType: 'consumption', com marcação metadata de reserva)
    const movement = StockMovementFactory.create({
      context,
      materialId: reservation.materialId,
      movementType: "consumption",
      sourceLocationId: reservation.locationId,
      quantity: consumeQty,
      unitCost: currentWac,
      stockState: "available",
      metadata: {
        ...command.metadata,
        reservationId: reservation.id,
        isReservationConsumption: true,
      },
    });

    await repositories.movements.appendMovement(movement);

    // Ajustar o saldo reduzindo reservedQuantity e onHandQuantity
    // 1. Reduzir reservedQuantity via movimento de transição
    const relMovement = StockMovementFactory.create({
      context,
      materialId: reservation.materialId,
      movementType: "reservation_release",
      sourceLocationId: reservation.locationId,
      quantity: consumeQty,
      stockState: "available",
    });

    const intermediateBalance = InventoryBalanceEngine.projectBalance(currentBalance, relMovement);
    const finalBalance = InventoryBalanceEngine.projectBalance(intermediateBalance, movement);

    await repositories.balances.storeBalanceProjection(
      finalBalance,
      currentBalance ? currentBalance.version : null,
    );

    const newFulfilledTotal = reservation.fulfilledQuantity + consumeQty;
    const isFullyFulfilled =
      newFulfilledTotal + reservation.releasedQuantity >= reservation.quantity;

    const updatedReservation: InventoryReservation = Object.freeze({
      ...reservation,
      fulfilledQuantity: newFulfilledTotal,
      status: isFullyFulfilled ? "fulfilled" : "partially_fulfilled",
      updatedAt: nowISO(),
      updatedBy: context.actorId,
    });

    await repositories.reservations.saveReservation(updatedReservation);

    return { reservation: updatedReservation, movement, balance: finalBalance };
  }
}
