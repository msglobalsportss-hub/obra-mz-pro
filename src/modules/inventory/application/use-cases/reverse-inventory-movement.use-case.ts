/**
 * Caso de Uso: ReverseInventoryMovementUseCase
 * Categoria: application/use-cases
 */

import type { IInventoryEngine } from "../../core/engine/inventory-engine";
import type { ReverseMovementInputDTO, InventoryExecutionOutputDTO } from "../dto/inventory-dto";
import { buildTransactionContext } from "./context-builder";
import { toStockMovementId } from "../../core/shared/primitives";

export class ReverseInventoryMovementUseCase {
  constructor(private readonly engine: IInventoryEngine) {}

  async execute(dto: ReverseMovementInputDTO): Promise<InventoryExecutionOutputDTO> {
    const context = buildTransactionContext(dto);

    const result = await this.engine.reverseMovement(context, {
      movementIdToReverse: toStockMovementId(dto.movementIdToReverse),
      reason: dto.reason,
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
