/**
 * Unit of Work Supabase com Stored Procedures PL/pgSQL
 * Categoria: infrastructure/repositories/supabase
 */

import { supabase } from "@/integrations/supabase/client";
import type { IInventoryUnitOfWork, InventoryRepositoryContext } from "../../core/domain/repositories";
import type { DomainEvent } from "../../core/domain/events";
import { SupabaseInventoryLocationRepository } from "./supabase-inventory-location-repository";
import { SupabaseInventoryBalanceRepository } from "./supabase-inventory-balance-repository";
import { SupabaseStockMovementRepository } from "./supabase-stock-movement-repository";
import { SupabaseStockTransferRepository } from "./supabase-stock-transfer-repository";
import { SupabaseInventoryBatchRepository } from "./supabase-inventory-batch-repository";

import {
  InMemoryInventoryPolicyRepository,
  InMemoryInventoryReservationRepository,
  InMemoryStockAdjustmentRepository,
  InMemoryPhysicalInventoryCountRepository,
  InMemoryInventoryAuditLogRepository,
  InMemoryProcessedInventoryOperationRepository,
} from "../in-memory-inventory-repositories";

export class SupabaseUnitOfWork implements IInventoryUnitOfWork {
  readonly locations = new SupabaseInventoryLocationRepository();
  readonly balances = new SupabaseInventoryBalanceRepository();
  readonly movements = new SupabaseStockMovementRepository();
  readonly transfers = new SupabaseStockTransferRepository();
  readonly batches = new SupabaseInventoryBatchRepository();

  readonly policies = new InMemoryInventoryPolicyRepository();
  readonly reservations = new InMemoryInventoryReservationRepository();
  readonly adjustments = new InMemoryStockAdjustmentRepository();
  readonly physicalCounts = new InMemoryPhysicalInventoryCountRepository();
  readonly auditLogs = new InMemoryInventoryAuditLogRepository();
  readonly processedOperations = new InMemoryProcessedInventoryOperationRepository();

  private collectedEvents: DomainEvent[] = [];

  get context(): InventoryRepositoryContext {
    return {
      locations: this.locations,
      policies: this.policies,
      movements: this.movements,
      balances: this.balances,
      reservations: this.reservations,
      transfers: this.transfers,
      adjustments: this.adjustments,
      physicalCounts: this.physicalCounts,
      batches: this.batches,
      auditLogs: this.auditLogs,
      processedOperations: this.processedOperations,
    };
  }

  async execute<T>(work: (repos: InventoryRepositoryContext) => Promise<T>): Promise<T> {
    return await work(this.context);
  }

  collectEvent(event: DomainEvent): void {
    this.collectedEvents.push(event);
  }

  getCollectedEvents(): readonly DomainEvent[] {
    return [...this.collectedEvents];
  }

  clearCollectedEvents(): void {
    this.collectedEvents = [];
  }

  // RPC 1: RECEIPT BATCH
  async processReceiptBatchRPC(
    companyId: string,
    deliveryId: string,
    idempotencyKey: string,
    notes: string,
    items: Array<{
      deliveryItemId: string;
      acceptedQuantity: number;
      rejectedQuantity: number;
      rejectionReason?: string;
    }>
  ) {
    const { data, error } = await (supabase as any).rpc("rpc_process_receipt_batch", {
      p_company_id: companyId,
      p_delivery_id: deliveryId,
      p_idempotency_key: idempotencyKey,
      p_notes: notes,
      p_items: items,
    });
    if (error) throw new Error(`Erro RPC Supabase rpc_process_receipt_batch: ${error.message}`);
    return data;
  }

  // RPC 2: DISPATCH STOCK TRANSFER
  async dispatchStockTransferRPC(
    companyId: string,
    transferId: string,
    idempotencyKey: string,
    items: Array<{ materialId: string; quantity: number }>
  ) {
    const { data, error } = await (supabase as any).rpc("rpc_dispatch_stock_transfer", {
      p_company_id: companyId,
      p_transfer_id: transferId,
      p_idempotency_key: idempotencyKey,
      p_items: items,
    });
    if (error) throw new Error(`Erro RPC Supabase rpc_dispatch_stock_transfer: ${error.message}`);
    return data;
  }

