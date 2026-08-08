/**
 * Entidade de Domínio: ProcessedInventoryOperation
 * Categoria: State / Inventory
 *
 * Registo de idempotência para operações de inventário.
 *
 * Garante que a mesma operação não é processada duas vezes.
 *
 * PREPARAÇÃO FUTURA (PROCESSAMENTO ASSÍNCRONO / RETRIES):
 * Os campos processingStartedAt, completedAt e retryCount são opcionais
 * para preparação de workers assíncronos e políticas de retry em fases futuras.
 */

import type {
  ProcessedInventoryOperationId,
  TenantId,
  CompanyId,
} from "../../../shared/primitives";
import type { CorrelationId, IdempotencyKey, ISO8601String } from "../../../types/aliases";
import type {
  InventoryOperationType,
  InventoryReferenceType,
  ProcessedOperationStatus,
} from "../../../types/enums";

export interface ProcessedInventoryOperation {
  readonly id: ProcessedInventoryOperationId;
  readonly tenantId: TenantId;
  readonly companyId: CompanyId;

  readonly idempotencyKey: IdempotencyKey;
  readonly operationType: InventoryOperationType;

  readonly referenceType?: InventoryReferenceType;
  readonly referenceId?: string;

  readonly correlationId?: CorrelationId;

  readonly status: ProcessedOperationStatus;

  readonly resultReferenceId?: string;

  readonly failureCode?: string;
  readonly failureMessage?: string;

  /** Timestamp em que o processamento foi iniciado (Preparação Futura) */
  readonly processingStartedAt?: ISO8601String;

  /** Timestamp em que o processamento foi finalizado (Preparação Futura) */
  readonly completedAt?: ISO8601String;

  /** Número de tentativas de reprocessamento efetuadas (Preparação Futura) */
  readonly retryCount?: number;

  readonly processedAt: ISO8601String;
  readonly createdAt: ISO8601String;
}
