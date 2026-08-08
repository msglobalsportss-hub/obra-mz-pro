/**
 * Fábrica de Domínio: StockMovementFactory
 * Categoria: core/domain/factories
 *
 * UNICO FICHEIRO AUTORIZADO para construção de entidades StockMovement.
 *
 * REGRAS DE FACTORY PURA:
 * 1. Constrói um objeto StockMovement imutável e estruturalmente válido.
 * 2. Calcula totalCost = quantity × unitCost.
 * 3. Copia metadados de rastreabilidade do InventoryTransactionContext.
 * 4. NUNCA infere regras de negócio (não decide stockState, não escolhe locationId,
 *    não assume batchId, não consulta repositórios e não acede a stores).
 * 5. Garante que todos os campos obrigatórios estão preenchidos antes de instanciar.
 */

import type { StockMovement } from "../entities";
import type {
  StockMovementId,
  InventoryLocationId,
  MaterialId,
  InventoryBatchId,
} from "../../shared/primitives";
import { toStockMovementId } from "../../shared/primitives";
import { generateInventoryId, nowISO } from "../../helpers";
import type {
  StockMovementType,
  StockMovementStatus,
  InventoryStockState,
  InventoryReferenceType,
} from "../../types/enums";
import type { InventoryTransactionContext } from "../../contracts/shared/inventory-transaction-context";
import { InvalidInventoryCostError, InvalidInventoryQuantityError } from "../../shared/errors";
import { validateNonEmptyId } from "../../validation";

export interface CreateStockMovementParams {
  readonly context: InventoryTransactionContext;
  readonly materialId: MaterialId;
  readonly movementType: StockMovementType;
  readonly quantity: number;
  readonly unitCost?: number;
  readonly sourceLocationId?: InventoryLocationId;
  readonly destinationLocationId?: InventoryLocationId;
  readonly stockState?: InventoryStockState;
  readonly batchId?: InventoryBatchId;
  readonly expirationDate?: string;
  readonly resultingAverageCost?: number;
  readonly status?: StockMovementStatus;
  readonly reversalOfMovementId?: StockMovementId;
  readonly customMovementId?: StockMovementId;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export class StockMovementFactory {
  /**
   * Constrói uma entidade StockMovement imutável e validada.
   */
  static create(params: CreateStockMovementParams): StockMovement {
    const { context, materialId, movementType, quantity, unitCost } = params;

    // 1. Validar identificadores essenciais
    const matErr = validateNonEmptyId(materialId, "materialId");
    if (matErr) throw new Error(matErr.message);

    const tenantErr = validateNonEmptyId(context.tenantId, "tenantId");
    if (tenantErr) throw new Error(tenantErr.message);

    const compErr = validateNonEmptyId(context.companyId, "companyId");
    if (compErr) throw new Error(compErr.message);

    const idemErr = validateNonEmptyId(context.idempotencyKey, "idempotencyKey");
    if (idemErr) throw new Error(idemErr.message);

    // 2. Validar quantidade estritamente positiva (> 0)
    if (typeof quantity !== "number" || !Number.isFinite(quantity) || quantity <= 0) {
      throw new InvalidInventoryQuantityError("quantity", quantity);
    }

    // 3. Validar custo unitário não-negativo (>= 0), se fornecido
    if (unitCost !== undefined) {
      if (typeof unitCost !== "number" || !Number.isFinite(unitCost) || unitCost < 0) {
        throw new InvalidInventoryCostError("unitCost", unitCost);
      }
    }

    const safeUnitCost = unitCost !== undefined ? unitCost : 0;
    const totalCost = quantity * safeUnitCost;

    // 4. Extrair referência do contexto ou fallback seguro
    const refType: InventoryReferenceType =
      (context.reference?.referenceType as InventoryReferenceType) ?? "system";
    const refId: string = context.reference?.referenceId ?? context.idempotencyKey;

    const id = params.customMovementId ?? toStockMovementId(generateInventoryId("mov"));
    const createdAt = nowISO();
    const occurredAt = context.timestamp ?? createdAt;

    const movement: StockMovement = {
      id,
      tenantId: context.tenantId,
      companyId: context.companyId,
      materialId,
      movementType,
      status: params.status ?? "confirmed",
      sourceLocationId: params.sourceLocationId,
      destinationLocationId: params.destinationLocationId,
      quantity,
      unitCost: safeUnitCost,
      totalCost,
      resultingAverageCost: params.resultingAverageCost,
      stockState: params.stockState ?? "available",
      batchId: params.batchId,
      expirationDate: params.expirationDate,
      referenceType: refType,
      referenceId: refId,
      correlationId: context.correlationId,
      causationId: context.causationId,
      idempotencyKey: context.idempotencyKey,
      occurredAt,
      confirmedAt: params.status === "confirmed" || !params.status ? occurredAt : undefined,
      createdAt,
      createdBy: context.actorId,
      reversalOfMovementId: params.reversalOfMovementId,
      metadata: params.metadata,
    };

    return Object.freeze(movement);
  }
}
