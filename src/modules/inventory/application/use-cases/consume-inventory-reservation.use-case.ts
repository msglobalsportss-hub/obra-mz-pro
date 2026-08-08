/**
 * Caso de Uso: ConsumeInventoryReservationUseCase
 * Categoria: application/use-cases
 */

import type { IInventoryEngine } from "../../core/engine/inventory-engine";
import type { ConsumeReservationInputDTO, InventoryExecutionOutputDTO } from "../dto/inventory-dto";
import { buildTransactionContext } from "./context-builder";
import { toInventoryReservationId } from "../../core/shared/primitives";

export class ConsumeInventoryReservationUseCase {
  constructor(private readonly engine: IInventoryEngine) {}

  async execute(dto: ConsumeReservationInputDTO): Promise<InventoryExecutionOutputDTO> {
    const context = buildTransactionContext(dto);

    const result = await this.engine.consumeReservation(context, {
      reservationId: toInventoryReservationId(dto.reservationId),
      quantityToConsume: dto.quantityToConsume,
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
