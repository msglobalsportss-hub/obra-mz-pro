/**
 * Operação de Domínio: ReceiveStockOperation
 * Categoria: core/engine/operations
 *
 * Processa entradas de stock por receção de compras, entregas, saldos de abertura ou ajustes de entrada.
 * Suporta operações unitárias e operações em lote atómicas (receiveStockBatch).
 */

import type { InventoryTransactionContext } from "../../contracts/shared/inventory-transaction-context";
import type { InventoryRepositoryContext } from "../../domain/repositories";
import type { MaterialId, InventoryLocationId, InventoryBatchId } from "../../shared/primitives";
import type { InventoryStockState, StockMovementType } from "../../types/enums";
import { StockMovementFactory } from "../../domain/factories/stock-movement.factory";
import { BalanceKeyResolver } from "../../services/balance-key-resolver";
import { InventoryBalanceEngine } from "../inventory-balance-engine";
import type { StockMovement, InventoryBalance } from "../../domain/entities";
import {
  validateNonEmptyId,
  validatePositiveQuantity,
  validateNonNegativePrice,
} from "../../validation";
import { InvalidInventoryCostError, InvalidInventoryQuantityError } from "../../shared/errors";

export interface ReceiveStockItemCommand {
  readonly materialId: MaterialId;
  readonly locationId: InventoryLocationId;
  readonly quantity: number;
  readonly unitCost: number;
  readonly movementType?: StockMovementType;
  readonly batchId?: InventoryBatchId;
  readonly expirationDate?: string;
  readonly stockState?: InventoryStockState;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface ReceiveStockResult {
  readonly movements: readonly StockMovement[];
  readonly balances: readonly InventoryBalance[];
}

export class ReceiveStockOperation {
  /**
   * Executa a receção de um único item dentro do contexto de repositórios/UoW.
   */
  static async executeSingle(
    context: InventoryTransactionContext,
    repositories: InventoryRepositoryContext,
    command: ReceiveStockItemCommand,
  ): Promise<ReceiveStockResult> {
    return this.executeBatch(context, repositories, [command]);
  }

  /**
   * REGRA DE ATOMICIDADE BATCH (Refinamento 8):
   * Executa a receção de múltiplas linhas de stock numa ÚNICA transação atómica.
   * 1. Todas as linhas são validadas PRIMEIRO antes de qualquer escrita.
   * 2. Se qualquer linha falhar a validação, NENHUM movimento é criado (all-or-nothing).
   */
  static async executeBatch(
    context: InventoryTransactionContext,
    repositories: InventoryRepositoryContext,
    commands: readonly ReceiveStockItemCommand[],
  ): Promise<ReceiveStockResult> {
    if (commands.length === 0) {
      return { movements: [], balances: [] };
    }

    // PHASE 1: VALIDAÇÕES (Todas as linhas antes de qualquer alteração)
    for (let i = 0; i < commands.length; i++) {
      const cmd = commands[i]!;
      const matErr = validateNonEmptyId(cmd.materialId, `commands[${i}].materialId`);
      if (matErr) throw new Error(matErr.message);

      const locErr = validateNonEmptyId(cmd.locationId, `commands[${i}].locationId`);
      if (locErr) throw new Error(locErr.message);

      const qErr = validatePositiveQuantity(cmd.quantity, `commands[${i}].quantity`);
      if (qErr) throw new InvalidInventoryQuantityError(qErr.field, cmd.quantity);

      const cErr = validateNonNegativePrice(cmd.unitCost, `commands[${i}].unitCost`);
      if (cErr) throw new InvalidInventoryCostError(cErr.field, cmd.unitCost);

      // Validar localização ativa e pertencente ao tenant/company
      const loc = await repositories.locations.findById(cmd.locationId);
      if (
        loc &&
        (!loc.isActive || loc.tenantId !== context.tenantId || loc.companyId !== context.companyId)
      ) {
        throw new Error(
          `A localização ${cmd.locationId} está inativa ou não pertence à empresa do contexto.`,
        );
      }
    }

    // PHASE 2: PROCESSAMENTO DAS LINHAS
    const createdMovements: StockMovement[] = [];
    const updatedBalances: InventoryBalance[] = [];

    for (const cmd of commands) {
      const movementType = cmd.movementType ?? "delivery_receipt";

      // 1. Criar o movimento imutável via Factory
      const movement = StockMovementFactory.create({
        context,
        materialId: cmd.materialId,
        movementType,
        destinationLocationId: cmd.locationId,
        quantity: cmd.quantity,
        unitCost: cmd.unitCost,
        stockState: cmd.stockState ?? "available",
        batchId: cmd.batchId,
        expirationDate: cmd.expirationDate,
        metadata: cmd.metadata,
      });

      // 2. Persistir o movimento (append-only)
      await repositories.movements.appendMovement(movement);
      createdMovements.push(movement);

      // 3. Resolver a chave de saldo determinística
      const balanceKey = BalanceKeyResolver.resolveKey({
        tenantId: context.tenantId,
        companyId: context.companyId,
        materialId: cmd.materialId,
        locationId: cmd.locationId,
        stockState: cmd.stockState ?? "available",
        batchId: cmd.batchId,
        expirationDate: cmd.expirationDate,
      });

      // 4. Buscar saldo atual por dimensões
      const currentBalance = await repositories.balances.findByDimensions({
        tenantId: context.tenantId,
        companyId: context.companyId,
        materialId: cmd.materialId,
        locationId: cmd.locationId,
        stockState: cmd.stockState ?? "available",
        batchId: cmd.batchId,
        expirationDate: cmd.expirationDate,
      });

      // 5. Projetar novo saldo usando InventoryBalanceEngine
      const projectedBalance = InventoryBalanceEngine.projectBalance(currentBalance, movement);

      // 6. Armazenar a projeção do saldo (com verificação de versão para Optimistic Concurrency)
      const expectedVersion = currentBalance ? currentBalance.version : null;
      await repositories.balances.storeBalanceProjection(projectedBalance, expectedVersion);
      updatedBalances.push(projectedBalance);
    }

    return {
      movements: createdMovements,
      balances: updatedBalances,
    };
  }
}
