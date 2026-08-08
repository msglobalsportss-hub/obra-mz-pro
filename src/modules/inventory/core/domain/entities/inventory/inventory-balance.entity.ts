/**
 * Entidade de Domínio: InventoryBalance — READ MODEL
 * Categoria: State / Inventory
 *
 * Representa o saldo persistido e reconstruível de um material numa
 * combinação específica de dimensões (ADR-006).
 */

import type {
  InventoryBalanceId,
  StockMovementId,
  TenantId,
  CompanyId,
  MaterialId,
  InventoryLocationId,
  InventoryBatchId,
} from "../../../shared/primitives";
import type { ISO8601String, MoneyAmount, Quantity, UnitPrice } from "../../../types/aliases";
import type { InventoryStockState } from "../../../types/enums";

/**
 * Dimensões que compõem a chave lógica única de um saldo de inventário.
 * Utilizado pelo helper buildBalanceDimensionKey().
 */
export interface InventoryBalanceDimensions {
  readonly tenantId: TenantId;
  readonly companyId: CompanyId;
  readonly materialId: MaterialId;
  readonly locationId: InventoryLocationId;
  readonly stockState: InventoryStockState;
  readonly batchId?: InventoryBatchId;
  readonly expirationDate?: ISO8601String;
}

export interface InventoryBalance {
  readonly id: InventoryBalanceId;
  readonly tenantId: TenantId;
  readonly companyId: CompanyId;

  readonly materialId: MaterialId;
  readonly locationId: InventoryLocationId;

  readonly stockState: InventoryStockState;

  readonly batchId?: InventoryBatchId;
  readonly expirationDate?: ISO8601String;

  readonly onHandQuantity: Quantity;
  readonly reservedQuantity: Quantity;
  readonly availableQuantity: Quantity;

  readonly averageCost: UnitPrice;
  readonly totalValue: MoneyAmount;

  readonly lastMovementId?: StockMovementId;
  readonly lastMovementAt?: ISO8601String;

  readonly version: number;

  readonly createdAt: ISO8601String;
  readonly updatedAt: ISO8601String;
}
