/**
 * Operação de Domínio: AdjustmentOperation
 * Categoria: core/engine/operations
 *
 * Processa ajustes manuais de inventário e acertos resultantes de contagens físicas (ADR-008).
 *
 * REGRAS OBRIGATÓRIAS:
 * 1. Cada ajuste exige um código de razão (reasonCode) e descrição da razão (reasonDescription).
 * 2. Ajustes positivos criam movimentos de entrada (adjustment_in ou physical_count_in).
 * 3. Ajustes negativos criam movimentos de saída (adjustment_out ou physical_count_out).
 * 4. Ajustes negativos não podem gerar saldo negativo, salvo se permitido pela política de inventário.
 * 5. Ajustes confirmados são irreversíveis por edição direta (requerem movimento compensatório de reversão).
 */

import type { InventoryTransactionContext } from "../../contracts/shared/inventory-transaction-context";
import type { InventoryRepositoryContext } from "../../domain/repositories";
import type { MaterialId, InventoryLocationId, InventoryBatchId } from "../../shared/primitives";
import type {
  InventoryStockState,
  StockAdjustmentReasonCode,
  StockAdjustmentType,
  StockMovementType,
} from "../../types/enums";
import { StockMovementFactory } from "../../domain/factories/stock-movement.factory";
import { InventoryBalanceEngine } from "../inventory-balance-engine";
import type {
  StockMovement,
  InventoryBalance,
  StockAdjustment,
  StockAdjustmentItem,
} from "../../domain/entities";
import { validateNonEmptyId, validatePositiveQuantity } from "../../validation";
import {
  InsufficientStockError,
  InvalidInventoryQuantityError,
  InventoryPolicyViolationError,
} from "../../shared/errors";
import { generateInventoryId, nowISO } from "../../helpers";
import { toStockAdjustmentId, toStockAdjustmentItemId } from "../../shared/primitives";

export interface AdjustmentItemInput {
  readonly materialId: MaterialId;
  readonly quantity: number; // Quantidade da diferença. Positiva = aumento, Negativa = redução
  readonly unitCost?: number;
  readonly stockState?: InventoryStockState;
  readonly batchId?: InventoryBatchId;
  readonly expirationDate?: string;
  readonly notes?: string;
}

