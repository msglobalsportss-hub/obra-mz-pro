/**
 * Serviço de Domínio: BalanceKeyResolver
 * Categoria: core/services
 *
 * UNICO PONTO AUTORIZADO para resolução da chave determinística de saldos.
 *
 * NOTA ARQUITETURAL DE EVOLUÇÃO DE DIMENSÕES:
 * Este serviço encapsula o helper buildBalanceDimensionKey(). Caso novas dimensões
 * Venham a ser adicionadas no futuro (ex: ownerId, projectId, supplierId, containerId),
 * ESTE É O ÚNICO FICHEIRO que necessitará de atualização para derivar a chave de saldo.
 * Nenhum outro serviço do sistema constrói a chave manualmente.
 */

import { buildBalanceDimensionKey } from "../helpers";
import type { InventoryBalanceDimensions } from "../domain/entities";
import type {
  TenantId,
  CompanyId,
  MaterialId,
  InventoryLocationId,
  InventoryBatchId,
} from "../shared/primitives";
import type { InventoryStockState } from "../types/enums";
import { validateNonEmptyId } from "../validation";
import { InventoryPolicyViolationError } from "../shared/errors";

export interface BalanceKeyResolverParams {
  tenantId: TenantId;
  companyId: CompanyId;
  materialId: MaterialId;
  locationId: InventoryLocationId;
  stockState?: InventoryStockState;
  batchId?: InventoryBatchId;
  expirationDate?: string;
}

export class BalanceKeyResolver {
  /**
   * Resolve a chave única determinística para um saldo de inventário.
   */
  static resolveKey(params: BalanceKeyResolverParams): string {
    const tenantErr = validateNonEmptyId(params.tenantId, "tenantId");
    if (tenantErr) throw new InventoryPolicyViolationError("tenantId", tenantErr.message);

    const compErr = validateNonEmptyId(params.companyId, "companyId");
    if (compErr) throw new InventoryPolicyViolationError("companyId", compErr.message);

    const matErr = validateNonEmptyId(params.materialId, "materialId");
    if (matErr) throw new InventoryPolicyViolationError("materialId", matErr.message);

    const locErr = validateNonEmptyId(params.locationId, "locationId");
    if (locErr) throw new InventoryPolicyViolationError("locationId", locErr.message);

    const dimensions: InventoryBalanceDimensions = {
      tenantId: params.tenantId,
      companyId: params.companyId,
      materialId: params.materialId,
      locationId: params.locationId,
      stockState: params.stockState ?? "available",
      batchId: params.batchId,
      expirationDate: params.expirationDate,
    };

    return buildBalanceDimensionKey(dimensions);
  }

  /**
   * Converte uma estrutura de dimensões num objeto parametrizável.
   */
  static fromDimensions(dimensions: InventoryBalanceDimensions): string {
    return buildBalanceDimensionKey(dimensions);
  }
}
