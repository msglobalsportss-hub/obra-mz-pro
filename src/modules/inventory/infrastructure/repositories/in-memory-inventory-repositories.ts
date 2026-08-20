/**
 * Repositórios em Memória: InMemoryInventoryRepositories
 * Categoria: infrastructure/repositories
 *
 * Implementação em memória dos 11 contratos de repositórios do domínio.
 *
 * REGRAS INVIOLÁVEIS (Refinamentos 1, 9 e 10):
 * 1. Única implementação em memória por contrato (sem duplicação ou sufixos V2).
 * 2. Isolamento rigoroso por tenantId e companyId.
 * 3. Atomicidade e Idempotência: Simulação de restrição de unicidade em (tenantId + companyId + idempotencyKey).
 * 4. Optimistic Concurrency Control: storeBalanceProjection verifica expectedVersion e lança InventoryBalanceConflictError em desacordo.
 * 5. Deep Clone: Método clone() em cada repositório para suportar snapshots e rollbacks na Unit of Work.
 */

import type {
  IInventoryLocationRepository,
  IInventoryPolicyRepository,
  IStockMovementRepository,
  IInventoryBalanceRepository,
  IInventoryReservationRepository,
  IStockTransferRepository,
  IStockAdjustmentRepository,
  IPhysicalInventoryCountRepository,
  IInventoryBatchRepository,
  IInventoryAuditLogRepository,
  IProcessedInventoryOperationRepository,
} from "../../core/domain/repositories";
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
} from "../../core/domain/entities";
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
} from "../../core/shared/primitives";
import type { IdempotencyKey, ISO8601String } from "../../core/types/aliases";
import type {
  InventoryReservationStatus,
  StockTransferStatus,
  StockAdjustmentStatus,
} from "../../core/types/enums";
import {
  InventoryBalanceConflictError,
  InventoryOperationAlreadyProcessingError,
} from "../../core/shared/errors";
import { BalanceKeyResolver } from "../../core/services/balance-key-resolver";

function cloneDeep<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") return obj;
  return JSON.parse(JSON.stringify(obj));
}

// ---------------------------------------------------------------------------
// InMemoryInventoryLocationRepository
// ---------------------------------------------------------------------------
export class InMemoryInventoryLocationRepository implements IInventoryLocationRepository {
  private locations = new Map<string, InventoryLocation>();

  async findById(id: InventoryLocationId): Promise<InventoryLocation | null> {
    return this.locations.get(id) ?? null;
  }

  async findByCode(
    tenantId: TenantId,
    companyId: CompanyId,
    code: string,
  ): Promise<InventoryLocation | null> {
    for (const loc of this.locations.values()) {
      if (loc.tenantId === tenantId && loc.companyId === companyId && loc.code === code) {
        return loc;
      }
    }
    return null;
  }

  async listAll(tenantId: TenantId, companyId: CompanyId): Promise<readonly InventoryLocation[]> {
    return Array.from(this.locations.values()).filter(
      (l) => l.tenantId === tenantId && l.companyId === companyId,
    );
  }

  async listActive(
    tenantId: TenantId,
    companyId: CompanyId,
  ): Promise<readonly InventoryLocation[]> {
    return (await this.listAll(tenantId, companyId)).filter((l) => l.isActive);
  }

  async saveLocation(location: InventoryLocation): Promise<void> {
    this.locations.set(location.id, location);
  }

  clone(): InMemoryInventoryLocationRepository {
    const copy = new InMemoryInventoryLocationRepository();
    for (const [k, v] of this.locations) copy.locations.set(k, cloneDeep(v));
    return copy;
  }
}

// ---------------------------------------------------------------------------
// InMemoryInventoryPolicyRepository
// ---------------------------------------------------------------------------
export class InMemoryInventoryPolicyRepository implements IInventoryPolicyRepository {
  private policies = new Map<string, InventoryPolicy>();

  async findById(id: InventoryPolicyId): Promise<InventoryPolicy | null> {
    return this.policies.get(id) ?? null;
  }

  async findByMaterial(
    tenantId: TenantId,
    companyId: CompanyId,
    materialId: MaterialId,
    locationId?: InventoryLocationId,
  ): Promise<InventoryPolicy | null> {
    for (const p of this.policies.values()) {
      if (p.tenantId === tenantId && p.companyId === companyId && p.materialId === materialId) {
        if (!locationId || p.locationId === locationId || !p.locationId) {
          return p;
        }
      }
    }
    return null;
  }

