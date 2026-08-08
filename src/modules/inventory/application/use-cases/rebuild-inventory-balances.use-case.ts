/**
 * Caso de Uso: RebuildInventoryBalancesUseCase
 * Categoria: application/use-cases
 */

import type { IInventoryEngine } from "../../core/engine/inventory-engine";
import type { BaseInventoryRequestDTO } from "../dto/inventory-dto";
import { buildTransactionContext } from "./context-builder";
import type { InventoryBalanceRebuildResult } from "../../core/engine/inventory-balance-rebuilder";
import { toMaterialId, toInventoryLocationId } from "../../core/shared/primitives";

export interface RebuildBalancesInputDTO extends BaseInventoryRequestDTO {
  readonly materialId?: string;
  readonly locationId?: string;
  readonly fromDate?: string;
  readonly toDate?: string;
}

export class RebuildInventoryBalancesUseCase {
  constructor(private readonly engine: IInventoryEngine) {}

  async execute(dto: RebuildBalancesInputDTO): Promise<InventoryBalanceRebuildResult> {
    const context = buildTransactionContext(dto);

    return this.engine.rebuildBalances(context, {
      materialId: dto.materialId ? toMaterialId(dto.materialId) : undefined,
      locationId: dto.locationId ? toInventoryLocationId(dto.locationId) : undefined,
      fromDate: dto.fromDate,
      toDate: dto.toDate,
    });
  }
}
