/**
 * Caso de Uso: CheckInventoryConsistencyUseCase
 * Categoria: application/use-cases
 */

import type { InventoryRepositoryContext } from "../../core/domain/repositories";
import {
  InventoryConsistencyChecker,
  type InventoryHealthReport,
} from "../../core/services/inventory-consistency-checker";
import { toTenantId, toCompanyId } from "../../core/shared/primitives";

export interface CheckConsistencyInputDTO {
  readonly tenantId: string;
  readonly companyId: string;
}

export class CheckInventoryConsistencyUseCase {
  constructor(private readonly repositories: InventoryRepositoryContext) {}

  async execute(dto: CheckConsistencyInputDTO): Promise<InventoryHealthReport> {
    return InventoryConsistencyChecker.checkHealth(
      toTenantId(dto.tenantId),
      toCompanyId(dto.companyId),
      this.repositories,
    );
  }
}
