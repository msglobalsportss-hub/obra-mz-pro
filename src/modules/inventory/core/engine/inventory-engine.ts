/**
 * Serviço Central do Domínio: InventoryEngine (FACHADA & ORQUESTRADOR)
 * Categoria: core/engine
 *
 * UNICO PONTO AUTORIZADO A PRODUZIR ALTERAÇÕES DE INVENTÁRIO NO SISTEMA.
 *
 * REGRAS ARQUITETURAIS DE FACHADA (Refinamento 1):
 * 1. O InventoryEngine NÃO contém regras de negócio próprias nem manipuladores manuais de stock.
 * 2. As suas responsabilidades são estritamente:
 *    - Coordenar a execução do caso de uso;
 *    - Verificar a idempotência antes de iniciar a transação;
 *    - Iniciar a Unit of Work (unidade de trabalho atómica);
 *    - Delegar para as operações especializadas em core/engine/operations/;
 *    - Registar o log de auditoria (InventoryAuditLog);
 *    - Registar o resultado de idempotência (ProcessedInventoryOperation);
 *    - Emitir os eventos de domínio e integração via IInventoryEventPublisher;
 *    - Devolver um resultado uniforme (InventoryOperationResult com status 'completed' ou 'replayed').
 */

import type { InventoryTransactionContext } from "../contracts/shared/inventory-transaction-context";
import type { IInventoryUnitOfWork, InventoryRepositoryContext } from "../domain/repositories";
import type { IInventoryEventPublisher } from "../events/event-publisher.interface";
import {
  ReceiveStockOperation,
  type ReceiveStockItemCommand,
  type ReceiveStockResult,
} from "./operations/receive-stock-operation";
import {
  IssueStockOperation,
  type IssueStockCommand,
  type IssueStockResult,
} from "./operations/issue-stock-operation";
import {
  TransferStockOperation,
  type TransferStockCommand,
  type TransferStockResult,
} from "./operations/transfer-stock-operation";
import {
  ReservationOperation,
  type ReserveStockCommand,
  type ReleaseReservationCommand,
  type ConsumeReservationCommand,
} from "./operations/reservation-operation";
import {
  AdjustmentOperation,
  type AdjustStockCommand,
  type AdjustStockResult,
} from "./operations/adjustment-operation";
import {
  ReverseMovementOperation,
  type ReverseMovementCommand,
  type ReverseMovementResult,
} from "./operations/reverse-movement-operation";
import {
  InventoryBalanceRebuilder,
  type InventoryBalanceRebuildParams,
  type InventoryBalanceRebuildResult,
} from "./inventory-balance-rebuilder";
import type { ProcessedInventoryOperation, InventoryAuditLog } from "../domain/entities";
import { generateInventoryId, nowISO } from "../helpers";
import {
  toProcessedInventoryOperationId,
  toInventoryAuditLogId,
  toStockMovementId,
} from "../shared/primitives";
import { InventoryOperationAlreadyProcessingError } from "../shared/errors";
import type { ISO8601String, IdempotencyKey } from "../types/aliases";

export interface InventoryOperationResultData {
  readonly operationId: string;
  readonly movementIds: readonly string[];
  readonly affectedBalanceKeys: readonly string[];
  readonly createdAt: ISO8601String;
  readonly idempotencyKey: IdempotencyKey;
  readonly status: "completed" | "replayed";
  readonly resultDetails?: unknown;
}

export interface IInventoryEngine {
  receiveStock(
    context: InventoryTransactionContext,
    command: ReceiveStockItemCommand,
  ): Promise<InventoryOperationResultData>;
  receiveStockBatch(
    context: InventoryTransactionContext,
    commands: readonly ReceiveStockItemCommand[],
  ): Promise<InventoryOperationResultData>;
  issueStock(
    context: InventoryTransactionContext,
    command: IssueStockCommand,
  ): Promise<InventoryOperationResultData>;
  transferStock(
    context: InventoryTransactionContext,
    command: TransferStockCommand,
  ): Promise<InventoryOperationResultData>;
  reserveStock(
    context: InventoryTransactionContext,
    command: ReserveStockCommand,
  ): Promise<InventoryOperationResultData>;
  releaseReservation(
    context: InventoryTransactionContext,
    command: ReleaseReservationCommand,
  ): Promise<InventoryOperationResultData>;
  consumeReservation(
    context: InventoryTransactionContext,
    command: ConsumeReservationCommand,
  ): Promise<InventoryOperationResultData>;
  adjustStock(
    context: InventoryTransactionContext,
    command: AdjustStockCommand,
  ): Promise<InventoryOperationResultData>;
  reverseMovement(
    context: InventoryTransactionContext,
    command: ReverseMovementCommand,
  ): Promise<InventoryOperationResultData>;
  rebuildBalances(
    context: InventoryTransactionContext,
    params: InventoryBalanceRebuildParams,
  ): Promise<InventoryBalanceRebuildResult>;
}

export class InventoryEngine implements IInventoryEngine {
  constructor(
    private readonly unitOfWork: IInventoryUnitOfWork,
    private readonly eventPublisher: IInventoryEventPublisher,
  ) {}

