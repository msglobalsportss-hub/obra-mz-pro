/**
 * Caso de Uso: ReserveInventoryStockUseCase
 * Categoria: application/use-cases
 */

import type { IInventoryEngine } from "../../core/engine/inventory-engine";
import type { ReserveStockInputDTO, InventoryExecutionOutputDTO } from "../dto/inventory-dto";
import { buildTransactionContext } from "./context-builder";
import { toMaterialId, toInventoryLocationId, toProjectId } from "../../core/shared/primitives";

export class ReserveInventoryStockUseCase {
  constructor(private readonly engine: IInventoryEngine) {}

  async execute(dto: ReserveStockInputDTO): Promise<InventoryExecutionOutputDTO> {
    const context = buildTransactionContext(dto);

    const result = await this.engine.reserveStock(context, {
      materialId: toMaterialId(dto.materialId),
      locationId: toInventoryLocationId(dto.locationId),
      quantity: dto.quantity,
      projectId: dto.projectId ? toProjectId(dto.projectId) : undefined,
      requiredAt: dto.requiredAt,
      expiresAt: dto.expiresAt,
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