export interface AdjustStockCommand {
  readonly locationId: InventoryLocationId;
  readonly adjustmentType: StockAdjustmentType;
  readonly reasonCode: StockAdjustmentReasonCode;
  readonly reasonDescription: string;
  readonly items: readonly AdjustmentItemInput[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface AdjustStockResult {
  readonly adjustment: StockAdjustment;
  readonly items: readonly StockAdjustmentItem[];
  readonly movements: readonly StockMovement[];
  readonly balances: readonly InventoryBalance[];
}

export class AdjustmentOperation {
  static async execute(
    context: InventoryTransactionContext,
    repositories: InventoryRepositoryContext,
    command: AdjustStockCommand,
  ): Promise<AdjustStockResult> {
    const { locationId, adjustmentType, reasonCode, reasonDescription, items } = command;

    // 1. Validações de entrada
    const locErr = validateNonEmptyId(locationId, "locationId");
    if (locErr) throw new Error(locErr.message);

    const rErr = validateNonEmptyId(reasonDescription, "reasonDescription");
    if (rErr)
      throw new InventoryPolicyViolationError(
        "reasonDescription",
        "A razão do ajuste é obrigatória.",
      );

    if (!items || items.length === 0) {
      throw new InventoryPolicyViolationError(
        "items",
        "Pelo menos um item deve ser fornecido para ajuste.",
      );
    }

    const now = nowISO();
    const adjustmentId = toStockAdjustmentId(generateInventoryId("adj"));
    const adjustmentNumber = `ADJ-${Date.now().toString().slice(-6)}`;

    const createdMovements: StockMovement[] = [];
    const updatedBalances: InventoryBalance[] = [];
    const adjustmentItems: StockAdjustmentItem[] = [];

    // 2. Processar cada item do ajuste
    for (const itemInput of items) {
      const { materialId, quantity, unitCost, batchId, expirationDate } = itemInput;
      const stockState = itemInput.stockState ?? "available";

      if (typeof quantity !== "number" || !Number.isFinite(quantity) || quantity === 0) {
        throw new InvalidInventoryQuantityError("quantity", quantity);
      }

      const isPositive = quantity > 0;
      const absQty = Math.abs(quantity);
      const movementType: StockMovementType = isPositive ? "adjustment_in" : "adjustment_out";

      // Buscar saldo atual por dimensões
      const currentBalance = await repositories.balances.findByDimensions({
        tenantId: context.tenantId,
        companyId: context.companyId,
        materialId,
        locationId,
        stockState,
        batchId,
        expirationDate,
      });

      const currentWac = currentBalance?.averageCost ?? 0;
      const available = currentBalance?.availableQuantity ?? 0;
      const systemQty = currentBalance?.onHandQuantity ?? 0;

      // Se for ajuste negativo, validar stock disponível
      if (!isPositive) {
        const policy = await repositories.policies.findByMaterial(
          context.tenantId,
          context.companyId,
          materialId,
          locationId,
        );
        if (!policy?.allowNegativeStock && available < absQty) {
          throw new InsufficientStockError(materialId, locationId, absQty, available);
        }
      }

      // Custo unitário do movimento: se positivo usa unitCost fornecido (ou WAC atual), se negativo usa WAC atual
      const movementUnitCost = isPositive ? (unitCost ?? currentWac) : currentWac;

      // Criar o movimento de ajuste
      const movement = StockMovementFactory.create({
        context,
        materialId,
        movementType,
        sourceLocationId: !isPositive ? locationId : undefined,
        destinationLocationId: isPositive ? locationId : undefined,
        quantity: absQty,
        unitCost: movementUnitCost,
        stockState,
        batchId,
        expirationDate,
        metadata: { ...command.metadata, adjustmentId, reasonCode, reasonDescription },
      });

      await repositories.movements.appendMovement(movement);
      createdMovements.push(movement);

      // Projetar novo saldo
      const projectedBalance = InventoryBalanceEngine.projectBalance(currentBalance, movement);
      await repositories.balances.storeBalanceProjection(
        projectedBalance,
        currentBalance ? currentBalance.version : null,
      );
      updatedBalances.push(projectedBalance);

      // Instanciar o item do documento de ajuste
      const adjItem: StockAdjustmentItem = Object.freeze({
        id: toStockAdjustmentItemId(generateInventoryId("adji")),
        adjustmentId,
        materialId,
        systemQuantity: systemQty,
        countedQuantity: systemQty + quantity,
        differenceQuantity: quantity,
        unitCost: movementUnitCost,
        stockState,
        batchId,
        expirationDate,
        notes: itemInput.notes,
        createdAt: now,
        updatedAt: now,
      });

      await repositories.adjustments.saveItem(adjItem);
      adjustmentItems.push(adjItem);
    }

    // 3. Criar documento de ajuste de inventário
    const adjustment: StockAdjustment = Object.freeze({
      id: adjustmentId,
      tenantId: context.tenantId,
      companyId: context.companyId,
      adjustmentNumber,
      locationId,
      type: adjustmentType,
      status: "confirmed",
      reasonCode,
      reason: reasonDescription,
      correlationId: context.correlationId,
      idempotencyKey: context.idempotencyKey,
      requestedAt: now,
      confirmedAt: now,
      requestedBy: context.actorId,
      confirmedBy: context.actorId,
      createdAt: now,
      updatedAt: now,
    });

    await repositories.adjustments.saveAdjustment(adjustment);

    return {
      adjustment,
      items: adjustmentItems,
      movements: createdMovements,
      balances: updatedBalances,
    };
  }
}
