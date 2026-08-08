/**
 * Operação de Domínio: ReverseMovementOperation
 * Categoria: core/engine/operations
 *
 * Processa a reversão (estorno) de um movimento de stock através de um movimento compensatório.
 *
 * REGRAS INVIOLÁVEIS (ADR-002, ADR-003):
 * 1. O movimento original confirmado NUNCA é alterado nem eliminado.
 * 2. É criado um NOVO movimento (movementType: 'reversal') que reverte o efeito quantitativo original.
 * 3. O novo movimento contém o campo reversalOfMovementId referente ao movimento original.
 * 4. Um movimento não pode ser estornado duas vezes (InventoryMovementAlreadyReversedError).
 */

import type { InventoryTransactionContext } from "../../contracts/shared/inventory-transaction-context";
import type { InventoryRepositoryContext } from "../../domain/repositories";
import type { StockMovementId } from "../../shared/primitives";
import { StockMovementFactory } from "../../domain/factories/stock-movement.factory";
import { InventoryBalanceEngine } from "../inventory-balance-engine";
import type { StockMovement, InventoryBalance } from "../../domain/entities";
import {
  InventoryMovementAlreadyReversedError,
  InventoryPolicyViolationError,
} from "../../shared/errors";

export interface ReverseMovementCommand {
  readonly movementIdToReverse: StockMovementId;
  readonly reason: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface ReverseMovementResult {
  readonly originalMovement: StockMovement;
  readonly reversalMovement: StockMovement;
  readonly balance: InventoryBalance;
}

export class ReverseMovementOperation {
  static async execute(
    context: InventoryTransactionContext,
    repositories: InventoryRepositoryContext,
    command: ReverseMovementCommand,
  ): Promise<ReverseMovementResult> {
    const { movementIdToReverse, reason } = command;

    // 1. Buscar o movimento original a reverter
    const original = await repositories.movements.findById(movementIdToReverse);
    if (!original) {
      throw new InventoryPolicyViolationError(
        "movementIdToReverse",
        `Movimento original '${movementIdToReverse}' não encontrado.`,
      );
    }

    // 2. Validar se o movimento pertence ao mesmo tenant/company
    if (original.tenantId !== context.tenantId || original.companyId !== context.companyId) {
      throw new InventoryPolicyViolationError(
        "tenantId/companyId",
        "O movimento pertence a uma empresa/tenant diferente do contexto.",
      );
    }

    // 3. Validar se já foi estornado anteriormente
    if (original.reversedByMovementId) {
      throw new InventoryMovementAlreadyReversedError(original.id, original.reversedByMovementId);
    }

    // 4. Inverter o efeito físico: determinar origem/destino compensatórios
    const isOriginalEntry = Boolean(original.destinationLocationId && !original.sourceLocationId);
    const targetLocationId = isOriginalEntry
      ? original.destinationLocationId!
      : original.sourceLocationId!;

    // 5. Criar o movimento compensatório (movementType: 'reversal')
    const reversalMovement = StockMovementFactory.create({
      context,
      materialId: original.materialId,
      movementType: "reversal",
      sourceLocationId: isOriginalEntry ? targetLocationId : undefined,
      destinationLocationId: !isOriginalEntry ? targetLocationId : undefined,
      quantity: original.quantity,
      unitCost: original.unitCost,
      stockState: original.stockState,
      batchId: original.batchId,
      expirationDate: original.expirationDate,
      reversalOfMovementId: original.id,
      metadata: { ...command.metadata, originalMovementId: original.id, reversalReason: reason },
    });

    // 6. Persistir o novo movimento compensatório e marcar o original como revertido
    await repositories.movements.appendMovement(reversalMovement);
    const updatedOriginal: StockMovement = Object.freeze({
      ...original,
      reversedByMovementId: reversalMovement.id,
    });
    await repositories.movements.appendMovement(updatedOriginal);

    // 7. Buscar o saldo atual e projetar a inversão
    const currentBalance = await repositories.balances.findByDimensions({
      tenantId: context.tenantId,
      companyId: context.companyId,
      materialId: original.materialId,
      locationId: targetLocationId,
      stockState: original.stockState,
      batchId: original.batchId,
      expirationDate: original.expirationDate,
    });

    const projectedBalance = InventoryBalanceEngine.projectBalance(
      currentBalance,
      reversalMovement,
    );
    await repositories.balances.storeBalanceProjection(
      projectedBalance,
      currentBalance ? currentBalance.version : null,
    );

    return {
      originalMovement: original,
      reversalMovement,
      balance: projectedBalance,
    };
  }
}
