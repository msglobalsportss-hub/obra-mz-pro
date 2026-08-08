/**
 * Contratos de Repositórios do Inventário (ADR-010).
 *
 * Interfaces independentes de tecnologia de persistência.
 * Os adaptadores concretos (Supabase, localStorage, etc.) dependem do Core,
 * NUNCA o contrário.
 *
 * REGRAS DE NOMEAÇÃO E OPERAÇÕES DOMAIN-ORIENTED:
 * - Evita métodos genéricos (save, update, delete).
 * - Utiliza nomes explícitos orientados ao domínio (appendMovement, storeBalanceProjection, etc.).
 * - Todas as queries são filtradas por tenantId + companyId (multi-empresa).
 */

import type {
  InventoryLocation,
  InventoryPolicy,
  StockMovement,
  InventoryBalance,
  InventoryBalanceDimensions,
  InventoryReservation,
  StockTransfer,
  StockTransferItem,
  StockAdjustment,
  StockAdjustmentItem,
  PhysicalInventoryCount,
  PhysicalInventoryCountItem,
  InventoryBatch,
  InventoryAuditLog,
  ProcessedInventoryOperation,
} from "../entities";
import type {
  InventoryLocationId,
  InventoryPolicyId,
  StockMovementId,
  InventoryBalanceId,
  InventoryReservationId,
  StockTransferId,
  StockAdjustmentId,
  PhysicalInventoryCountId,
  InventoryBatchId,
  InventoryAuditLogId,
  ProcessedInventoryOperationId,
  TenantId,
  CompanyId,
  MaterialId,
} from "../../shared/primitives";
import type { IdempotencyKey, ISO8601String } from "../../types/aliases";
import type {
  InventoryReservationStatus,
  StockTransferStatus,
  StockAdjustmentStatus,
} from "../../types/enums";

// ---------------------------------------------------------------------------
// IInventoryLocationRepository
// ---------------------------------------------------------------------------

export interface IInventoryLocationRepository {
  findById(id: InventoryLocationId): Promise<InventoryLocation | null>;
  findByCode(
    tenantId: TenantId,
    companyId: CompanyId,
    code: string,
  ): Promise<InventoryLocation | null>;
  listAll(tenantId: TenantId, companyId: CompanyId): Promise<readonly InventoryLocation[]>;
  listActive(tenantId: TenantId, companyId: CompanyId): Promise<readonly InventoryLocation[]>;
  saveLocation(location: InventoryLocation): Promise<void>;
}

// ---------------------------------------------------------------------------
// IInventoryPolicyRepository
// ---------------------------------------------------------------------------

export interface IInventoryPolicyRepository {
  findById(id: InventoryPolicyId): Promise<InventoryPolicy | null>;
  findByMaterial(
    tenantId: TenantId,
    companyId: CompanyId,
    materialId: MaterialId,
    locationId?: InventoryLocationId,
  ): Promise<InventoryPolicy | null>;
  listByMaterial(
    tenantId: TenantId,
    companyId: CompanyId,
    materialId: MaterialId,
  ): Promise<readonly InventoryPolicy[]>;
  savePolicy(policy: InventoryPolicy): Promise<void>;
}

// ---------------------------------------------------------------------------
// IStockMovementRepository
// ---------------------------------------------------------------------------

export interface IStockMovementRepository {
  findById(id: StockMovementId): Promise<StockMovement | null>;

  findByIdempotencyKey(
    tenantId: TenantId,
    companyId: CompanyId,
    idempotencyKey: IdempotencyKey,
  ): Promise<StockMovement | null>;

  listByMaterial(
    tenantId: TenantId,
    companyId: CompanyId,
    materialId: MaterialId,
  ): Promise<readonly StockMovement[]>;

  listByBalanceDimensions(
    dimensions: InventoryBalanceDimensions,
  ): Promise<readonly StockMovement[]>;

  listByLocationAndPeriod(
    tenantId: TenantId,
    companyId: CompanyId,
    locationId: InventoryLocationId,
    from: ISO8601String,
    to: ISO8601String,
  ): Promise<readonly StockMovement[]>;

  /**
   * REGRA ARQUITETURAL INVIOLÁVEL (ADR-002, ADR-003):
   * Nenhum repositório poderá modificar diretamente um StockMovement confirmado.
   * Mesmo que futuramente exista um fluxo de reversão ou estorno, ele deverá criar
   * um NOVO movimento (tipo 'reversal' ou 'correction') e NUNCA editar o movimento original.
   *
   * Append-only: armazena um novo movimento imutável no histórico.
   */
  appendMovement(movement: StockMovement): Promise<void>;
}

// ---------------------------------------------------------------------------
// IInventoryBalanceRepository
// ---------------------------------------------------------------------------

export interface IInventoryBalanceRepository {
  findById(id: InventoryBalanceId): Promise<InventoryBalance | null>;
  findByDimensions(dimensions: InventoryBalanceDimensions): Promise<InventoryBalance | null>;
  listByMaterial(
    tenantId: TenantId,
    companyId: CompanyId,
    materialId: MaterialId,
  ): Promise<readonly InventoryBalance[]>;
  listByLocation(
    tenantId: TenantId,
    companyId: CompanyId,
    locationId: InventoryLocationId,
  ): Promise<readonly InventoryBalance[]>;

  /**
   * Armazena ou atualiza a projeção de saldo (Read Model).
   * Apenas o Inventory Engine pode invocar esta projeção.
   */
  storeBalanceProjection(balance: InventoryBalance, expectedVersion?: number | null): Promise<void>;
}

