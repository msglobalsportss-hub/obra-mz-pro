/**
 * Container de Injeção de Ações — actionContainer
 * Categoria: application/actions
 *
 * Instancia o InventoryEngine, UnitOfWork, EventPublisher e Use Cases de Aplicação,
 * expondo uma instância pronta do InventoryActions para os hooks React e componentes.
 */

import { InMemoryUnitOfWork } from "../../infrastructure/repositories/in-memory-unit-of-work";
import { InMemoryEventPublisher } from "../../infrastructure/event-bus/in-memory-event-publisher";
import { InventoryEngine } from "../../core/engine/inventory-engine";
import {
  ReceiveInventoryStockUseCase,
  IssueInventoryStockUseCase,
  TransferInventoryStockUseCase,
  ReserveInventoryStockUseCase,
  ReleaseInventoryReservationUseCase,
  ConsumeInventoryReservationUseCase,
  AdjustInventoryStockUseCase,
  ReverseInventoryMovementUseCase,
  RebuildInventoryBalancesUseCase,
  CheckInventoryConsistencyUseCase,
} from "../index";
import { ProcessDeliveryIntoInventoryUseCase } from "../../features/deliveries-integration/process-delivery-into-inventory";
import { InventoryActions } from "./inventory-actions";

// Instâncias de Infraestrutura
export const defaultUnitOfWork = new InMemoryUnitOfWork();
export const defaultEventPublisher = new InMemoryEventPublisher();
export const defaultInventoryEngine = new InventoryEngine(defaultUnitOfWork, defaultEventPublisher);

// Use Cases
export const receiveStockUseCase = new ReceiveInventoryStockUseCase(defaultInventoryEngine);
export const issueStockUseCase = new IssueInventoryStockUseCase(defaultInventoryEngine);
export const transferStockUseCase = new TransferInventoryStockUseCase(defaultInventoryEngine);
export const reserveStockUseCase = new ReserveInventoryStockUseCase(defaultInventoryEngine);
export const releaseReservationUseCase = new ReleaseInventoryReservationUseCase(
  defaultInventoryEngine,
);
export const consumeReservationUseCase = new ConsumeInventoryReservationUseCase(
  defaultInventoryEngine,
);
export const adjustStockUseCase = new AdjustInventoryStockUseCase(defaultInventoryEngine);
export const reverseMovementUseCase = new ReverseInventoryMovementUseCase(defaultInventoryEngine);
export const rebuildBalancesUseCase = new RebuildInventoryBalancesUseCase(defaultInventoryEngine);
export const checkHealthUseCase = new CheckInventoryConsistencyUseCase(defaultUnitOfWork.context);
export const processDeliveryUseCase = new ProcessDeliveryIntoInventoryUseCase(
  defaultInventoryEngine,
  defaultUnitOfWork.locations,
);

// Instância Global de Ações
export const inventoryActions = new InventoryActions(
  receiveStockUseCase,
  issueStockUseCase,
  transferStockUseCase,
  reserveStockUseCase,
  releaseReservationUseCase,
  consumeReservationUseCase,
  adjustStockUseCase,
  reverseMovementUseCase,
  rebuildBalancesUseCase,
  checkHealthUseCase,
  processDeliveryUseCase,
);
