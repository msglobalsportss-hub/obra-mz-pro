/**
 * Caso de Uso: ReleaseInventoryReservationUseCase
 * Categoria: application/use-cases
 */

import type { IInventoryEngine } from "../../core/engine/inventory-engine";
import type { ReleaseReservationInputDTO, InventoryExecutionOutputDTO } from "../dto/inventory-dto";
import { buildTransactionContext } from "./context-builder";
import { toInventoryReservationId } from "../../core/shared/primitives";

export class ReleaseInventoryReservationUseCase {
  constructor(private readonly engine: IInventoryEngine) {}

  async execute(dto: ReleaseReservationInputDTO): Promise<InventoryExecutionOutputDTO> {
    const context = buildTransactionContext(dto);

    const result = await this.engine.releaseReservation(context, {
      reservationId: toInventoryReservationId(dto.reservationId),
      quantityToRelease: dto.quantityToRelease,
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
