/**
 * Entidade de Domínio: InventoryLocation
 * Categoria: State / Inventory
 *
 * Representa uma localização física ou contabilística onde materiais
 * podem existir. É o ponto de referência para todos os movimentos de stock.
 */

import type {
  InventoryLocationId,
  TenantId,
  CompanyId,
  ActorId,
  ProjectId,
} from "../../../shared/primitives";
import type { ISO8601String } from "../../../types/aliases";
import type { InventoryLocationType } from "../../../types/locations";

export interface InventoryLocation {
  readonly id: InventoryLocationId;
  readonly tenantId: TenantId;
  readonly companyId: CompanyId;

  readonly code: string;
  readonly name: string;
  readonly description?: string;

  readonly type: InventoryLocationType;

  /** Obrigatório quando type === 'project' */
  readonly projectId?: ProjectId;

  /** Localização-pai para hierarquia */
  readonly parentLocationId?: InventoryLocationId;

  readonly address?: string;
  readonly province?: string;
  readonly city?: string;

  readonly isActive: boolean;
  readonly isDefault: boolean;

  /** Permissões operacionais */
  readonly allowsInbound: boolean;
  readonly allowsOutbound: boolean;
  readonly allowsReservations: boolean;
  readonly allowsTransfers: boolean;
  readonly allowsConsumption: boolean;

  readonly createdAt: ISO8601String;
  readonly updatedAt: ISO8601String;
  readonly createdBy?: ActorId;
  readonly updatedBy?: ActorId;
}
