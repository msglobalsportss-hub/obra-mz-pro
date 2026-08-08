/**
 * Contrato Central: InventoryTransactionContext
 *
 * Representa o contexto completo de uma operação de inventário.
 * Evita a passagem de dezenas de parâmetros individuais entre serviços.
 *
 * PROPRIEDADE E RESPONSABILIDADE (OWNERSHIP):
 * 1. O contexto é criado EXCLUSIVAMENTE pela camada Application (ou handlers/facades).
 * 2. O domínio e o Inventory Engine apenas CONSUMEM este objeto como parâmetro de leitura.
 * 3. As entidades de domínio NUNCA devem criar nem modificar este contexto.
 *
 * OBSERVABILIDADE & TRACING:
 * Os campos opcionais requestId e traceId preparam a arquitetura para observabilidade,
 * tracing distribuído (OpenTelemetry/Jaeger), logs centralizados e sincronização offline.
 */

import type { ActorId, CompanyId, TenantId } from "../../shared/primitives";
import type {
  CausationId,
  CorrelationId,
  ISO8601String,
  IdempotencyKey,
} from "../../types/aliases";
import type { InventoryReference } from "./index";

export interface InventoryTransactionContext {
  readonly tenantId: TenantId;
  readonly companyId: CompanyId;

  readonly actorId?: ActorId;

  readonly correlationId: CorrelationId;
  readonly causationId?: CausationId;

  readonly idempotencyKey: IdempotencyKey;

  readonly timestamp: ISO8601String;

  readonly sourceModule: string;

  readonly reference?: InventoryReference;

  /** Identificador único do pedido HTTP/gRPC para observabilidade (opcional) */
  readonly requestId?: string;

  /** Identificador de rastreio distribuído para OpenTelemetry / APM (opcional) */
  readonly traceId?: string;
}
