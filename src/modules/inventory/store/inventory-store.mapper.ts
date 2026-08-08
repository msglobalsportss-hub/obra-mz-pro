/**
 * Mapeadores da Store: InventoryStoreMapper
 * Categoria: store
 *
 * Mapeia entidades e projeções do domínio para View Models da UI.
 */

import type {
  InventoryBalance,
  StockMovement,
  InventoryReservation,
  StockTransfer,
  StockAdjustment,
  InventoryLocation,
  InventoryBatch,
} from "../core/domain/entities";
import type {
  InventoryBalanceView,
  StockMovementView,
  InventoryReservationView,
  StockTransferView,
  StockAdjustmentView,
  InventoryLocationView,
  InventoryBatchView,
} from "./inventory-store.types";

export class InventoryStoreMapper {
  static toBalanceView(b: InventoryBalance): InventoryBalanceView {
    return {
      id: b.id,
      tenantId: b.tenantId,
      companyId: b.companyId,
      materialId: b.materialId,
      locationId: b.locationId,
      stockState: b.stockState,
      batchId: b.batchId,
      expirationDate: b.expirationDate,
      onHandQuantity: b.onHandQuantity,
      reservedQuantity: b.reservedQuantity,
      availableQuantity: b.availableQuantity,
      averageCost: b.averageCost,
      totalValue: b.totalValue,
      version: b.version,
      updatedAt: b.updatedAt,
    };
  }

  static toMovementView(m: StockMovement): StockMovementView {
    return {
      id: m.id,
      tenantId: m.tenantId,
      companyId: m.companyId,
      materialId: m.materialId,
      movementType: m.movementType,
      status: m.status,
      sourceLocationId: m.sourceLocationId,
      destinationLocationId: m.destinationLocationId,
      quantity: m.quantity,
      unitCost: m.unitCost,
      totalCost: m.totalCost,
      stockState: m.stockState,
      batchId: m.batchId,
      referenceType: m.referenceType,
      referenceId: m.referenceId,
      correlationId: m.correlationId,
      occurredAt: m.occurredAt,
    };
  }

  static toReservationView(r: InventoryReservation): InventoryReservationView {
    const remaining = r.quantity - (r.fulfilledQuantity + r.releasedQuantity);
    return {
      id: r.id,
      tenantId: r.tenantId,
      companyId: r.companyId,
      materialId: r.materialId,
      locationId: r.locationId,
      quantity: r.quantity,
      fulfilledQuantity: r.fulfilledQuantity,
      releasedQuantity: r.releasedQuantity,
      remainingQuantity: Math.max(0, remaining),
      status: r.status,
      requiredAt: r.requiredAt,
      createdAt: r.createdAt,
    };
  }

  static toTransferView(t: StockTransfer): StockTransferView {
    return {
      id: t.id,
      tenantId: t.tenantId,
      companyId: t.companyId,
      transferNumber: t.transferNumber,
      sourceLocationId: t.sourceLocationId,
      destinationLocationId: t.destinationLocationId,
      status: t.status,
      requestedAt: t.requestedAt,
    };
  }

  static toAdjustmentView(a: StockAdjustment): StockAdjustmentView {
    return {
      id: a.id,
      tenantId: a.tenantId,
      companyId: a.companyId,
      adjustmentNumber: a.adjustmentNumber,
      locationId: a.locationId,
      type: a.type,
      status: a.status,
      reasonCode: a.reasonCode,
      reason: a.reason,
      confirmedAt: a.confirmedAt,
    };
  }

  static toLocationView(l: InventoryLocation): InventoryLocationView {
    return {
      id: l.id,
      tenantId: l.tenantId,
      companyId: l.companyId,
      code: l.code,
      name: l.name,
      type: l.type,
      isActive: l.isActive,
    };
  }

  static toBatchView(b: InventoryBatch): InventoryBatchView {
    return {
      id: b.id,
      tenantId: b.tenantId,
      companyId: b.companyId,
      materialId: b.materialId,
      batchNumber: b.batchNumber,
      status: b.status,
      qualityStatus: b.qualityStatus,
      serialTrackingEnabled: b.serialTrackingEnabled,
    };
  }
}
