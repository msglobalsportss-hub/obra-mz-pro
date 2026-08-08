/**
 * Barrel de Exportação das Entidades de Domínio do Inventário.
 *
 * UNICO PONTO DE ENTRADA INTERNO PARA ENTIDADES DO DOMÍNIO.
 * Outros ficheiros internos do módulo devem importar deste barrel:
 *   import type { InventoryLocation } from '../entities';
 *
 * NÃO importar diretamente de subpastas como '../entities/inventory/...'
 * ou '../entities/documents/...', preservando o encapsulamento interno.
 */

// --- Entidades de Estado de Domínio (inventory/) ---
export type { InventoryLocation } from "./inventory/inventory-location.entity";
export type { InventoryPolicy } from "./inventory/inventory-policy.entity";
export type { StockMovement } from "./inventory/stock-movement.entity";
export type {
  InventoryBalance,
  InventoryBalanceDimensions,
} from "./inventory/inventory-balance.entity";
export type { InventoryBatch } from "./inventory/inventory-batch.entity";
export type { InventoryAuditLog } from "./inventory/inventory-audit-log.entity";
export type { ProcessedInventoryOperation } from "./inventory/processed-inventory-operation.entity";

// --- Entidades de Documentos de Negócio (documents/) ---
export type { InventoryReservation } from "./documents/inventory-reservation.entity";
export type { StockTransfer, StockTransferItem } from "./documents/stock-transfer.entity";
export type { StockAdjustment, StockAdjustmentItem } from "./documents/stock-adjustment.entity";
export type {
  PhysicalInventoryCount,
  PhysicalInventoryCountItem,
} from "./documents/physical-inventory-count.entity";
