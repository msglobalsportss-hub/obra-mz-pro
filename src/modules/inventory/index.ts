/**
 * API PÚBLICA ÚNICA DO MÓDULO DE INVENTÁRIO (ObraMZ) — Fase 2B
 *
 * Módulos externos (Compras, Obras, Deliveries, Financeiro, etc.) devem importar
 * EXCLUSIVAMENTE deste ficheiro público:
 *   import { ... } from '@/modules/inventory';
 *
 * REGRAS DE ENCAPSULAMENTO PÚBLICO (Refinamento 12 & Ponto 16):
 * Qualquer novo serviço criado é CONSIDERADO INTERNO POR DEFEITO.
 * Apenas os Use Cases de Aplicação, DTOs Públicos, Eventos de Integração e Selectors da UI
 * São expostos para módulos externos.
 *
 * NÃO SÃO EXPOSTOS:
 * - Classe concreta InventoryEngine (exposta apenas a interface IInventoryEngine)
 * - Repositórios e Unit of Work (interfaces ou implementações em memória)
 * - Factories (StockMovementFactory)
 * - Resolvers internos (BalanceKeyResolver)
 * - Registos de idempotência internos (ProcessedInventoryOperation)
 * - Métodos diretos de mutação da Zustand store (setState, getState)
 */

// ---------------------------------------------------------------------------
// 1. Casos de Uso de Aplicação (Use Cases) & DTOs
// ---------------------------------------------------------------------------
export type {
  BaseInventoryRequestDTO,
  ReceiveStockInputDTO,
  IssueStockInputDTO,
  TransferStockInputDTO,
  ReserveStockInputDTO,
  ReleaseReservationInputDTO,
  ConsumeReservationInputDTO,
  AdjustStockInputDTO,
  AdjustmentItemDTO,
  ReverseMovementInputDTO,
  InventoryExecutionOutputDTO,
} from "./application/dto/inventory-dto";

export { ReceiveInventoryStockUseCase } from "./application/use-cases/receive-inventory-stock.use-case";
export { IssueInventoryStockUseCase } from "./application/use-cases/issue-inventory-stock.use-case";
export { TransferInventoryStockUseCase } from "./application/use-cases/transfer-inventory-stock.use-case";
export { ReserveInventoryStockUseCase } from "./application/use-cases/reserve-inventory-stock.use-case";
export { ReleaseInventoryReservationUseCase } from "./application/use-cases/release-inventory-reservation.use-case";
export { ConsumeInventoryReservationUseCase } from "./application/use-cases/consume-inventory-reservation.use-case";
export { AdjustInventoryStockUseCase } from "./application/use-cases/adjust-inventory-stock.use-case";
export { ReverseInventoryMovementUseCase } from "./application/use-cases/reverse-inventory-movement.use-case";
export { RebuildInventoryBalancesUseCase } from "./application/use-cases/rebuild-inventory-balances.use-case";
export { CheckInventoryConsistencyUseCase } from "./application/use-cases/check-inventory-consistency.use-case";

// ---------------------------------------------------------------------------
// 2. Integração com Entregas (Deliveries Integration)
// ---------------------------------------------------------------------------
export type {
  DeliveryConfirmedIntegrationDTO,
  DeliveryItemDTO,
} from "./features/deliveries-integration/process-delivery-into-inventory";
export { ProcessDeliveryIntoInventoryUseCase } from "./features/deliveries-integration/process-delivery-into-inventory";
export { DeliveryConfirmedEventHandler } from "./features/deliveries-integration/delivery-confirmed.handler";

// ---------------------------------------------------------------------------
// 3. Contratos Públicos Externos & Partilhados
// ---------------------------------------------------------------------------
export type {
  InventoryBalanceQueryRequest,
  InventoryBalanceDTO,
  StockEntryRequest,
  StockConsumptionRequest,
  StockTransferRequest,
  StockOperationResult,
} from "./core/contracts/external";

export type {
  InventoryCorrelationContext,
  InventoryEventMetadata,
  InventoryReference,
  InventoryOperationResult,
  InventoryTransactionContext,
} from "./core/contracts/shared";

// ---------------------------------------------------------------------------
// 4. Eventos de Integração Públicos
// ---------------------------------------------------------------------------
export type {
  DeliveryConfirmedPayload,
  DeliveryConfirmedEvent,
  PurchaseOrderApprovedPayload,
  PurchaseOrderApprovedEvent,
  ConsumptionRegisteredPayload,
  ConsumptionRegisteredEvent,
  InventoryTransferCompletedPayload,
  InventoryTransferCompletedEvent,
} from "./core/events/integration-events";

export { InventoryIntegrationEventTypes } from "./core/events/event-types";

// ---------------------------------------------------------------------------
// 5. Store Reativa (View Models & Selectors Puros)
// ---------------------------------------------------------------------------
export type {
  InventoryStoreState,
  InventoryBalanceView,
  StockMovementView,
  InventoryReservationView,
  StockTransferView,
  StockAdjustmentView,
  InventoryLocationView,
  InventoryBatchView,
} from "./store/inventory-store.types";

export { inventoryStoreManager } from "./store/inventory-store";
export { InventorySelectors } from "./store/inventory-selectors";

// ---------------------------------------------------------------------------
// 6. Interface Pública do Engine (sem expor classe concreta)
// ---------------------------------------------------------------------------
export type {
  IInventoryEngine,
  InventoryOperationResultData,
} from "./core/engine/inventory-engine";

// ---------------------------------------------------------------------------
// 7. Tipos Públicos de Enumeração e Localização
// ---------------------------------------------------------------------------
export type {
  StandardInventoryLocationType,
  InventoryLocationType,
  InventoryLocationRef,
} from "./core/types/locations";

export type {
  InventoryCostingMethod,
  StockMovementType,
  InventoryStockState,
  InventoryReservationStatus,
  StockTransferStatus,
  StockAdjustmentStatus,
  PhysicalInventoryCountStatus,
  InventoryReferenceType,
  InventoryOperationType,
} from "./core/types/enums";

export type {
  Quantity,
  UnitPrice,
  MoneyAmount,
  ISO8601String,
  CorrelationId,
  IdempotencyKey,
} from "./core/types/aliases";

// ---------------------------------------------------------------------------
// 8. Camada de UI, Ações e Hooks Públicos da Fase 3
// ---------------------------------------------------------------------------
export { InventoryActions } from "./application/actions/inventory-actions";
export { inventoryActions } from "./application/actions/action-container";
export { InventoryErrorPresenter } from "./application/presenters/inventory-error-presenter";
export { useInventoryPermissions } from "./hooks/use-inventory-permissions";
export { useInventoryOperation } from "./hooks/use-inventory-operation";
