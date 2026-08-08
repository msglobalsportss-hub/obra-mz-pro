/**
 * Manipulador de Eventos de Integração: DeliveryConfirmedEventHandler
 * Categoria: features/deliveries-integration
 *
 * Ponto de ligação (handler/listener) que subscreve ao evento de integração
 * 'deliveries.delivery_confirmed' publicado pelo módulo de Entregas e invoca o
 * ProcessDeliveryIntoInventoryUseCase para efetuar a entrada de stock atómica.
 */

import type {
  ProcessDeliveryIntoInventoryUseCase,
  DeliveryConfirmedIntegrationDTO,
} from "./process-delivery-into-inventory";
import type { DeliveryConfirmedEvent } from "../../core/events/integration-events";
import type { InventoryExecutionOutputDTO } from "../../application/dto/inventory-dto";

export class DeliveryConfirmedEventHandler {
  constructor(private readonly processDeliveryUseCase: ProcessDeliveryIntoInventoryUseCase) {}

  /**
   * Processa a mensagem/evento de integração emitido pelo módulo Deliveries.
   */
  async handleDeliveryConfirmed(
    event: DeliveryConfirmedEvent,
  ): Promise<InventoryExecutionOutputDTO> {
    const { payload, header } = event;

    const dto: DeliveryConfirmedIntegrationDTO = {
      deliveryId: payload.deliveryId,
      receiptId: payload.receiptId,
      tenantId: header.tenantId,
      companyId: header.companyId,
      supplierId: payload.supplierId,
      destinationType: payload.destinationType,
      destinationLocationId: payload.destinationLocationId,
      confirmedAt: header.occurredAt,
      confirmedByActorId: header.actorId,
      items: payload.items.map((item) => ({
        deliveryItemId: item.deliveryItemId,
        materialId: item.materialId,
        receivedQuantity: item.receivedQuantity,
        unitCost: item.unitCost,
        unitOfMeasure: item.unitOfMeasure,
        batchNumber: item.batchNumber,
        expirationDate: item.expirationDate,
      })),
    };

    return this.processDeliveryUseCase.execute(dto);
  }
}
