/**
 * Contratos de interfaces para os 10 Serviços de Domínio do Inventário.
 * Definições puras em TypeScript, sem implementações simuladas ou classes vazias.
 */

import type { InventoryBalanceDTO, StockOperationResult } from "../contracts/external";
import type { MaterialInventoryPolicy } from "../policies";
import type { InventoryLocationRef } from "../types";
import type { InventoryValidationResult } from "../validation";

export interface IInventoryValidationService {
  validateStockAvailability(
    materialId: string,
    locationRef: InventoryLocationRef,
    quantity: number,
  ): Promise<InventoryValidationResult>;
}

export interface IInventoryMovementService {
  recordMovement(request: unknown): Promise<StockOperationResult>;
}

export interface IInventoryBalanceService {
  getBalance(
    materialId: string,
    locationRef: InventoryLocationRef,
  ): Promise<InventoryBalanceDTO | null>;
  recalculateBalance(
    materialId: string,
    locationRef: InventoryLocationRef,
  ): Promise<InventoryBalanceDTO>;
}

export interface IInventoryCostService {
  calculateUnitCost(
    materialId: string,
    currentStock: number,
    currentCost: number,
    newQty: number,
    newPrice: number,
  ): number;
}

export interface IInventoryReservationService {
  reserveStock(
    materialId: string,
    locationRef: InventoryLocationRef,
    quantity: number,
  ): Promise<StockOperationResult>;
  releaseStock(reservationId: string): Promise<StockOperationResult>;
}

export interface IInventoryTransferService {
  transferStock(
    materialId: string,
    source: InventoryLocationRef,
    destination: InventoryLocationRef,
    quantity: number,
  ): Promise<StockOperationResult>;
}

export interface IInventoryPolicyService {
  getPolicy(materialId: string): Promise<MaterialInventoryPolicy | null>;
}

export interface IInventoryTimelineService {
  getTimelineEvents(materialId: string, locationRef?: InventoryLocationRef): Promise<unknown[]>;
}

export interface IInventoryAuditService {
  auditLocationSchedules(locationRef: InventoryLocationRef): Promise<unknown>;
}

export interface IInventoryHealthService {
  checkSystemIntegrity(): Promise<{
    healthy: boolean;
    issuesFound: number;
    timestamp: string;
  }>;
}
