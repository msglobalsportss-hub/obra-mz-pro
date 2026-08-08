/**
 * Caso de Uso: TransferInventoryStockUseCase
 * Categoria: application/use-cases
 */

import type { IInventoryEngine } from "../../core/engine/inventory-engine";
import type { TransferStockInputDTO, InventoryExecutionOutputDTO } from "../dto/inventory-dto";
import { buildTransactionContext } from "./context-builder";
import {
  toMaterialId,
  toInventoryLocationId,
  toInventoryBatchId,
} from "../../core/shared/primitives";

export class TransferInventoryStockUseCase {
  constructor(private readonly engine: IInventoryEngine) {}

  async execute(dto: TransferStockInputDTO): Promise<InventoryExecutionOutputDTO> {
    const context = buildTransactionContext(dto);

    const result = await this.engine.transferStock(context, {
      materialId: toMaterialId(dto.materialId),
      sourceLocationId: toInventoryLocationId(dto.sourceLocationId),
      destinationLocationId: toInventoryLocationId(dto.destinationLocationId),
      quantity: dto.quantity,
      batchId: dto.batchId ? toInventoryBatchId(dto.batchId) : undefined,
      expirationDate: dto.expirationDate,
      stockState: dto.stockState,
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