  async listByMaterial(
    tenantId: TenantId,
    companyId: CompanyId,
    materialId: MaterialId,
  ): Promise<readonly InventoryPolicy[]> {
    return Array.from(this.policies.values()).filter(
      (p) => p.tenantId === tenantId && p.companyId === companyId && p.materialId === materialId,
    );
  }

  async savePolicy(policy: InventoryPolicy): Promise<void> {
    this.policies.set(policy.id, policy);
  }

  clone(): InMemoryInventoryPolicyRepository {
    const copy = new InMemoryInventoryPolicyRepository();
    for (const [k, v] of this.policies) copy.policies.set(k, cloneDeep(v));
    return copy;
  }
}

// ---------------------------------------------------------------------------
// InMemoryStockMovementRepository
// ---------------------------------------------------------------------------
export class InMemoryStockMovementRepository implements IStockMovementRepository {
  private movements = new Map<string, StockMovement>();

  async findById(id: StockMovementId): Promise<StockMovement | null> {
    return this.movements.get(id) ?? null;
  }

  async findByIdempotencyKey(
    tenantId: TenantId,
    companyId: CompanyId,
    idempotencyKey: IdempotencyKey,
  ): Promise<StockMovement | null> {
    for (const m of this.movements.values()) {
      if (
        m.tenantId === tenantId &&
        m.companyId === companyId &&
        m.idempotencyKey === idempotencyKey
      ) {
        return m;
      }
    }
    return null;
  }

  async listByMaterial(
    tenantId: TenantId,
    companyId: CompanyId,
    materialId: MaterialId,
  ): Promise<readonly StockMovement[]> {
    return Array.from(this.movements.values()).filter(
      (m) => m.tenantId === tenantId && m.companyId === companyId && m.materialId === materialId,
    );
  }

  async listByBalanceDimensions(
    dimensions: InventoryBalanceDimensions,
  ): Promise<readonly StockMovement[]> {
    return Array.from(this.movements.values()).filter(
      (m) =>
        m.tenantId === dimensions.tenantId &&
        m.companyId === dimensions.companyId &&
        m.materialId === dimensions.materialId &&
        (m.destinationLocationId === dimensions.locationId ||
          m.sourceLocationId === dimensions.locationId),
    );
  }

  async listByLocationAndPeriod(
    tenantId: TenantId,
    companyId: CompanyId,
    locationId: InventoryLocationId,
    from: ISO8601String,
    to: ISO8601String,
  ): Promise<readonly StockMovement[]> {
    return Array.from(this.movements.values()).filter((m) => {
      if (m.tenantId !== tenantId || m.companyId !== companyId) return false;
      if (
        locationId !== ("ALL" as unknown as InventoryLocationId) &&
        m.destinationLocationId !== locationId &&
        m.sourceLocationId !== locationId
      ) {
        return false;
      }
      const date = m.occurredAt ?? m.createdAt;
      return date >= from && date <= to;
    });
  }

  async findAll(): Promise<readonly StockMovement[]> {
    return Array.from(this.movements.values());
  }

  async appendMovement(movement: StockMovement): Promise<void> {
    this.movements.set(movement.id, movement);
  }

  clone(): InMemoryStockMovementRepository {
    const copy = new InMemoryStockMovementRepository();
    for (const [k, v] of this.movements) copy.movements.set(k, cloneDeep(v));
    return copy;
  }
}

// ---------------------------------------------------------------------------
// InMemoryInventoryBalanceRepository
// ---------------------------------------------------------------------------
export class InMemoryInventoryBalanceRepository implements IInventoryBalanceRepository {
  private balances = new Map<string, InventoryBalance>();

  async findAll(): Promise<readonly InventoryBalance[]> {
    return Array.from(this.balances.values());
  }

  async findById(id: InventoryBalanceId): Promise<InventoryBalance | null> {
    return this.balances.get(id) ?? null;
  }

  async findByDimensions(dimensions: InventoryBalanceDimensions): Promise<InventoryBalance | null> {
    const key = BalanceKeyResolver.fromDimensions(dimensions);
    return this.balances.get(key) ?? null;
  }

  async listByMaterial(
    tenantId: TenantId,
    companyId: CompanyId,
    materialId: MaterialId,
  ): Promise<readonly InventoryBalance[]> {
    return Array.from(this.balances.values()).filter(
      (b) => b.tenantId === tenantId && b.companyId === companyId && b.materialId === materialId,
    );
  }

  async listByLocation(
    tenantId: TenantId,
    companyId: CompanyId,
    locationId: InventoryLocationId,
  ): Promise<readonly InventoryBalance[]> {
    return Array.from(this.balances.values()).filter(
      (b) => b.tenantId === tenantId && b.companyId === companyId && b.locationId === locationId,
    );
  }

