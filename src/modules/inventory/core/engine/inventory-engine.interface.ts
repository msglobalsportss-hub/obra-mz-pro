/**
 * Contrato de Interface do Inventory Engine (IInventoryEngine).
 * Único ponto de orquestração e controlo de estado do Inventário.
 */

import type { InventoryBalanceDTO, StockOperationResult } from "../contracts/external";
import type { InventoryLocationRef } from "../types";

export interface IInventoryEngine {
  /**
   * Processa uma entrada de stock.
   */
  processStockEntry(request: unknown): Promise<StockOperationResult>;

  /**
   * Processa uma saída ou consumo de stock.
   */
  processStockConsumption(request: unknown): Promise<StockOperationResult>;

  /**
   * Processa uma transferência de stock entre localizações.
   */
  processStockTransfer(request: unknown): Promise<StockOperationResult>;

  /**
   * Processa uma reserva de material.
   */
  processStockReservation(request: unknown): Promise<StockOperationResult>;

  /**
   * Processa um ajuste manual ou inventário físico.
   */
  processStockAdjustment(request: unknown): Promise<StockOperationResult>;

  /**
   * Obtém o saldo em tempo real para um determinado material e localização.
   */
  getBalance(
    materialId: string,
    locationRef: InventoryLocationRef,
  ): Promise<InventoryBalanceDTO | null>;
}
