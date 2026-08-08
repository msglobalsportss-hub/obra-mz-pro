/**
 * Contrato de Unit of Work para operações atómicas de Inventário (ADR-010).
 *
 * NOTA TÉCNICA DE COMPOSIÇÃO E OPERAÇÕES COMPOSTAS:
 * 1. O contrato de Unit of Work é projetado para suportar operações compostas que envolvam
 *    múltiplos repositórios numa única transação atómica (ex: verificação de idempotência +
 *    criação de movimento + atualização de saldo + registo de auditoria).
 * 2. Suporta composição futura de casos de uso complexos (ex: confirmação de entrega com
 *    múltiplos itens e destinos heterogéneos).
 * 3. A implementação concreta da infraestrutura (ex: Supabase, SQL) deverá permitir
 *    operações aninhadas (nested transactions ou savepoints) caso o adaptador venha a suportar.
 * 4. A assinatura pública execute<T>() permanece neutra e independente de tecnologia.
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
} from "./inventory-repositories.interface";

/**
 * Contexto de repositórios disponível dentro de uma Unit of Work.
 * Agrupa todos os repositórios necessários para uma operação atómica.
 */
export interface InventoryRepositoryContext {
  readonly locations: IInventoryLocationRepository;
  readonly policies: IInventoryPolicyRepository;
  readonly movements: IStockMovementRepository;
  readonly balances: IInventoryBalanceRepository;
  readonly reservations: IInventoryReservationRepository;
  readonly transfers: IStockTransferRepository;
  readonly adjustments: IStockAdjustmentRepository;
  readonly physicalCounts: IPhysicalInventoryCountRepository;
  readonly batches: IInventoryBatchRepository;
  readonly auditLogs: IInventoryAuditLogRepository;
  readonly processedOperations: IProcessedInventoryOperationRepository;
}

/**
 * Contrato de Unit of Work.
 * Garante atomicidade de operações simples ou compostas.
 */
export interface IInventoryUnitOfWork {
  execute<T>(operation: (repositories: InventoryRepositoryContext) => Promise<T>): Promise<T>;
}
