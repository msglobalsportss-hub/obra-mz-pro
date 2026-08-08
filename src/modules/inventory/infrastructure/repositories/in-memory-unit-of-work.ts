/**
 * Unidade de Trabalho em Memória: InMemoryUnitOfWork
 * Categoria: infrastructure/repositories
 *
 * Implementação transacional com suporte a ROLLBACK REAL por snapshotting.
 *
 * FUNCIONAMENTO DE ATOMICIDADE (Refinamento 11):
 * 1. Antes de iniciar a operação, cria um snapshot (cópia profunda) de todos os repositórios.
 * 2. Executa a função do caso de uso passando o contexto de repositórios.
 * 3. Se a operação for bem-sucedida, promove as alterações.
 * 4. Se ocorrer qualquer erro/exceção durante a operação, Restaura o estado completo de todos os
 *    repositórios para o snapshot inicial, garantindo zero vestígios parciais no repositório.
 */

import type {
  IInventoryUnitOfWork,
  InventoryRepositoryContext,
} from "../../core/domain/repositories";
import {
  InMemoryInventoryLocationRepository,
  InMemoryInventoryPolicyRepository,
  InMemoryStockMovementRepository,
  InMemoryInventoryBalanceRepository,
  InMemoryInventoryReservationRepository,
  InMemoryStockTransferRepository,
  InMemoryStockAdjustmentRepository,
  InMemoryPhysicalInventoryCountRepository,
  InMemoryInventoryBatchRepository,
  InMemoryInventoryAuditLogRepository,
  InMemoryProcessedInventoryOperationRepository,
} from "./in-memory-inventory-repositories";

export class InMemoryUnitOfWork implements IInventoryUnitOfWork {
  public locations = new InMemoryInventoryLocationRepository();
  public policies = new InMemoryInventoryPolicyRepository();
  public movements = new InMemoryStockMovementRepository();
  public balances = new InMemoryInventoryBalanceRepository();
  public reservations = new InMemoryInventoryReservationRepository();
  public transfers = new InMemoryStockTransferRepository();
  public adjustments = new InMemoryStockAdjustmentRepository();
  public physicalCounts = new InMemoryPhysicalInventoryCountRepository();
  public batches = new InMemoryInventoryBatchRepository();
  public auditLogs = new InMemoryInventoryAuditLogRepository();
  public processedOperations = new InMemoryProcessedInventoryOperationRepository();

  public get context(): InventoryRepositoryContext {
    return {
      locations: this.locations,
      policies: this.policies,
      movements: this.movements,
      balances: this.balances,
      reservations: this.reservations,
      transfers: this.transfers,
      adjustments: this.adjustments,
      physicalCounts: this.physicalCounts,
      batches: this.batches,
      auditLogs: this.auditLogs,
      processedOperations: this.processedOperations,
    };
  }

  async execute<T>(
    operation: (repositories: InventoryRepositoryContext) => Promise<T>,
  ): Promise<T> {
    // 1. Criar SNAPSHOT do estado atual de todos os repositórios
    const snapLocations = this.locations.clone();
    const snapPolicies = this.policies.clone();
    const snapMovements = this.movements.clone();
    const snapBalances = this.balances.clone();
    const snapReservations = this.reservations.clone();
    const snapTransfers = this.transfers.clone();
    const snapAdjustments = this.adjustments.clone();
    const snapPhysicalCounts = this.physicalCounts.clone();
    const snapBatches = this.batches.clone();
    const snapAuditLogs = this.auditLogs.clone();
    const snapProcessedOps = this.processedOperations.clone();

    try {
      // 2. Executar a operação atómica
      const result = await operation(this.context);
      return result;
    } catch (error) {
      // 3. ROLLBACK: Restaurar o snapshot se a operação falhou
      this.locations = snapLocations;
      this.policies = snapPolicies;
      this.movements = snapMovements;
      this.balances = snapBalances;
      this.reservations = snapReservations;
      this.transfers = snapTransfers;
      this.adjustments = snapAdjustments;
      this.physicalCounts = snapPhysicalCounts;
      this.batches = snapBatches;
      this.auditLogs = snapAuditLogs;
      this.processedOperations = snapProcessedOps;

      throw error;
    }
  }
}