  // RPC 3: CONFIRM STOCK TRANSFER RECEIPT
  async confirmStockTransferReceiptRPC(
    companyId: string,
    transferId: string,
    idempotencyKey: string
  ) {
    const { data, error } = await (supabase as any).rpc("rpc_confirm_stock_transfer_receipt", {
      p_company_id: companyId,
      p_transfer_id: transferId,
      p_idempotency_key: idempotencyKey,
    });
    if (error) throw new Error(`Erro RPC Supabase rpc_confirm_stock_transfer_receipt: ${error.message}`);
    return data;
  }

  // RPC 4: PROJECT MATERIAL CONSUMPTION
  async recordProjectMaterialConsumptionRPC(
    companyId: string,
    projectId: string,
    materialId: string,
    sourceLocationId: string,
    quantity: number,
    phaseId: string | undefined,
    idempotencyKey: string
  ) {
    const { data, error } = await (supabase as any).rpc("rpc_record_project_material_consumption", {
      p_company_id: companyId,
      p_project_id: projectId,
      p_material_id: materialId,
      p_source_location_id: sourceLocationId,
      p_quantity: quantity,
      p_phase_id: phaseId ?? null,
      p_idempotency_key: idempotencyKey,
    });
    if (error) throw new Error(`Erro RPC Supabase rpc_record_project_material_consumption: ${error.message}`);
    return data;
  }

  // RPC 5: RESERVE STOCK
  async reserveStockRPC(
    companyId: string,
    materialId: string,
    locationId: string,
    quantity: number,
    idempotencyKey: string
  ) {
    const { data, error } = await (supabase as any).rpc("rpc_reserve_stock", {
      p_company_id: companyId,
      p_material_id: materialId,
      p_location_id: locationId,
      p_quantity: quantity,
      p_idempotency_key: idempotencyKey,
    });
    if (error) throw new Error(`Erro RPC Supabase rpc_reserve_stock: ${error.message}`);
    return data;
  }

  // RPC 6: RELEASE RESERVATION
  async releaseReservationRPC(
    companyId: string,
    materialId: string,
    locationId: string,
    quantity: number
  ) {
    const { data, error } = await (supabase as any).rpc("rpc_release_reservation", {
      p_company_id: companyId,
      p_material_id: materialId,
      p_location_id: locationId,
      p_quantity: quantity,
    });
    if (error) throw new Error(`Erro RPC Supabase rpc_release_reservation: ${error.message}`);
    return data;
  }

  // RPC 7: CONSUME RESERVATION
  async consumeReservationRPC(
    companyId: string,
    materialId: string,
    locationId: string,
    quantity: number,
    idempotencyKey: string
  ) {
    const { data, error } = await (supabase as any).rpc("rpc_consume_reservation", {
      p_company_id: companyId,
      p_material_id: materialId,
      p_location_id: locationId,
      p_quantity: quantity,
      p_idempotency_key: idempotencyKey,
    });
    if (error) throw new Error(`Erro RPC Supabase rpc_consume_reservation: ${error.message}`);
    return data;
  }

  // RPC 8: ADJUST STOCK
  async adjustStockRPC(
    companyId: string,
    materialId: string,
    locationId: string,
    newQuantity: number,
    reason: string,
    idempotencyKey: string
  ) {
    const { data, error } = await (supabase as any).rpc("rpc_adjust_stock", {
      p_company_id: companyId,
      p_material_id: materialId,
      p_location_id: locationId,
      p_new_quantity: newQuantity,
      p_reason: reason,
      p_idempotency_key: idempotencyKey,
    });
    if (error) throw new Error(`Erro RPC Supabase rpc_adjust_stock: ${error.message}`);
    return data;
  }

  // RPC 9: REVERSE MOVEMENT
  async reverseMovementRPC(
    companyId: string,
    movementId: string,
    reason: string,
    idempotencyKey: string
  ) {
    const { data, error } = await (supabase as any).rpc("rpc_reverse_movement", {
      p_company_id: companyId,
      p_movement_id: movementId,
      p_reason: reason,
      p_idempotency_key: idempotencyKey,
    });
    if (error) throw new Error(`Erro RPC Supabase rpc_reverse_movement: ${error.message}`);
    return data;
  }
}