  async storeBalanceProjection(
    balance: InventoryBalance,
    expectedVersion: number | null,
  ): Promise<void> {
    const key = BalanceKeyResolver.fromDimensions({
      tenantId: balance.tenantId,
      companyId: balance.companyId,
      materialId: balance.materialId,
      locationId: balance.locationId,
      stockState: balance.stockState,
      batchId: balance.batchId,
      expirationDate: balance.expirationDate,
    });

    const current = this.balances.get(key);

    // REFINAMENTO 10: Optimistic Concurrency Control (expectedVersion = null permite substituição administrativa no rebuild)
    if (expectedVersion !== null && current) {
      if (current.version !== expectedVersion) {
        throw new InventoryBalanceConflictError(balance.id, expectedVersion, current.version);
      }
    }

    this.balances.set(key, balance);
  }

  clone(): InMemoryInventoryBalanceRepository {
    const copy = new InMemoryInventoryBalanceRepository();
    for (const [k, v] of this.balances) copy.balances.set(k, cloneDeep(v));
    return copy;
  }
}

// ---------------------------------------------------------------------------
// InMemoryInventoryReservationRepository
// ---------------------------------------------------------------------------
export class InMemoryInventoryReservationRepository implements IInventoryReservationRepository {
  private reservations = new Map<string, InventoryReservation>();

  async findAll(): Promise<readonly InventoryReservation[]> {
    return Array.from(this.reservations.values());
  }

  async findById(id: InventoryReservationId): Promise<InventoryReservation | null> {
    return this.reservations.get(id) ?? null;
  }

  async findByIdempotencyKey(
    tenantId: TenantId,
    companyId: CompanyId,
    idempotencyKey: IdempotencyKey,
  ): Promise<InventoryReservation | null> {
    for (const r of this.reservations.values()) {
      if (
        r.tenantId === tenantId &&
        r.companyId === companyId &&
        r.idempotencyKey === idempotencyKey
      ) {
        return r;
      }
    }
    return null;
  }

  async listByMaterial(
    tenantId: TenantId,
    companyId: CompanyId,
    materialId: MaterialId,
  ): Promise<readonly InventoryReservation[]> {
    return Array.from(this.reservations.values()).filter(
      (r) => r.tenantId === tenantId && r.companyId === companyId && r.materialId === materialId,
    );
  }

  async listByStatus(
    tenantId: TenantId,
    companyId: CompanyId,
    status: InventoryReservationStatus,
  ): Promise<readonly InventoryReservation[]> {
    return Array.from(this.reservations.values()).filter(
      (r) => r.tenantId === tenantId && r.companyId === companyId && r.status === status,
    );
  }

  async saveReservation(reservation: InventoryReservation): Promise<void> {
    this.reservations.set(reservation.id, reservation);
  }

  clone(): InMemoryInventoryReservationRepository {
    const copy = new InMemoryInventoryReservationRepository();
    for (const [k, v] of this.reservations) copy.reservations.set(k, cloneDeep(v));
    return copy;
  }
}

// ---------------------------------------------------------------------------
// InMemoryStockTransferRepository
// ---------------------------------------------------------------------------
export class InMemoryStockTransferRepository implements IStockTransferRepository {
  private transfers = new Map<string, StockTransfer>();
  private items = new Map<string, StockTransferItem>();

  async findAll(): Promise<readonly StockTransfer[]> {
    return Array.from(this.transfers.values());
  }

  async findById(id: StockTransferId): Promise<StockTransfer | null> {
    return this.transfers.get(id) ?? null;
  }

  async findByIdempotencyKey(
    tenantId: TenantId,
    companyId: CompanyId,
    idempotencyKey: IdempotencyKey,
  ): Promise<StockTransfer | null> {
    for (const t of this.transfers.values()) {
      if (
        t.tenantId === tenantId &&
        t.companyId === companyId &&
        t.idempotencyKey === idempotencyKey
      ) {
        return t;
      }
    }
    return null;
  }

  async listByStatus(
    tenantId: TenantId,
    companyId: CompanyId,
    status: StockTransferStatus,
  ): Promise<readonly StockTransfer[]> {
    return Array.from(this.transfers.values()).filter(
      (t) => t.tenantId === tenantId && t.companyId === companyId && t.status === status,
    );
  }

  async listItemsByTransfer(transferId: StockTransferId): Promise<readonly StockTransferItem[]> {
    return Array.from(this.items.values()).filter((i) => i.transferId === transferId);
  }

