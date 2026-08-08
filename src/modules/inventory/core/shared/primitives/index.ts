/**
 * Tipos primitivos e identificadores do domínio de Inventário.
 *
 * Utiliza Branded Types para impedir mistura acidental de identificadores.
 * Compatibilidade: campos externos utilizam string simples, adaptadores
 * convertem para branded types quando necessário.
 */

export type Brand<K, T> = K & { readonly __brand: T };

// ---------------------------------------------------------------------------
// Identificadores de Domínio do Inventário
// ---------------------------------------------------------------------------
export type InventoryLocationId = Brand<string, "InventoryLocationId">;
export type InventoryPolicyId = Brand<string, "InventoryPolicyId">;
export type StockMovementId = Brand<string, "StockMovementId">;
export type InventoryBalanceId = Brand<string, "InventoryBalanceId">;
export type InventoryReservationId = Brand<string, "InventoryReservationId">;
export type StockTransferId = Brand<string, "StockTransferId">;
export type StockTransferItemId = Brand<string, "StockTransferItemId">;
export type StockAdjustmentId = Brand<string, "StockAdjustmentId">;
export type StockAdjustmentItemId = Brand<string, "StockAdjustmentItemId">;
export type PhysicalInventoryCountId = Brand<string, "PhysicalInventoryCountId">;
export type PhysicalInventoryCountItemId = Brand<string, "PhysicalInventoryCountItemId">;
export type InventoryBatchId = Brand<string, "InventoryBatchId">;
export type InventoryAuditLogId = Brand<string, "InventoryAuditLogId">;
export type ProcessedInventoryOperationId = Brand<string, "ProcessedInventoryOperationId">;

// ---------------------------------------------------------------------------
// Identificadores de Referências Externas (compatíveis com string)
// ---------------------------------------------------------------------------
export type MaterialId = Brand<string, "MaterialId">;
export type LocationId = Brand<string, "LocationId">;
export type MovementId = Brand<string, "MovementId">;
export type ReservationId = Brand<string, "ReservationId">;
export type TransferId = Brand<string, "TransferId">;
export type SupplierId = Brand<string, "SupplierId">;
export type ProjectId = Brand<string, "ProjectId">;
export type TenantId = Brand<string, "TenantId">;
export type CompanyId = Brand<string, "CompanyId">;
export type ActorId = Brand<string, "ActorId">;

// ---------------------------------------------------------------------------
// Factories de Identificadores
// Permitem criar branded IDs a partir de strings existentes de forma segura.
// ---------------------------------------------------------------------------

/** Cria um InventoryLocationId a partir de uma string. */
export const toInventoryLocationId = (s: string): InventoryLocationId => s as InventoryLocationId;
export const toStockMovementId = (s: string): StockMovementId => s as StockMovementId;
export const toInventoryBalanceId = (s: string): InventoryBalanceId => s as InventoryBalanceId;
export const toMaterialId = (s: string): MaterialId => s as MaterialId;
export const toProjectId = (s: string): ProjectId => s as ProjectId;
export const toSupplierId = (s: string): SupplierId => s as SupplierId;
export const toActorId = (s: string): ActorId => s as ActorId;
export const toTenantId = (s: string): TenantId => s as TenantId;
export const toCompanyId = (s: string): CompanyId => s as CompanyId;
export const toInventoryBatchId = (s: string): InventoryBatchId => s as InventoryBatchId;
export const toInventoryReservationId = (s: string): InventoryReservationId =>
  s as InventoryReservationId;
export const toStockTransferId = (s: string): StockTransferId => s as StockTransferId;
export const toStockTransferItemId = (s: string): StockTransferItemId => s as StockTransferItemId;
export const toStockAdjustmentId = (s: string): StockAdjustmentId => s as StockAdjustmentId;
export const toStockAdjustmentItemId = (s: string): StockAdjustmentItemId =>
  s as StockAdjustmentItemId;
export const toPhysicalInventoryCountId = (s: string): PhysicalInventoryCountId =>
  s as PhysicalInventoryCountId;
export const toPhysicalInventoryCountItemId = (s: string): PhysicalInventoryCountItemId =>
  s as PhysicalInventoryCountItemId;
export const toInventoryAuditLogId = (s: string): InventoryAuditLogId => s as InventoryAuditLogId;
export const toProcessedInventoryOperationId = (s: string): ProcessedInventoryOperationId =>
  s as ProcessedInventoryOperationId;
