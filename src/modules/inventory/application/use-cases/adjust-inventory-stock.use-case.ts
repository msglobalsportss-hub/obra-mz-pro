/**
 * Caso de Uso: AdjustInventoryStockUseCase
 * Categoria: application/use-cases
 */

import type { IInventoryEngine } from "../../core/engine/inventory-engine";
import type { AdjustStockInputDTO, InventoryExecutionOutputDTO } from "../dto/inventory-dto";
import { buildTransactionContext } from "./context-builder";
import {
  toInventoryLocationId,
  toMaterialId,
  toInventoryBatchId,
} from "../../core/shared/primitives";

export class AdjustInventoryStockUseCase {
  constructor(private readonly engine: IInventoryEngine) {}

  async execute(dto: AdjustStockInputDTO): Promise<InventoryExecutionOutputDTO> {
    const context = buildTransactionContext(dto);

    const mappedItems = dto.items.map((i) => ({
      materialId: toMaterialId(i.materialId),
      quantity: i.quantity,
      unitCost: i.unitCost,
      stockState: i.stockState,
      batchId: i.batchId ? toInventoryBatchId(i.batchId) : undefined,
      expirationDate: i.expirationDate,
      notes: i.notes,
    }));

    const result = await this.engine.adjustStock(context, {
      locationId: toInventoryLocationId(dto.locationId),
      adjustmentType: dto.adjustmentType,
      reasonCode: dto.reasonCode,
      reasonDescription: dto.reasonDescription,
      items: mappedItems,
    });

    return {
      success: true,
      operationId: result.operationId,
      movementIds: result.movementIds,
      status: result.status,
      timestamp: result.createdAt,
      idempotencyKey: dto.idempotencyKey,
    };
  }
}