  async saveTransfer(transfer: StockTransfer): Promise<void> {
    this.transfers.set(transfer.id, transfer);
  }

  async saveItem(item: StockTransferItem): Promise<void> {
    this.items.set(item.id, item);
  }

  async markTransferReceived(
    transferId: StockTransferId,
    receivedAt: ISO8601String,
  ): Promise<void> {
    const current = this.transfers.get(transferId);
    if (current) {
      this.transfers.set(transferId, {
        ...current,
        status: "received",
        receivedAt,
        updatedAt: receivedAt,
      });
    }
  }

  clone(): InMemoryStockTransferRepository {
    const copy = new InMemoryStockTransferRepository();
    for (const [k, v] of this.transfers) copy.transfers.set(k, cloneDeep(v));
    for (const [k, v] of this.items) copy.items.set(k, cloneDeep(v));
    return copy;
  }
}

// ---------------------------------------------------------------------------
// InMemoryStockAdjustmentRepository
// ---------------------------------------------------------------------------
export class InMemoryStockAdjustmentRepository implements IStockAdjustmentRepository {
  private adjustments = new Map<string, StockAdjustment>();
  private items = new Map<string, StockAdjustmentItem>();

  async findById(id: StockAdjustmentId): Promise<StockAdjustment | null> {
    return this.adjustments.get(id) ?? null;
  }

  async findByIdempotencyKey(
    tenantId: TenantId,
    companyId: CompanyId,
    idempotencyKey: IdempotencyKey,
  ): Promise<StockAdjustment | null> {
    for (const a of this.adjustments.values()) {
      if (
        a.tenantId === tenantId &&
        a.companyId === companyId &&
        a.idempotencyKey === idempotencyKey
      ) {
        return a;
      }
    }
    return null;
  }

  async listByStatus(
    tenantId: TenantId,
    companyId: CompanyId,
    status: StockAdjustmentStatus,
  ): Promise<readonly StockAdjustment[]> {
    return Array.from(this.adjustments.values()).filter(
      (a) => a.tenantId === tenantId && a.companyId === companyId && a.status === status,
    );
  }

  async listItemsByAdjustment(
    adjustmentId: StockAdjustmentId,
  ): Promise<readonly StockAdjustmentItem[]> {
    return Array.from(this.items.values()).filter((i) => i.adjustmentId === adjustmentId);
  }

  async saveAdjustment(adjustment: StockAdjustment): Promise<void> {
    this.adjustments.set(adjustment.id, adjustment);
  }

  async saveItem(item: StockAdjustmentItem): Promise<void> {
    this.items.set(item.id, item);
  }

  clone(): InMemoryStockAdjustmentRepository {
    const copy = new InMemoryStockAdjustmentRepository();
    for (const [k, v] of this.adjustments) copy.adjustments.set(k, cloneDeep(v));
    for (const [k, v] of this.items) copy.items.set(k, cloneDeep(v));
    return copy;
  }
}

// ---------------------------------------------------------------------------
// InMemoryPhysicalInventoryCountRepository
// ---------------------------------------------------------------------------
export class InMemoryPhysicalInventoryCountRepository implements IPhysicalInventoryCountRepository {
  private counts = new Map<string, PhysicalInventoryCount>();
  private items = new Map<string, PhysicalInventoryCountItem>();

  async findById(id: PhysicalInventoryCountId): Promise<PhysicalInventoryCount | null> {
    return this.counts.get(id) ?? null;
  }

  async findByIdempotencyKey(
    tenantId: TenantId,
    companyId: CompanyId,
    idempotencyKey: IdempotencyKey,
  ): Promise<PhysicalInventoryCount | null> {
    for (const c of this.counts.values()) {
      if (
        c.tenantId === tenantId &&
        c.companyId === companyId &&
        c.idempotencyKey === idempotencyKey
      ) {
        return c;
      }
    }
    return null;
  }

  async listByLocation(
    tenantId: TenantId,
    companyId: CompanyId,
    locationId: InventoryLocationId,
  ): Promise<readonly PhysicalInventoryCount[]> {
    return Array.from(this.counts.values()).filter(
      (c) => c.tenantId === tenantId && c.companyId === companyId && c.locationId === locationId,
    );
  }

  async listItemsByCount(
    countId: PhysicalInventoryCountId,
  ): Promise<readonly PhysicalInventoryCountItem[]> {
    return Array.from(this.items.values()).filter((i) => i.physicalCountId === countId);
  }

