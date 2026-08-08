/**
 * Entidade de Domínio: InventoryPolicy
 * Categoria: State / Inventory
 *
 * Representa as regras de inventário aplicáveis a um material,
 * opcionalmente com escopo por localização.
 */

import type {
  InventoryPolicyId,
  TenantId,
  CompanyId,
  MaterialId,
  ActorId,
} from "../../../shared/primitives";
import type { InventoryLocationId } from "../../../shared/primitives";
import type { ISO8601String, Quantity } from "../../../types/aliases";
import type { InventoryCostingMethod } from "../../../types/enums";

export interface InventoryPolicy {
  readonly id: InventoryPolicyId;
  readonly tenantId: TenantId;
  readonly companyId: CompanyId;
  readonly materialId: MaterialId;

  /** Quando definido, a política aplica-se apenas a esta localização */
  readonly locationId?: InventoryLocationId;

  readonly minimumStock?: Quantity;
  readonly maximumStock?: Quantity;
  readonly reorderPoint?: Quantity;
  readonly reorderQuantity?: Quantity;

  readonly allowNegativeStock: boolean;
  readonly reservable: boolean;
  readonly transferable: boolean;
  readonly consumable: boolean;

  readonly requiresBatch: boolean;
  readonly requiresExpirationDate: boolean;

  /**
   * Método de custeio. Apenas 'weighted_average' operacional na Fase 2B.
   * Os demais são preparados para fases futuras.
   */
  readonly costingMethod: InventoryCostingMethod;

  readonly isActive: boolean;

  readonly createdAt: ISO8601String;
  readonly updatedAt: ISO8601String;
  readonly createdBy?: ActorId;
  readonly updatedBy?: ActorId;
}
