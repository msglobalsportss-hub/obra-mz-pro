/**
 * Motor de Projeção de Saldos: InventoryBalanceEngine
 * Categoria: core/engine
 *
 * FUNÇÃO PURA DE PROJEÇÃO DETERMINÍSTICA DE SALDO (READ MODEL)
 *
 * REGRAS INVIOLÁVEIS:
 * 1. É uma função pura: não acede a repositórios, não altera a Store, não publica eventos.
 * 2. Recebe o saldo atual (ou null se for o primeiro movimento daquela dimensão) e um StockMovement.
 * 3. Retorna uma nova entidade InventoryBalance projetada com a versão incrementada (version + 1).
 * 4. Calcula availableQuantity = onHandQuantity - reservedQuantity.
 * 5. Utiliza o WeightedAverageCostCalculator para atualizar o custo médio em entradas e preservá-lo em saídas.
 */

import type { InventoryBalance, StockMovement } from "../domain/entities";
import type { InventoryBalanceId } from "../shared/primitives";
import { toInventoryBalanceId } from "../shared/primitives";
import { WeightedAverageCostCalculator } from "../services/weighted-average-cost-calculator";
import { BalanceKeyResolver } from "../services/balance-key-resolver";
import { generateInventoryId, nowISO } from "../helpers";
import { InsufficientStockError } from "../shared/errors";

export class InventoryBalanceEngine {
  /**
   * Projeta um novo saldo a partir de um saldo atual e de um novo movimento de stock.
   */
  static projectBalance(
    currentBalance: InventoryBalance | null,
    movement: StockMovement,
  ): InventoryBalance {
    const now = nowISO();

    // 1. Quantidades iniciais
    let onHand = currentBalance?.onHandQuantity ?? 0;
    let reserved = currentBalance?.reservedQuantity ?? 0;
    let currentAvgCost = currentBalance?.averageCost ?? 0;

    const movementQty = movement.quantity;
    const movementCost = movement.unitCost ?? 0;

    // 2. Processar a direção do movimento conforme o movementType
    switch (movement.movementType) {
      // --- ENTRADAS (Aumentam onHand, Recalculam Custo Médio Ponderado) ---
      case "opening_balance":
      case "purchase_receipt":
      case "delivery_receipt":
      case "transfer_in":
      case "adjustment_in":
      case "physical_count_in":
      case "return_in": {
        // Recalcular Custo Médio Ponderado ANTES de somar a quantidade ao onHand
        currentAvgCost = WeightedAverageCostCalculator.calculateNewAverage({
          currentQuantity: onHand,
          currentAverageCost: currentAvgCost,
          incomingQuantity: movementQty,
          incomingUnitCost: movementCost,
        });
        onHand += movementQty;
        break;
      }

      // --- SAÍDAS (Reduzem onHand, Preservam Custo Médio Ponderado) ---
      case "consumption":
      case "transfer_out":
      case "return_out":
      case "adjustment_out":
      case "physical_count_out":
      case "damage":
      case "disposal": {
        onHand -= movementQty;
        break;
      }

      // --- RESERVAS (Afetam apenas reservedQuantity, NÃO alteram onHand) ---
      case "reservation": {
        reserved += movementQty;
        break;
      }

      case "reservation_release": {
        reserved = Math.max(0, reserved - movementQty);
        break;
      }

      // --- CONSUMO DE RESERVA (Reduz tanto reserved quanto onHand) ---
      case "reversal":
      case "correction": {
        // Para reversões/correções, a direção depende se foi entrada ou saída na criação original
        if (movement.destinationLocationId && !movement.sourceLocationId) {
          // Reversão de saída -> Entrada compensatória
          currentAvgCost = WeightedAverageCostCalculator.calculateNewAverage({
            currentQuantity: onHand,
            currentAverageCost: currentAvgCost,
            incomingQuantity: movementQty,
            incomingUnitCost: movementCost,
          });
          onHand += movementQty;
        } else {
          // Reversão de entrada -> Saída compensatória
          onHand -= movementQty;
        }
        break;
      }
    }

    // 3. Normalização de zero físico e preservação de custo histórico
    if (onHand < 0) {
      // Se a política não permitir saldo negativo, a validação já terá barrado.
      // Caso chegue aqui por arredondamentos, garantir que não fica menor que 0.
      onHand = 0;
    }

    // 4. Derivar stock disponível: availableQuantity = onHandQuantity - reservedQuantity
    const available = onHand - reserved;

    // 5. Calcular valor total do saldo: totalValue = onHandQuantity × averageCost
    const normalizedAvgCost = WeightedAverageCostCalculator.normalizeDecimal(currentAvgCost);
    const totalValue = WeightedAverageCostCalculator.normalizeDecimal(onHand * normalizedAvgCost);

    // 6. Incrementar versão para Optimistic Concurrency Control
    const nextVersion = (currentBalance?.version ?? 0) + 1;

    const balanceId: InventoryBalanceId =
      currentBalance?.id ?? toInventoryBalanceId(generateInventoryId("bal"));

    // 7. Resolver a localização relevante (source para saídas/transfer_out, destination para entradas/transfer_in)
    const isOutboundType = [
      "transfer_out",
      "consumption",
      "return_out",
      "adjustment_out",
      "physical_count_out",
      "damage",
      "disposal",
      "reservation",
      "reservation_release",
    ].includes(movement.movementType);

    const targetLocationId = isOutboundType
      ? (movement.sourceLocationId ?? movement.destinationLocationId!)
      : (movement.destinationLocationId ?? movement.sourceLocationId!);

    const projected: InventoryBalance = {
      id: balanceId,
      tenantId: movement.tenantId,
      companyId: movement.companyId,
      materialId: movement.materialId,
      locationId: targetLocationId,
      stockState: movement.stockState ?? "available",
      batchId: movement.batchId,
      expirationDate: movement.expirationDate,
      onHandQuantity: WeightedAverageCostCalculator.normalizeDecimal(onHand),
      reservedQuantity: WeightedAverageCostCalculator.normalizeDecimal(reserved),
      availableQuantity: WeightedAverageCostCalculator.normalizeDecimal(available),
      averageCost: normalizedAvgCost,
      totalValue,
      lastMovementId: movement.id,
      lastMovementAt: movement.occurredAt ?? now,
      version: nextVersion,
      createdAt: currentBalance?.createdAt ?? now,
      updatedAt: now,
    };

    return Object.freeze(projected);
  }
}