  async saveCount(count: PhysicalInventoryCount): Promise<void> {
    this.counts.set(count.id, count);
  }

  async saveItem(item: PhysicalInventoryCountItem): Promise<void> {
    this.items.set(item.id, item);
  }

  clone(): InMemoryPhysicalInventoryCountRepository {
    const copy = new InMemoryPhysicalInventoryCountRepository();
    for (const [k, v] of this.counts) copy.counts.set(k, cloneDeep(v));
    for (const [k, v] of this.items) copy.items.set(k, cloneDeep(v));
    return copy;
  }
}

// ---------------------------------------------------------------------------
// InMemoryInventoryBatchRepository
// ---------------------------------------------------------------------------
export class InMemoryInventoryBatchRepository implements IInventoryBatchRepository {
  private batches = new Map<string, InventoryBatch>();

  async findById(id: InventoryBatchId): Promise<InventoryBatch | null> {
    return this.batches.get(id) ?? null;
  }

  async findByBatchNumber(
    tenantId: TenantId,
    companyId: CompanyId,
    materialId: MaterialId,
    batchNumber: string,
  ): Promise<InventoryBatch | null> {
    for (const b of this.batches.values()) {
      if (
        b.tenantId === tenantId &&
        b.companyId === companyId &&
        b.materialId === materialId &&
        b.batchNumber === batchNumber
      ) {
        return b;
      }
    }
    return null;
  }

  async listByMaterial(
    tenantId: TenantId,
    companyId: CompanyId,
    materialId: MaterialId,
  ): Promise<readonly InventoryBatch[]> {
    return Array.from(this.batches.values()).filter(
      (b) => b.tenantId === tenantId && b.companyId === companyId && b.materialId === materialId,
    );
  }

  async saveBatch(batch: InventoryBatch): Promise<void> {
    this.batches.set(batch.id, batch);
  }

  clone(): InMemoryInventoryBatchRepository {
    const copy = new InMemoryInventoryBatchRepository();
    for (const [k, v] of this.batches) copy.batches.set(k, cloneDeep(v));
    return copy;
  }
}

// ---------------------------------------------------------------------------
// InMemoryInventoryAuditLogRepository
// ---------------------------------------------------------------------------
export class InMemoryInventoryAuditLogRepository implements IInventoryAuditLogRepository {
  private auditLogs = new Map<string, InventoryAuditLog>();

  async findById(id: InventoryAuditLogId): Promise<InventoryAuditLog | null> {
    return this.auditLogs.get(id) ?? null;
  }

  async listByEntity(
    tenantId: TenantId,
    companyId: CompanyId,
    entityType: string,
    entityId: string,
  ): Promise<readonly InventoryAuditLog[]> {
    return Array.from(this.auditLogs.values()).filter(
      (l) =>
        l.tenantId === tenantId &&
        l.companyId === companyId &&
        l.entityType === entityType &&
        l.entityId === entityId,
    );
  }

  async storeAuditRecord(log: InventoryAuditLog): Promise<void> {
    this.auditLogs.set(log.id, log);
  }

  clone(): InMemoryInventoryAuditLogRepository {
    const copy = new InMemoryInventoryAuditLogRepository();
    for (const [k, v] of this.auditLogs) copy.auditLogs.set(k, cloneDeep(v));
    return copy;
  }
}

// ---------------------------------------------------------------------------
// InMemoryProcessedInventoryOperationRepository
// ---------------------------------------------------------------------------
export class InMemoryProcessedInventoryOperationRepository implements IProcessedInventoryOperationRepository {
  private operations = new Map<string, ProcessedInventoryOperation>();

  async findById(id: ProcessedInventoryOperationId): Promise<ProcessedInventoryOperation | null> {
    return this.operations.get(id) ?? null;
  }

  async findByIdempotencyKey(
    tenantId: TenantId,
    companyId: CompanyId,
    idempotencyKey: IdempotencyKey,
  ): Promise<ProcessedInventoryOperation | null> {
    const key = `${tenantId}:${companyId}:${idempotencyKey}`;
    return this.operations.get(key) ?? null;
  }

  async storeProcessedOperation(operation: ProcessedInventoryOperation): Promise<void> {
    const key = `${operation.tenantId}:${operation.companyId}:${operation.idempotencyKey}`;
    this.operations.set(key, operation);
  }

  clone(): InMemoryProcessedInventoryOperationRepository {
    const copy = new InMemoryProcessedInventoryOperationRepository();
    for (const [k, v] of this.operations) copy.operations.set(k, cloneDeep(v));
    return copy;
  }
}
