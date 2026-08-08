/**
 * Selectors Puros da Store: inventorySelectors
 * Categoria: store
 *
 * SELECTORS PUROS PARA CONSUMO DA UI.
 *
 * REGRAS:
 * 1. Não alteram estado.
 * 2. Não persistem dados.
 * 3. Não chamam o Engine.
 * 4. Puros e memoizáveis.
 */

import type {
  InventoryStoreState,
  InventoryBalanceView,
  StockMovementView,
} from "./inventory-store.types";

export class InventorySelectors {
  /** Busca todos os saldos de um material específico */
  static selectBalancesByMaterial(
    state: InventoryStoreState,
    materialId: string,
  ): readonly InventoryBalanceView[] {
    return Object.values(state.balances).filter((b) => b.materialId === materialId);
  }

  /** Busca o saldo de um material numa localização específica */
  static selectBalanceByLocation(
    state: InventoryStoreState,
    materialId: string,
    locationId: string,
    stockState = "available",
  ): InventoryBalanceView | null {
    const key = `${materialId}:${locationId}:${stockState}`;
    return state.balances[key] ?? null;
  }

  /** Retorna a quantidade de stock disponível de um material numa localização */
  static selectAvailableQuantity(
    state: InventoryStoreState,
    materialId: string,
    locationId: string,
  ): number {
    const balance = this.selectBalanceByLocation(state, materialId, locationId);
    return balance ? balance.availableQuantity : 0;
  }

  /** Retorna a quantidade reservada de um material numa localização */
  static selectReservedQuantity(
    state: InventoryStoreState,
    materialId: string,
    locationId: string,
  ): number {
    const balance = this.selectBalanceByLocation(state, materialId, locationId);
    return balance ? balance.reservedQuantity : 0;
  }

  /** Retorna a lista de saldos com stock abaixo do mínimo especificado */
  static selectLowStockBalances(
    state: InventoryStoreState,
    minThreshold: number,
  ): readonly InventoryBalanceView[] {
    return Object.values(state.balances).filter(
      (b) => b.availableQuantity > 0 && b.availableQuantity <= minThreshold,
    );
  }

  /** Retorna a lista de saldos totalmente esgotados (availableQuantity === 0) */
  static selectOutOfStockBalances(state: InventoryStoreState): readonly InventoryBalanceView[] {
    return Object.values(state.balances).filter((b) => b.onHandQuantity === 0);
  }

  /** Calcula o valor financeiro total do inventário em stock */
  static selectTotalInventoryValue(state: InventoryStoreState): number {
    return Object.values(state.balances).reduce((sum, b) => sum + (b.totalValue ?? 0), 0);
  }

  /** Busca movimentos de um determinado material */
  static selectMovementsByMaterial(
    state: InventoryStoreState,
    materialId: string,
  ): readonly StockMovementView[] {
    return state.movements.filter((m) => m.materialId === materialId);
  }

  /** Busca movimentos por ID de referência de negócio (ex: deliveryId, POId) */
  static selectMovementsByReference(
    state: InventoryStoreState,
    referenceId: string,
  ): readonly StockMovementView[] {
    return state.movements.filter((m) => m.referenceId === referenceId);
  }
}
