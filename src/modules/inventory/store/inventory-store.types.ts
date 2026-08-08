/**
 * Tipos da Zustand Store de Inventário — View Models & Store State
 * Categoria: store
 *
 * A Store armazena EXCLUSIVAMENTE View Models para consumo da UI.
 * NENHUMA entidade de domínio nem lógica de negócio reside na Store.
 */

export interface InventoryBalanceView {
  readonly id: string;
  readonly tenantId: string;
  readonly companyId: string;
  readonly materialId: string;
  readonly locationId: string;
  readonly stockState: string;
  readonly batchId?: string;
  readonly expirationDate?: string;
  readonly onHandQuantity: number;
  readonly reservedQuantity: number;
  readonly availableQuantity: number;
  readonly averageCost: number;
  readonly totalValue: number;
  readonly version: number;
  readonly updatedAt: string;
}

export interface StockMovementView {
  readonly id: string;
  readonly tenantId: string;
  readonly companyId: string;
  readonly materialId: string;
  readonly movementType: string;
  readonly status: string;
  readonly sourceLocationId?: string;
  readonly destinationLocationId?: string;
  readonly quantity: number;
  readonly unitCost?: number;
  readonly totalCost?: number;
  readonly stockState: string;
  readonly batchId?: string;
  readonly referenceType: string;
  readonly referenceId: string;
  readonly correlationId: string;
  readonly occurredAt: string;
}

export interface InventoryReservationView {
  readonly id: string;
  readonly tenantId: string;
  readonly companyId: string;
  readonly materialId: string;
  readonly locationId: string;
  readonly quantity: number;
  readonly fulfilledQuantity: number;
  readonly releasedQuantity: number;
  readonly remainingQuantity: number;
  readonly status: string;
  readonly requiredAt?: string;
  readonly createdAt: string;
}

export interface StockTransferView {
  readonly id: string;
  readonly tenantId: string;
  readonly companyId: string;
  readonly transferNumber: string;
  readonly sourceLocationId: string;
  readonly destinationLocationId: string;
  readonly status: string;
  readonly requestedAt: string;
}

export interface StockAdjustmentView {
  readonly id: string;
  readonly tenantId: string;
  readonly companyId: string;
  readonly adjustmentNumber: string;
  readonly locationId: string;
  readonly type: string;
  readonly status: string;
  readonly reasonCode: string;
  readonly reason: string;
  readonly confirmedAt?: string;
}

export interface InventoryLocationView {
  readonly id: string;
  readonly tenantId: string;
  readonly companyId: string;
  readonly code: string;
  readonly name: string;
  readonly type: string;
  readonly isActive: boolean;
}

export interface InventoryBatchView {
  readonly id: string;
  readonly tenantId: string;
  readonly companyId: string;
  readonly materialId: string;
  readonly batchNumber: string;
  readonly status: string;
  readonly qualityStatus?: string;
  readonly serialTrackingEnabled?: boolean;
}

export interface InventoryStoreState {
  readonly tenantId: string | null;
  readonly companyId: string | null;
  readonly schemaVersion: number;

  readonly balances: Record<string, InventoryBalanceView>;
  readonly movements: readonly StockMovementView[];
  readonly reservations: readonly InventoryReservationView[];
  readonly transfers: readonly StockTransferView[];
  readonly adjustments: readonly StockAdjustmentView[];
  readonly locations: readonly InventoryLocationView[];
  readonly batches: readonly InventoryBatchView[];

  readonly loading: boolean;
  readonly initialized: boolean;
  readonly lastSyncAt?: string;
  readonly error?: string;
}
