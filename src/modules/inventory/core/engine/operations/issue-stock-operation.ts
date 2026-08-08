/**
 * Operação de Domínio: IssueStockOperation
 * Categoria: core/engine/operations
 *
 * Processa saídas de stock por consumo em obra, devolução a fornecedor, abate ou danos.
 * Valida a disponibilidade física e política de saldo negativo antes da execução.
 */

import type { InventoryTransactionContext } from "../../contracts/shared/inventory-transaction-context";
import type { InventoryRepositoryContext } from "../../domain/repositories";
import type { MaterialId, InventoryLocationId, InventoryBatchId } from "../../shared/primitives";
import type { InventoryStockState, StockMovementType } from "../../types/enums";
import { StockMovementFactory } from "../../domain/factories/stock-movement.factory";
import { BalanceKeyResolver } from "../../services/balance-key-resolver";
import { InventoryBalanceEngine } from "../inventory-balance-engine";
import type { StockMovement, InventoryBalance } from "../../domain/entities";
import { validateNonEmptyId, validatePositiveQuantity } from "../../validation";
import {
  InsufficientStockError,
  InvalidInventoryQuantityError,
  InventoryPolicyViolationError,
} from "../../shared/errors";

export interface IssueStockCommand {
  readonly materialId: MaterialId;
  readonly locationId: InventoryLocationId;
  readonly quantity: number;
  readonly movementType?: StockMovementType;
  readonly batchId?: InventoryBatchId;
  readonly expirationDate?: string;
  readonly stockState?: InventoryStockState;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface IssueStockResult {
  readonly movement: StockMovement;
  readonly balance: InventoryBalance;
}

export class IssueStockOperation {
  /**
   * Executa a saída de stock com validação de stock suficiente.
   */
  static async execute(
    context: InventoryTransactionContext,
    repositories: InventoryRepositoryContext,
    command: IssueStockCommand,
  ): Promise<IssueStockResult> {
    const { materialId, locationId, quantity, batchId, expirationDate } = command;
    const stockState = command.stockState ?? "available";
    const movementType = command.movementType ?? "consumption";

    // 1. Validações básicas
    const matErr = validateNonEmptyId(materialId, "materialId");
    if (matErr) throw new Error(matErr.message);

    const locErr = validateNonEmptyId(locationId, "locationId");
    if (locErr) throw new Error(locErr.message);

    const qErr = validatePositiveQuantity(quantity, "quantity");
    if (qErr) throw new InvalidInventoryQuantityError("quantity", quantity);

    // 2. Buscar saldo atual por dimensões
    const currentBalance = await repositories.balances.findByDimensions({
      tenantId: context.tenantId,
      companyId: context.companyId,
      materialId,
      locationId,
      stockState,
      batchId,
      expirationDate,
    });

    const onHand = currentBalance?.onHandQuantity ?? 0;
    const available = currentBalance?.availableQuantity ?? 0;
    const currentWac = currentBalance?.averageCost ?? 0;

    // 3. Consultar política de inventário para saldo negativo
    const policy = await repositories.policies.findByMaterial(
      context.tenantId,
      context.companyId,
      materialId,
      locationId,
    );
    const allowNegative = policy?.allowNegativeStock ?? false;

    // 4. Validar se há stock físico e disponível suficiente
    if (!allowNegative && available < quantity) {
      throw new InsufficientStockError(materialId, locationId, quantity, available);
    }

    // 5. Criar o movimento de saída usando o WAC atual do saldo (saídas não recalculam WAC)
    const movement = StockMovementFactory.create({
      context,
      materialId,
      movementType,
      sourceLocationId: locationId,
      quantity,
      unitCost: currentWac,
      stockState,
      batchId,
      expirationDate,
      metadata: command.metadata,
    });

    // 6. Persistir movimento (append-only)
    await repositories.movements.appendMovement(movement);

    // 7. Projetar novo saldo usando o Engine
    const projectedBalance = InventoryBalanceEngine.projectBalance(currentBalance, movement);

    // 8. Armazenar projeção com verificação de versão
    const expectedVersion = currentBalance ? currentBalance.version : null;
    await repositories.balances.storeBalanceProjection(projectedBalance, expectedVersion);

    return {
      movement,
      balance: projectedBalance,
    };
  }
}
