/**
 * Entidade de Domínio: InventoryBatch
 * Categoria: State / Inventory
 *
 * Representa um lote de material para rastreabilidade.
 *
 * NOTAS DE PREPARAÇÃO ARQUITETURAL:
 * 1. serialTrackingEnabled (opcional): Indica se o lote está assinalado para rastreio
 *    de números de série. NÃO implica a implementação de rastreio de séries nesta fase.
 * 2. qualityStatus (opcional): Representa o estado de controlo de qualidade do lote.
 *    É INDEPENDENTE do estado de stock (InventoryStockState) e NÃO substitui o mesmo.
 *    Um lote pode ter qualityStatus 'pending_inspection' enquanto as suas unidades físicas
 *    estão classificadas com stockState 'inspection'.
 */

import type {
  InventoryBatchId,
  TenantId,
  CompanyId,
  MaterialId,
  SupplierId,
} from "../../../shared/primitives";
import type { ISO8601String } from "../../../types/aliases";
import type { InventoryBatchStatus, InventoryBatchQualityStatus } from "../../../types/enums";

export interface InventoryBatch {
  readonly id: InventoryBatchId;
  readonly tenantId: TenantId;
  readonly companyId: CompanyId;

  readonly materialId: MaterialId;

  readonly batchNumber: string;
  readonly supplierBatchNumber?: string;

  readonly manufacturedAt?: ISO8601String;
  readonly receivedAt?: ISO8601String;
  readonly expirationDate?: ISO8601String;

  readonly status: InventoryBatchStatus;

  /**
   * Estado de Controlo de Qualidade do Lote (Preparação Futura).
   * Independente de InventoryStockState.
   */
  readonly qualityStatus?: InventoryBatchQualityStatus;

  /**
   * Flag de rastreio por número de série (Preparação Futura).
   * Não ativa rastreio de série na Fase 2A/2B.
   */
  readonly serialTrackingEnabled?: boolean;

  readonly supplierId?: SupplierId;

  /** Referência à entrega que originou este lote */
  readonly deliveryId?: string;

  readonly notes?: string;

  readonly createdAt: ISO8601String;
  readonly updatedAt: ISO8601String;
}
