/**
 * Repositório Supabase: SupabaseStockTransferRepository
 * Categoria: infrastructure/repositories/supabase
 */

import { supabase } from "@/integrations/supabase/client";
import type { IStockTransferRepository } from "../../../core/domain/repositories";
import type { StockTransfer, StockTransferItem } from "../../../core/domain/entities";
import type {
  StockTransferId,
  TenantId,
  CompanyId,
} from "../../../core/shared/primitives";
import type { IdempotencyKey, ISO8601String } from "../../../core/types/aliases";
import type { StockTransferStatus } from "../../../core/types/enums";
import {
  toStockTransferId,
  toTenantId,
  toCompanyId,
  toInventoryLocationId,
  toMaterialId,
} from "../../../core/shared/primitives";

export class SupabaseStockTransferRepository implements IStockTransferRepository {
  async findById(id: StockTransferId): Promise<StockTransfer | null> {
    const { data, error } = await supabase
      .from("stock_transfers")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;

    return this.mapToEntity(data);
  }

  async findByIdempotencyKey(
    tenantId: TenantId,
    companyId: CompanyId,
    idempotencyKey: IdempotencyKey
  ): Promise<StockTransfer | null> {
    const { data, error } = await supabase
      .from("stock_transfers")
      .select("*")
      .eq("company_id", companyId)
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (error || !data) return null;

    return this.mapToEntity(data);
  }

  async listByStatus(
    tenantId: TenantId,
    companyId: CompanyId,
    status: StockTransferStatus
  ): Promise<readonly StockTransfer[]> {
    const { data, error } = await supabase
      .from("stock_transfers")
      .select("*")
      .eq("company_id", companyId)
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data.map((d) => this.mapToEntity(d));
  }

  async listItemsByTransfer(transferId: StockTransferId): Promise<readonly StockTransferItem[]> {
    const { data, error } = await supabase
      .from("stock_transfer_items")
      .select("*")
      .eq("transfer_id", transferId);

    if (error || !data) return [];

    return data.map((d: any) => ({
      id: d.id,
      tenantId: toTenantId(d.tenant_id),
      companyId: toCompanyId(d.company_id),
      transferId: toStockTransferId(d.transfer_id),
      materialId: toMaterialId(d.material_id),
      requestedQuantity: Number(d.requested_quantity),
      dispatchedQuantity: Number(d.dispatched_quantity),
      receivedQuantity: Number(d.received_quantity),
      createdAt: d.created_at,
    }));
  }

  async saveTransfer(transfer: StockTransfer): Promise<void> {
    const { error } = await supabase.from("stock_transfers").upsert({
      id: transfer.id,
      tenant_id: transfer.tenantId,
      company_id: transfer.companyId,
      transfer_number: transfer.transferNumber,
      source_location_id: transfer.sourceLocationId,
      transit_location_id: transfer.transitLocationId,
      destination_location_id: transfer.destinationLocationId,
      status: transfer.status,
      idempotency_key: transfer.idempotencyKey,
      dispatched_at: transfer.dispatchedAt ?? null,
      received_at: transfer.receivedAt ?? null,
      updated_at: new Date().toISOString(),
    });

    if (error) throw new Error(`Erro ao guardar transferência no Supabase: ${error.message}`);
  }

  async saveItem(item: StockTransferItem): Promise<void> {
    const { error } = await supabase.from("stock_transfer_items").upsert({
      id: item.id,
      tenant_id: item.tenantId,
      company_id: item.companyId,
      transfer_id: item.transferId,
      material_id: item.materialId,
      requested_quantity: item.requestedQuantity,
      dispatched_quantity: item.dispatchedQuantity,
      received_quantity: item.receivedQuantity,
    });

    if (error) throw new Error(`Erro ao guardar item de transferência no Supabase: ${error.message}`);
  }

  async markTransferReceived(transferId: StockTransferId, receivedAt: ISO8601String): Promise<void> {
    const { error } = await supabase
      .from("stock_transfers")
      .update({ status: "received", received_at: receivedAt, updated_at: new Date().toISOString() })
      .eq("id", transferId);

    if (error) throw new Error(`Erro ao atualizar status da transferência: ${error.message}`);
  }

  async findAll(): Promise<readonly StockTransfer[]> {
    const { data, error } = await supabase.from("stock_transfers").select("*").order("created_at", { ascending: false });
    if (error || !data) return [];
    return data.map((d) => this.mapToEntity(d));
  }

  private mapToEntity(data: any): StockTransfer {
    return {
      id: toStockTransferId(data.id),
      tenantId: toTenantId(data.tenant_id),
      companyId: toCompanyId(data.company_id),
      transferNumber: data.transfer_number,
      sourceLocationId: toInventoryLocationId(data.source_location_id),
      transitLocationId: toInventoryLocationId(data.transit_location_id),
      destinationLocationId: toInventoryLocationId(data.destination_location_id),
      status: data.status,
      idempotencyKey: data.idempotency_key,
      dispatchedAt: data.dispatched_at ?? undefined,
      receivedAt: data.received_at ?? undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}