  /**
   * Receção de Stock de uma única linha.
   */
  async receiveStock(
    context: InventoryTransactionContext,
    command: ReceiveStockItemCommand,
  ): Promise<InventoryOperationResultData> {
    return this.receiveStockBatch(context, [command]);
  }

  /**
   * Receção de Stock em Lote (Atómica).
   */
  async receiveStockBatch(
    context: InventoryTransactionContext,
    commands: readonly ReceiveStockItemCommand[],
  ): Promise<InventoryOperationResultData> {
    return this.executeIdempotentOperation(context, "stock_entry", async (repos) => {
      const result = await ReceiveStockOperation.executeBatch(context, repos, commands);
      return {
        movementIds: result.movements.map((m) => m.id),
        affectedBalanceKeys: result.balances.map((b) => `${b.materialId}:${b.locationId}`),
        details: result,
      };
    });
  }

  /**
   * Saída / Consumo de Stock.
   */
  async issueStock(
    context: InventoryTransactionContext,
    command: IssueStockCommand,
  ): Promise<InventoryOperationResultData> {
    return this.executeIdempotentOperation(context, "stock_consumption", async (repos) => {
      const result = await IssueStockOperation.execute(context, repos, command);
      return {
        movementIds: [result.movement.id],
        affectedBalanceKeys: [`${result.balance.materialId}:${result.balance.locationId}`],
        details: result,
      };
    });
  }

  /**
   * Transferência entre Localizações.
   */
  async transferStock(
    context: InventoryTransactionContext,
    command: TransferStockCommand,
  ): Promise<InventoryOperationResultData> {
    return this.executeIdempotentOperation(context, "stock_transfer", async (repos) => {
      const result = await TransferStockOperation.execute(context, repos, command);
      return {
        movementIds: [result.transferOutMovement.id, result.transferInMovement.id],
        affectedBalanceKeys: [
          `${result.sourceBalance.materialId}:${result.sourceBalance.locationId}`,
          `${result.destinationBalance.materialId}:${result.destinationBalance.locationId}`,
        ],
        details: result,
      };
    });
  }

  /**
   * Reserva de Stock.
   */
  async reserveStock(
    context: InventoryTransactionContext,
    command: ReserveStockCommand,
  ): Promise<InventoryOperationResultData> {
    return this.executeIdempotentOperation(context, "stock_reservation", async (repos) => {
      const result = await ReservationOperation.reserve(context, repos, command);
      return {
        movementIds: [result.movement.id],
        affectedBalanceKeys: [`${result.balance.materialId}:${result.balance.locationId}`],
        details: result,
      };
    });
  }

  /**
   * Libertação de Reserva.
   */
  async releaseReservation(
    context: InventoryTransactionContext,
    command: ReleaseReservationCommand,
  ): Promise<InventoryOperationResultData> {
    return this.executeIdempotentOperation(context, "stock_reservation_release", async (repos) => {
      const result = await ReservationOperation.release(context, repos, command);
      return {
        movementIds: [result.movement.id],
        affectedBalanceKeys: [`${result.balance.materialId}:${result.balance.locationId}`],
        details: result,
      };
    });
  }

  /**
   * Consumo de Reserva.
   */
  async consumeReservation(
    context: InventoryTransactionContext,
    command: ConsumeReservationCommand,
  ): Promise<InventoryOperationResultData> {
    return this.executeIdempotentOperation(context, "stock_consumption", async (repos) => {
      const result = await ReservationOperation.consume(context, repos, command);
      return {
        movementIds: [result.movement.id],
        affectedBalanceKeys: [`${result.balance.materialId}:${result.balance.locationId}`],
        details: result,
      };
    });
  }

  /**
   * Ajuste de Stock (Positivo ou Negativo).
   */
  async adjustStock(
    context: InventoryTransactionContext,
    command: AdjustStockCommand,
  ): Promise<InventoryOperationResultData> {
    return this.executeIdempotentOperation(context, "stock_adjustment", async (repos) => {
      const result = await AdjustmentOperation.execute(context, repos, command);
      return {
        movementIds: result.movements.map((m) => m.id),
        affectedBalanceKeys: result.balances.map((b) => `${b.materialId}:${b.locationId}`),
        details: result,
      };
    });
  }

  /**
   * Reversão / Estorno de Movimento.
   */
  async reverseMovement(
    context: InventoryTransactionContext,
    command: ReverseMovementCommand,
  ): Promise<InventoryOperationResultData> {
    return this.executeIdempotentOperation(context, "stock_adjustment", async (repos) => {
      const result = await ReverseMovementOperation.execute(context, repos, command);
      return {
        movementIds: [result.reversalMovement.id],
        affectedBalanceKeys: [`${result.balance.materialId}:${result.balance.locationId}`],
        details: result,
      };
    });
  }

