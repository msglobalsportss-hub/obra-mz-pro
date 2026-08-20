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

import type { IInventoryUnitOfWork } from "../../core/domain/repositories";

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
    private readonly unitOfWork?: IInventoryUnitOfWork,
  ) {}

  private async _syncStore(): Promise<void> {
    if (this.unitOfWork && typeof (this.unitOfWork as any).balances?.findAll === "function") {
      await inventoryStoreManager.syncFromUnitOfWork(this.unitOfWork);
    }
  }

  async receiveStock(dto: ReceiveStockInputDTO): Promise<InventoryExecutionOutputDTO> {
    const result = await this.receiveUseCase.execute(dto);
    if (result.success) await this._syncStore();
    return result;
  }

  async issueStock(dto: IssueStockInputDTO): Promise<InventoryExecutionOutputDTO> {
    const result = await this.issueUseCase.execute(dto);
    if (result.success) await this._syncStore();
    return result;
  }

  async transferStock(dto: TransferStockInputDTO): Promise<InventoryExecutionOutputDTO> {
    const result = await this.transferUseCase.execute(dto);
    if (result.success) await this._syncStore();
    return result;
  }

  async reserveStock(dto: ReserveStockInputDTO): Promise<InventoryExecutionOutputDTO> {
    const result = await this.reserveUseCase.execute(dto);
    if (result.success) await this._syncStore();
    return result;
  }

  async releaseReservation(dto: ReleaseReservationInputDTO): Promise<InventoryExecutionOutputDTO> {
    const result = await this.releaseReservationUseCase.execute(dto);
    if (result.success) await this._syncStore();
    return result;
  }

  async consumeReservation(dto: ConsumeReservationInputDTO): Promise<InventoryExecutionOutputDTO> {
    const result = await this.consumeReservationUseCase.execute(dto);
    if (result.success) await this._syncStore();
    return result;
  }

  async adjustStock(dto: AdjustStockInputDTO): Promise<InventoryExecutionOutputDTO> {
    const result = await this.adjustUseCase.execute(dto);
    if (result.success) await this._syncStore();
    return result;
  }

  async reverseMovement(dto: ReverseMovementInputDTO): Promise<InventoryExecutionOutputDTO> {
    const result = await this.reverseUseCase.execute(dto);
    if (result.success) await this._syncStore();
    return result;
  }

  async rebuildBalances(dto: RebuildBalancesInputDTO): Promise<InventoryBalanceRebuildResult> {
    const result = await this.rebuildUseCase.execute(dto);
    if (this.unitOfWork) await this._syncStore();
    else inventoryStoreManager.invalidateCache();
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
    if (result.success) await this._syncStore();
    return result;
  }
}
