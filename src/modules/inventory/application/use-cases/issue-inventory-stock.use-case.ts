/**
 * Caso de Uso: IssueInventoryStockUseCase
 * Categoria: application/use-cases
 */

import type { IInventoryEngine } from "../../core/engine/inventory-engine";
import type { IssueStockInputDTO, InventoryExecutionOutputDTO } from "../dto/inventory-dto";
import { buildTransactionContext } from "./context-builder";
import {
  toMaterialId,
  toInventoryLocationId,
  toInventoryBatchId,
} from "../../core/shared/primitives";

export class IssueInventoryStockUseCase {
  constructor(private readonly engine: IInventoryEngine) {}

  async execute(dto: IssueStockInputDTO): Promise<InventoryExecutionOutputDTO> {
    const context = buildTransactionContext(dto);

    const result = await this.engine.issueStock(context, {
      materialId: toMaterialId(dto.materialId),
      locationId: toInventoryLocationId(dto.locationId),
      quantity: dto.quantity,
      batchId: dto.batchId ? toInventoryBatchId(dto.batchId) : undefined,
      expirationDate: dto.expirationDate,
      stockState: dto.stockState,
      movementType: dto.movementType,
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
