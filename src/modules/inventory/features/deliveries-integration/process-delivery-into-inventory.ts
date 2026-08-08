/**
 * Integração com Entregas: ProcessDeliveryIntoInventory
 * Categoria: features/deliveries-integration
 *
 * Mapeia entregas confirmadas (de Compras/Entregas) para entradas de stock atómicas no InventoryEngine.
 *
 * REGRAS ARQUITETURAIS (Refinamentos 7, 14, 15 e 16):
 * 1. Desacoplamento Absoluto: Consome EXCLUSIVAMENTE DTOs públicos de entregas. NUNCA importa entidades internas de Deliveries.
 * 2. Atomicidade Multilinha: Invoca o método atómico receiveStockBatch do InventoryEngine.
 *    Se qualquer linha falhar, NENHUMA entrada de stock é criada (all-or-nothing).
 * 3. Supplier Direct: Entregas diretas de fornecedor resolvem uma localização válida de obra (project location).
 *    Valida se a localização está ativa e pertence ao mesmo tenant/company.
 * 4. Idempotência por Receção: A chave de idempotência é construída de forma estável:
 *    delivery:{deliveryId}:receipt:{receiptId ?? 'default'}.
 */

import type { IInventoryEngine } from "../../core/engine/inventory-engine";
import type { ReceiveStockItemCommand } from "../../core/engine/operations/receive-stock-operation";
import type { InventoryTransactionContext } from "../../core/contracts/shared/inventory-transaction-context";
import type { IInventoryLocationRepository } from "../../core/domain/repositories";
import {
  toTenantId,
  toCompanyId,
  toMaterialId,
  toInventoryLocationId,
  toInventoryBatchId,
  toActorId,
} from "../../core/shared/primitives";
import { InventoryDeliveryAlreadyProcessedError } from "../../application/errors/inventory-application-errors";
import { nowISO } from "../../core/helpers";
import type { InventoryExecutionOutputDTO } from "../../application/dto/inventory-dto";

/** DTO Público de Entrega para Integração */
export interface DeliveryItemDTO {
  readonly deliveryItemId: string;
  readonly materialId: string;
  readonly receivedQuantity: number;
  readonly unitCost: number;
  readonly unitOfMeasure?: string;
  readonly batchNumber?: string;
  readonly expirationDate?: string;
}

export interface DeliveryConfirmedIntegrationDTO {
  readonly deliveryId: string;
  readonly receiptId?: string;
  readonly tenantId: string;
  readonly companyId: string;
  readonly supplierId?: string;
  readonly destinationType: "warehouse" | "project" | "supplier_direct" | (string & {});
  readonly destinationLocationId: string;
  readonly confirmedAt?: string;
  readonly confirmedByActorId?: string;
  readonly items: readonly DeliveryItemDTO[];
}

export class ProcessDeliveryIntoInventoryUseCase {
  constructor(
    private readonly engine: IInventoryEngine,
    private readonly locationRepository: IInventoryLocationRepository,
  ) {}

  async execute(
    deliveryDTO: DeliveryConfirmedIntegrationDTO,
  ): Promise<InventoryExecutionOutputDTO> {
    const { deliveryId, receiptId, tenantId, companyId, destinationLocationId, items } =
      deliveryDTO;

    if (!items || items.length === 0) {
      throw new Error(`A entrega '${deliveryId}' não contém itens para entrada de stock.`);
    }

    // 1. Resolver e validar a localização de destino (incluindo supplier_direct)
    const targetLocId = toInventoryLocationId(destinationLocationId);
    const location = await this.locationRepository.findById(targetLocId);

    if (!location) {
      throw new Error(
        `Localização de destino '${destinationLocationId}' não foi encontrada para a entrega '${deliveryId}'.`,
      );
    }

    if (!location.isActive) {
      throw new Error(`Localização de destino '${location.code}' está inativa.`);
    }

    if (location.tenantId !== tenantId || location.companyId !== companyId) {
      throw new Error(`Localização '${location.code}' não pertence à empresa do contexto.`);
    }

    // 2. Construir a chave de idempotência estável por receção de entrega
    const receiptKey = receiptId ? receiptId : "default";
    const idempotencyKey = `delivery:${deliveryId}:receipt:${receiptKey}`;

    // 3. Construir o InventoryTransactionContext
    const context: InventoryTransactionContext = {
      tenantId: toTenantId(tenantId),
      companyId: toCompanyId(companyId),
      actorId: deliveryDTO.confirmedByActorId
        ? toActorId(deliveryDTO.confirmedByActorId)
        : undefined,
      correlationId: `corr-delivery-${deliveryId}`,
      idempotencyKey,
      timestamp: deliveryDTO.confirmedAt ?? nowISO(),
      sourceModule: "deliveries",
      reference: {
        referenceType: "DELIVERY",
        referenceId: deliveryId,
      },
    };

    // 4. Mapear linhas para comandos atómicos de receção
    const commands: ReceiveStockItemCommand[] = items.map((item) => ({
      materialId: toMaterialId(item.materialId),
      locationId: targetLocId,
      quantity: item.receivedQuantity,
      unitCost: item.unitCost,
      movementType: "delivery_receipt",
      batchId: item.batchNumber ? toInventoryBatchId(item.batchNumber) : undefined,
      expirationDate: item.expirationDate,
      stockState: "available",
      metadata: {
        deliveryId,
        receiptId,
        deliveryItemId: item.deliveryItemId,
        supplierId: deliveryDTO.supplierId,
        unitOfMeasure: item.unitOfMeasure,
      },
    }));

    // 5. Executar a receção de stock em lote atómico no InventoryEngine
    try {
      const result = await this.engine.receiveStockBatch(context, commands);

      return {
        success: true,
        operationId: result.operationId,
        movementIds: result.movementIds,
        status: result.status,
        timestamp: result.createdAt,
        idempotencyKey,
      };
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("já está em processamento")) {
        throw new InventoryDeliveryAlreadyProcessedError(deliveryId, idempotencyKey);
      }
      throw err;
    }
  }
}