// ---------------------------------------------------------------------------
// IInventoryReservationRepository
// ---------------------------------------------------------------------------

export interface IInventoryReservationRepository {
  findById(id: InventoryReservationId): Promise<InventoryReservation | null>;
  findByIdempotencyKey(
    tenantId: TenantId,
    companyId: CompanyId,
    idempotencyKey: IdempotencyKey,
  ): Promise<InventoryReservation | null>;
  listByMaterial(
    tenantId: TenantId,
    companyId: CompanyId,
    materialId: MaterialId,
  ): Promise<readonly InventoryReservation[]>;
  listByStatus(
    tenantId: TenantId,
    companyId: CompanyId,
    status: InventoryReservationStatus,
  ): Promise<readonly InventoryReservation[]>;
  saveReservation(reservation: InventoryReservation): Promise<void>;
}

// ---------------------------------------------------------------------------
// IStockTransferRepository
// ---------------------------------------------------------------------------

export interface IStockTransferRepository {
  findById(id: StockTransferId): Promise<StockTransfer | null>;
  findByIdempotencyKey(
    tenantId: TenantId,
    companyId: CompanyId,
    idempotencyKey: IdempotencyKey,
  ): Promise<StockTransfer | null>;
  listByStatus(
    tenantId: TenantId,
    companyId: CompanyId,
    status: StockTransferStatus,
  ): Promise<readonly StockTransfer[]>;
  listItemsByTransfer(transferId: StockTransferId): Promise<readonly StockTransferItem[]>;
  saveTransfer(transfer: StockTransfer): Promise<void>;
  saveItem(item: StockTransferItem): Promise<void>;
  markTransferReceived(transferId: StockTransferId, receivedAt: ISO8601String): Promise<void>;
}

// ---------------------------------------------------------------------------
// IStockAdjustmentRepository
// ---------------------------------------------------------------------------

export interface IStockAdjustmentRepository {
  findById(id: StockAdjustmentId): Promise<StockAdjustment | null>;
  findByIdempotencyKey(
    tenantId: TenantId,
    companyId: CompanyId,
    idempotencyKey: IdempotencyKey,
  ): Promise<StockAdjustment | null>;
  listByStatus(
    tenantId: TenantId,
    companyId: CompanyId,
    status: StockAdjustmentStatus,
  ): Promise<readonly StockAdjustment[]>;
  listItemsByAdjustment(adjustmentId: StockAdjustmentId): Promise<readonly StockAdjustmentItem[]>;
  saveAdjustment(adjustment: StockAdjustment): Promise<void>;
  saveItem(item: StockAdjustmentItem): Promise<void>;
}

// ---------------------------------------------------------------------------
// IPhysicalInventoryCountRepository
// ---------------------------------------------------------------------------

export interface IPhysicalInventoryCountRepository {
  findById(id: PhysicalInventoryCountId): Promise<PhysicalInventoryCount | null>;
  findByIdempotencyKey(
    tenantId: TenantId,
    companyId: CompanyId,
    idempotencyKey: IdempotencyKey,
  ): Promise<PhysicalInventoryCount | null>;
  listByLocation(
    tenantId: TenantId,
    companyId: CompanyId,
    locationId: InventoryLocationId,
  ): Promise<readonly PhysicalInventoryCount[]>;
  listItemsByCount(
    countId: PhysicalInventoryCountId,
  ): Promise<readonly PhysicalInventoryCountItem[]>;
  saveCount(count: PhysicalInventoryCount): Promise<void>;
  saveItem(item: PhysicalInventoryCountItem): Promise<void>;
}

// ---------------------------------------------------------------------------
// IInventoryBatchRepository
// ---------------------------------------------------------------------------

export interface IInventoryBatchRepository {
  findById(id: InventoryBatchId): Promise<InventoryBatch | null>;
  findByBatchNumber(
    tenantId: TenantId,
    companyId: CompanyId,
    materialId: MaterialId,
    batchNumber: string,
  ): Promise<InventoryBatch | null>;
  listByMaterial(
    tenantId: TenantId,
    companyId: CompanyId,
    materialId: MaterialId,
  ): Promise<readonly InventoryBatch[]>;
  saveBatch(batch: InventoryBatch): Promise<void>;
}

// ---------------------------------------------------------------------------
// IInventoryAuditLogRepository
// ---------------------------------------------------------------------------

export interface IInventoryAuditLogRepository {
  findById(id: InventoryAuditLogId): Promise<InventoryAuditLog | null>;
  listByEntity(
    tenantId: TenantId,
    companyId: CompanyId,
    entityType: string,
    entityId: string,
  ): Promise<readonly InventoryAuditLog[]>;
  /** Append-only: registos de auditoria são imutáveis */
  storeAuditRecord(log: InventoryAuditLog): Promise<void>;
}

// ---------------------------------------------------------------------------
// IProcessedInventoryOperationRepository
// ---------------------------------------------------------------------------

export interface IProcessedInventoryOperationRepository {
  findById(id: ProcessedInventoryOperationId): Promise<ProcessedInventoryOperation | null>;
  findByIdempotencyKey(
    tenantId: TenantId,
    companyId: CompanyId,
    idempotencyKey: IdempotencyKey,
  ): Promise<ProcessedInventoryOperation | null>;
  /** Append-only: registos de idempotência são imutáveis */
  storeProcessedOperation(operation: ProcessedInventoryOperation): Promise<void>;
}
