/**
 * Ações de Aplicação — InventoryActions
 * Categoria: application/actions
 *
 * Ponto de entrada das intenções do utilizador vindo da UI.
 * Invoca os Use Cases de Aplicação e sincroniza atomicamente a Zustand Store com os resultados.
 */

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
  ProcessDeliveryIntoInventoryUseCase,
} from "../index";

import type {
  ReceiveStockInputDTO,
  IssueStockInputDTO,
  TransferStockInputDTO,
  ReserveStockInputDTO,
  ReleaseReservationInputDTO,
  ConsumeReservationInputDTO,
  AdjustStockInputDTO,
  ReverseMovementInputDTO,
  RebuildBalancesInputDTO,
  CheckConsistencyInputDTO,
  DeliveryConfirmedIntegrationDTO,
  InventoryExecutionOutputDTO,
} from "../dto/inventory-dto";

import { inventoryStoreManager } from "../../store/inventory-store";
import type { InventoryBalanceRebuildResult } from "../../core/engine/inventory-balance-rebuilder";
import type { InventoryHealthReport } from "../../core/services/inventory-consistency-checker";

export class InventoryActions {
  constructor(
    private readonly receiveUseCase: ReceiveInventoryStockUseCase,
    private readonly issueUseCase: IssueInventoryStockUseCase,
    private readonly transferUseCase: TransferInventoryStockUseCase,
    private readonly reserveUseCase: ReserveInventoryStockUseCase,
    private readonly releaseReservationUseCase: ReleaseInventoryReservationUseCase,
    private readonly consumeReservationUseCase: ConsumeInventoryReservationUseCase,
    private readonly adjustUseCase: AdjustInventoryStockUseCase,
    private readonly reverseUseCase: ReverseInventoryMovementUseCase,
    private readonly rebuildUseCase: RebuildInventoryBalancesUseCase,
    private readonly healthUseCase: CheckInventoryConsistencyUseCase,
    private readonly deliveryUseCase?: ProcessDeliveryIntoInventoryUseCase,
  ) {}

  async receiveStock(dto: ReceiveStockInputDTO): Promise<InventoryExecutionOutputDTO> {
    const result = await this.receiveUseCase.execute(dto);
    return result;
  }

  async issueStock(dto: IssueStockInputDTO): Promise<InventoryExecutionOutputDTO> {
    const result = await this.issueUseCase.execute(dto);
    return result;
  }

  async transferStock(dto: TransferStockInputDTO): Promise<InventoryExecutionOutputDTO> {
    const result = await this.transferUseCase.execute(dto);
    return result;
  }

  async reserveStock(dto: ReserveStockInputDTO): Promise<InventoryExecutionOutputDTO> {
    const result = await this.reserveUseCase.execute(dto);
    return result;
  }

  async releaseReservation(dto: ReleaseReservationInputDTO): Promise<InventoryExecutionOutputDTO> {
    const result = await this.releaseReservationUseCase.execute(dto);
    return result;
  }

  async consumeReservation(dto: ConsumeReservationInputDTO): Promise<InventoryExecutionOutputDTO> {
    const result = await this.consumeReservationUseCase.execute(dto);
    return result;
  }

  async adjustStock(dto: AdjustStockInputDTO): Promise<InventoryExecutionOutputDTO> {
    const result = await this.adjustUseCase.execute(dto);
    return result;
  }

  async reverseMovement(dto: ReverseMovementInputDTO): Promise<InventoryExecutionOutputDTO> {
    const result = await this.reverseUseCase.execute(dto);
    return result;
  }

  async rebuildBalances(dto: RebuildBalancesInputDTO): Promise<InventoryBalanceRebuildResult> {
    const result = await this.rebuildUseCase.execute(dto);
    inventoryStoreManager.invalidateCache();
    return result;
  }

  async checkHealth(dto: CheckConsistencyInputDTO): Promise<InventoryHealthReport> {
    return this.healthUseCase.execute(dto);
  }

  async processDelivery(
    dto: DeliveryConfirmedIntegrationDTO,
  ): Promise<InventoryExecutionOutputDTO> {
    if (!this.deliveryUseCase) {
      throw new Error("Serviço de integração com entregas não foi configurado nesta instância.");
    }
    const result = await this.deliveryUseCase.execute(dto);
    return result;
  }
}