  /**
   * Reconstrução Determinística de Saldos.
   */
  async rebuildBalances(
    context: InventoryTransactionContext,
    params: InventoryBalanceRebuildParams,
  ): Promise<InventoryBalanceRebuildResult> {
    return this.unitOfWork.execute(async (repos) => {
      const result = await InventoryBalanceRebuilder.rebuild(context, repos, params);
      await this.eventPublisher.publishCollectedEvents();
      return result;
    });
  }

  // ---------------------------------------------------------------------------
  // TEMPLATE METHOD DE ATOMICIDADE E IDEMPOTÊNCIA
  // ---------------------------------------------------------------------------

  private async executeIdempotentOperation(
    context: InventoryTransactionContext,
    operationType: InventoryOperationType,
    operationFn: (
      repos: InventoryRepositoryContext,
    ) => Promise<{ movementIds: string[]; affectedBalanceKeys: string[]; details: unknown }>,
  ): Promise<InventoryOperationResultData> {
    const now = nowISO();
    const idempotencyKey = context.idempotencyKey;

    return this.unitOfWork.execute(async (repos) => {
      // 1. Verificar se a operação já foi processada anteriormente (IDEMPOTÊNCIA)
      const existingOp = await repos.processedOperations.findByIdempotencyKey(
        context.tenantId,
        context.companyId,
        idempotencyKey,
      );

      if (existingOp) {
        if (existingOp.status === "completed") {
          // Retornar resultado 'replayed' sem recriar movimentos
          return {
            operationId: existingOp.id,
            movementIds: existingOp.resultReferenceId ? [existingOp.resultReferenceId] : [],
            affectedBalanceKeys: [],
            createdAt: existingOp.createdAt,
            idempotencyKey,
            status: "replayed",
          };
        }

        if (existingOp.status === "processing") {
          throw new InventoryOperationAlreadyProcessingError(idempotencyKey);
        }

        if (existingOp.status === "failed") {
          throw new Error(
            `A operação com a chave '${idempotencyKey}' falhou anteriormente: ${existingOp.failureMessage ?? "erro desconhecido"}. Exija nova chave.`,
          );
        }
      }

      // 2. Registar estado em processamento
      const opId = toProcessedInventoryOperationId(generateInventoryId("op"));
      const initialOpRecord: ProcessedInventoryOperation = Object.freeze({
        id: opId,
        tenantId: context.tenantId,
        companyId: context.companyId,
        idempotencyKey,
        operationType,
        referenceType: (context.reference?.referenceType as InventoryReferenceType) ?? "system",
        referenceId: context.reference?.referenceId ?? idempotencyKey,
        correlationId: context.correlationId,
        status: "processing",
        processingStartedAt: now,
        processedAt: now,
        createdAt: now,
      });

      await repos.processedOperations.storeProcessedOperation(initialOpRecord);

      try {
        // 3. Executar a operação especializada de domínio
        const opResult = await operationFn(repos);

        // 4. Criar o registo de auditoria (InventoryAuditLog)
        const auditLog: InventoryAuditLog = Object.freeze({
          id: toInventoryAuditLogId(generateInventoryId("aud")),
          tenantId: context.tenantId,
          companyId: context.companyId,
          entityType: "stock_movement",
          entityId: opResult.movementIds[0] ?? opId,
          action: "confirmed",
          actorId: context.actorId,
          correlationId: context.correlationId,
          causationId: context.causationId,
          referenceType: (context.reference?.referenceType as InventoryReferenceType) ?? "system",
          referenceId: context.reference?.referenceId ?? idempotencyKey,
          occurredAt: now,
          metadata: { operationType, movementIds: opResult.movementIds },
        });

        await repos.auditLogs.storeAuditRecord(auditLog);

        // 5. Atualizar o registo de idempotência para 'completed'
        const completedOpRecord: ProcessedInventoryOperation = Object.freeze({
          ...initialOpRecord,
          status: "completed",
          resultReferenceId: opResult.movementIds[0],
          completedAt: nowISO(),
        });

        await repos.processedOperations.storeProcessedOperation(completedOpRecord);

        // 6. Publicar eventos de integração coletados pós-commit
        await this.eventPublisher.publishCollectedEvents();

        return {
          operationId: opId,
          movementIds: opResult.movementIds,
          affectedBalanceKeys: opResult.affectedBalanceKeys,
          createdAt: now,
          idempotencyKey,
          status: "completed",
          resultDetails: opResult.details,
        };
      } catch (err: unknown) {
        // Em caso de falha, registar o insucesso se possível ou propagar erro para o rollback da UoW
        const failureMessage = err instanceof Error ? err.message : String(err);
        const failedOpRecord: ProcessedInventoryOperation = Object.freeze({
          ...initialOpRecord,
          status: "failed",
          failureCode: "OPERATION_FAILED",
          failureMessage,
          completedAt: nowISO(),
        });
        // Tentar armazenar o estado falhado (dependerá do rollback da UoW)
        try {
          await repos.processedOperations.storeProcessedOperation(failedOpRecord);
        } catch {
          // Ignorar erro no salvamento do estado de falha para permitir rollback
        }
        throw err;
      }
    });
  }
}
