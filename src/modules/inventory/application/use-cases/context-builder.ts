/**
 * Helper da Camada Application: ContextBuilder
 * Categoria: application/use-cases
 *
 * Constrói um InventoryTransactionContext a partir de um DTO de entrada.
 */

import type { InventoryTransactionContext } from "../../core/contracts/shared/inventory-transaction-context";
import type { BaseInventoryRequestDTO } from "../dto/inventory-dto";
import { toTenantId, toCompanyId, toActorId } from "../../core/shared/primitives";
import { nowISO, generateInventoryId } from "../../core/helpers";

export function buildTransactionContext(dto: BaseInventoryRequestDTO): InventoryTransactionContext {
  const timestamp = nowISO();
  const correlationId = dto.correlationId ?? `corr-${generateInventoryId("corr")}`;

  return {
    tenantId: toTenantId(dto.tenantId),
    companyId: toCompanyId(dto.companyId),
    actorId: dto.actorId ? toActorId(dto.actorId) : undefined,
    correlationId,
    idempotencyKey: dto.idempotencyKey,
    timestamp,
    sourceModule: dto.sourceModule ?? "application",
    reference: dto.reference,
  };
}
