/**
 * Operação de Domínio: TransferStockOperation
 * Categoria: core/engine/operations
 *
 * Processa a transferência de materiais entre duas localizações distintas.
 *
 * REGRAS ARQUITETURAIS DE TRANSFERÊNCIA (Refinamentos 7 e 8):
 * 1. Gera DOIS movimentos emparelhados: TRANSFER_OUT na origem e TRANSFER_IN no destino.
 * 2. Origem e destino NÃO podem ser iguais.
 * 3. TRANSFER_OUT utiliza o custo médio atual da origem.
 * 4. TRANSFER_IN entra no destino transportando o MESMO custo unitário que saiu da origem.
 * 5. No destino, a entrada participa no Weighted Average Cost junto do saldo já existente no destino.
 *    NÃO copia cegamente o custo da origem como o novo custo do destino.
 * 6. O valor total que sai da origem (quantity × cost) é igual ao valor total que entra no destino.
 * 7. Ambos os movimentos partilham o mesmo correlationId e referência da transferência.
 * 8. Aoperação é 100% atómica dentro da Unit of Work: se o lado do destino falhar, a saída da origem sofre rollback.
 */

import type { InventoryTransactionContext } from "../../contracts/shared/inventory-transaction-context";
import type { InventoryRepositoryContext } from "../../domain/repositories";
import type { MaterialId, InventoryLocationId, InventoryBatchId } from "../../shared/primitives";
import type { InventoryStockState } from "../../types/enums";
import { StockMovementFactory } from "../../domain/factories/stock-movement.factory";
import { BalanceKeyResolver } from "../../services/balance-key-resolver";
import { InventoryBalanceEngine } from "../inventory-balance-engine";
import type { StockMovement, InventoryBalance } from "../../domain/entities";
import {
  validateNonEmptyId,
  validatePositiveQuantity,
  validateSourceDifferentFromDestination,
} from "../../validation";
import {
  InsufficientStockError,
  InvalidInventoryQuantityError,
  InventoryTransferValidationError,
} from "../../shared/errors";

export interface TransferStockCommand {
  readonly materialId: MaterialId;
  readonly sourceLocationId: InventoryLocationId;
  readonly destinationLocationId: InventoryLocationId;
  readonly quantity: number;
  readonly batchId?: InventoryBatchId;
  readonly expirationDate?: string;
  readonly stockState?: InventoryStockState;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface TransferStockResult {
  readonly transferOutMovement: StockMovement;
  readonly transferInMovement: StockMovement;
  readonly sourceBalance: InventoryBalance;
  readonly destinationBalance: InventoryBalance;
}

export class TransferStockOperation {
  static async execute(
    context: InventoryTransactionContext,
    repositories: InventoryRepositoryContext,
    command: TransferStockCommand,
  ): Promise<TransferStockResult> {
    const {
      materialId,
      sourceLocationId,
      destinationLocationId,
      quantity,
      batchId,
      expirationDate,
    } = command;
    const stockState = command.stockState ?? "available";

    // 1. Validações de Identificadores e Quantidades
    const matErr = validateNonEmptyId(materialId, "materialId");
    if (matErr) throw new Error(matErr.message);

    const srcErr = validateNonEmptyId(sourceLocationId, "sourceLocationId");
    if (srcErr) throw new Error(srcErr.message);

    const dstErr = validateNonEmptyId(destinationLocationId, "destinationLocationId");
    if (dstErr) throw new Error(dstErr.message);

    const sameErr = validateSourceDifferentFromDestination(sourceLocationId, destinationLocationId);
    if (sameErr) throw new InventoryTransferValidationError(sameErr.message);

    const qErr = validatePositiveQuantity(quantity, "quantity");
    if (qErr) throw new InvalidInventoryQuantityError("quantity", quantity);

    // 1b. Validar existência e estado ativo da localização de destino
    const dstLoc = await repositories.locations.findById(destinationLocationId);
    if (
      !dstLoc ||
      !dstLoc.isActive ||
      dstLoc.tenantId !== context.tenantId ||
      dstLoc.companyId !== context.companyId
    ) {
      throw new InventoryTransferValidationError(
        `A localização de destino '${destinationLocationId}' não existe, está inativa ou pertence a outra empresa.`,
      );
    }

    // 2. Buscar saldo atual na origem
    const sourceCurrentBalance = await repositories.balances.findByDimensions({
      tenantId: context.tenantId,
      companyId: context.companyId,
      materialId,
      locationId: sourceLocationId,
      stockState,
      batchId,
      expirationDate,
    });

    const sourceAvailable = sourceCurrentBalance?.availableQuantity ?? 0;
    const sourceWac = sourceCurrentBalance?.averageCost ?? 0;

    // 3. Consultar política de saldo negativo na origem
    const policy = await repositories.policies.findByMaterial(
      context.tenantId,
      context.companyId,
      materialId,
      sourceLocationId,
    );
    if (!policy?.allowNegativeStock && sourceAvailable < quantity) {
      throw new InsufficientStockError(materialId, sourceLocationId, quantity, sourceAvailable);
    }

    // 4. Criar movimento de saída na origem (TRANSFER_OUT)
    const transferOutMovement = StockMovementFactory.create({
      context,
      materialId,
      movementType: "transfer_out",
      sourceLocationId,
      destinationLocationId,
      quantity,
      unitCost: sourceWac,
      stockState,
      batchId,
      expirationDate,
      metadata: { ...command.metadata, transferDirection: "outbound" },
    });

    // 5. Criar movimento de entrada no destino (TRANSFER_IN) transportando o MESMO custo da origem
    const transferInMovement = StockMovementFactory.create({
      context,
      materialId,
      movementType: "transfer_in",
      sourceLocationId,
      destinationLocationId,
      quantity,
      unitCost: sourceWac, // Custo transportado da origem!
      stockState,
      batchId,
      expirationDate,
      metadata: {
        ...command.metadata,
        transferDirection: "inbound",
        pairedMovementId: transferOutMovement.id,
      },
    });

    // 6. Persistir ambos os movimentos no repositório
    await repositories.movements.appendMovement(transferOutMovement);
    await repositories.movements.appendMovement(transferInMovement);

    // 7. Atualizar saldo da origem
    const newSourceBalance = InventoryBalanceEngine.projectBalance(
      sourceCurrentBalance,
      transferOutMovement,
    );
    const expectedSourceVersion = sourceCurrentBalance ? sourceCurrentBalance.version : null;
    await repositories.balances.storeBalanceProjection(newSourceBalance, expectedSourceVersion);

    // 8. Buscar saldo atual no destino
    const destCurrentBalance = await repositories.balances.findByDimensions({
      tenantId: context.tenantId,
      companyId: context.companyId,
      materialId,
      locationId: destinationLocationId,
      stockState,
      batchId,
      expirationDate,
    });

    // 9. Atualizar saldo no destino (InventoryBalanceEngine recalculará WAC do destino com o custo vindo da origem)
    const newDestBalance = InventoryBalanceEngine.projectBalance(
      destCurrentBalance,
      transferInMovement,
    );
    const expectedDestVersion = destCurrentBalance ? destCurrentBalance.version : null;
    await repositories.balances.storeBalanceProjection(newDestBalance, expectedDestVersion);

    return {
      transferOutMovement,
      transferInMovement,
      sourceBalance: newSourceBalance,
      destinationBalance: newDestBalance,
    };
  }
}
