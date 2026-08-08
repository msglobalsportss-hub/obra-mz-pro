/**
 * Serviço de Domínio: WeightedAverageCostCalculator
 * Categoria: core/services
 *
 * Calculador puro de Custo Médio Ponderado (Weighted Average Cost / WAC).
 *
 * REGRAS OBRIGATÓRIAS:
 * 1. Se a quantidade atual em stock for 0, o novo custo médio é IGUAL ao custo unitário de entrada.
 * 2. Saídas de stock NÃO recalculam o custo médio.
 * 3. Quando o stock (onHandQuantity) chega a zero após saídas, o custo médio histórico pode ser preservado;
 *    a entrada seguinte (com quantidade atual = 0) substituirá o custo pelo novo custo unitário.
 * 4. Transferências de entrada participam no cálculo do custo médio usando o custo unitário transportado da origem.
 * 5. Proteção absoluta contra NaN, Infinity, quantidades/custos negativos e divisão por zero.
 * 6. Precisão decimal normalizada (arredondamento a 6 casas decimais) para prevenir erros de ponto flutuante.
 */

import { InvalidInventoryCostError, InvalidInventoryQuantityError } from "../shared/errors";

export interface CalculateWACParams {
  currentQuantity: number;
  currentAverageCost: number;
  incomingQuantity: number;
  incomingUnitCost: number;
  allowZeroCostInbound?: boolean;
}

export class WeightedAverageCostCalculator {
  private static readonly DECIMAL_PRECISION = 6;

  /**
   * Calcula o novo custo médio ponderado após uma entrada de stock.
   */
  static calculateNewAverage(params: CalculateWACParams): number {
    const { currentQuantity, currentAverageCost, incomingQuantity, incomingUnitCost } = params;

    // 1. Guard contra valores numéricos inválidos (NaN, Infinity)
    if (typeof currentQuantity !== "number" || !Number.isFinite(currentQuantity)) {
      throw new InvalidInventoryQuantityError("currentQuantity", currentQuantity);
    }
    if (
      typeof incomingQuantity !== "number" ||
      !Number.isFinite(incomingQuantity) ||
      incomingQuantity <= 0
    ) {
      throw new InvalidInventoryQuantityError("incomingQuantity", incomingQuantity);
    }
    if (
      typeof currentAverageCost !== "number" ||
      !Number.isFinite(currentAverageCost) ||
      currentAverageCost < 0
    ) {
      throw new InvalidInventoryCostError("currentAverageCost", currentAverageCost);
    }
    if (
      typeof incomingUnitCost !== "number" ||
      !Number.isFinite(incomingUnitCost) ||
      incomingUnitCost < 0
    ) {
      throw new InvalidInventoryCostError("incomingUnitCost", incomingUnitCost);
    }

    // 2. Normalizar quantidades negativas acidentais no saldo atual para 0
    const safeCurrentQty = Math.max(0, currentQuantity);
    const safeCurrentAvgCost = safeCurrentQty === 0 ? 0 : currentAverageCost;

    // 3. CASO INICIAL: Se o stock atual for 0, o novo custo médio é o custo de entrada
    if (safeCurrentQty === 0) {
      return this.normalizeDecimal(incomingUnitCost);
    }

    // 4. Cálculo da fórmula do Custo Médio Ponderado:
    // (currentQty × currentAvgCost + incomingQty × incomingUnitCost) / (currentQty + incomingQty)
    const totalCurrentValue = safeCurrentQty * safeCurrentAvgCost;
    const totalIncomingValue = incomingQuantity * incomingUnitCost;
    const newTotalQuantity = safeCurrentQty + incomingQuantity;

    if (newTotalQuantity <= 0) {
      return this.normalizeDecimal(safeCurrentAvgCost);
    }

    const rawNewAverage = (totalCurrentValue + totalIncomingValue) / newTotalQuantity;

    // 5. Verificação final de sanidade e arredondamento normalizado
    if (!Number.isFinite(rawNewAverage) || rawNewAverage < 0) {
      return this.normalizeDecimal(safeCurrentAvgCost);
    }

    return this.normalizeDecimal(rawNewAverage);
  }

  /**
   * Arredonda o valor para 6 casas decimais evitando imprecisões de IEEE 754 (ex: 0.1 + 0.2).
   */
  static normalizeDecimal(value: number): number {
    if (!Number.isFinite(value) || value < 0) return 0;
    const factor = Math.pow(10, this.DECIMAL_PRECISION);
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }
}
