/**
 * Repositório Supabase: SupabaseInventoryBatchRepository
 * Categoria: infrastructure/repositories/supabase
 */

import { supabase } from "@/integrations/supabase/client";
import type { IInventoryBatchRepository } from "../../../core/domain/repositories";
import type { InventoryBatch, InventoryBatchItem } from "../../../core/domain/entities";
import type {
  InventoryBatchId,
  TenantId,
  CompanyId,
} from "../../../core/shared/primitives";
import type { IdempotencyKey } from "../../../core/types/aliases";
import {
  toInventoryBatchId,
  toTenantId,
  toCompanyId,
  toMaterialId,
} from "../../../core/shared/primitives";

export class SupabaseInventoryBatchRepository implements IInventoryBatchRepository {
  async findById(id: InventoryBatchId): Promise<InventoryBatch | null> {
    const { data, error } = await supabase
      .from("receipt_batches")
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
  ): Promise<InventoryBatch | null> {
    const { data, error } = await supabase
      .from("receipt_batches")
      .select("*")
      .eq("company_id", companyId)
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (error || !data) return null;

    return this.mapToEntity(data);
  }

  async saveBatch(batch: InventoryBatch): Promise<void> {
    const { error } = await supabase.from("receipt_batches").upsert({
      id: batch.id,
      tenant_id: batch.tenantId,
      company_id: batch.companyId,
      batch_number: batch.batchNumber,
      delivery_id: batch.deliveryId,
      idempotency_key: batch.idempotencyKey,
      received_at: batch.receivedAt,
      received_by: batch.receivedBy,
      notes: batch.notes ?? null,
    });

    if (error) throw new Error(`Erro ao guardar lote de receção no Supabase: ${error.message}`);
  }

  async saveItem(item: InventoryBatchItem): Promise<void> {
    const { error } = await supabase.from("receipt_batch_items").upsert({
      id: item.id,
      tenant_id: item.tenantId,
      company_id: item.companyId,
      batch_id: item.batchId,
      delivery_item_id: item.deliveryItemId,
      material_id: item.materialId,
      received_quantity: item.receivedQuantity,
      accepted_quantity: item.acceptedQuantity,
      rejected_quantity: item.rejectedQuantity,
      rejection_reason: item.rejectionReason ?? null,
      unit_cost: item.unitCost,
    });

    if (error) throw new Error(`Erro ao guardar item do lote no Supabase: ${error.message}`);
  }

  async listItemsByBatch(batchId: InventoryBatchId): Promise<readonly InventoryBatchItem[]> {
    const { data, error } = await supabase
      .from("receipt_batch_items")
      .select("*")
      .eq("batch_id", batchId);

    if (error || !data) return [];

    return data.map((d: any) => ({
      id: d.id,
      tenantId: toTenantId(d.tenant_id),
      companyId: toCompanyId(d.company_id),
      batchId: toInventoryBatchId(d.batch_id),
      deliveryItemId: d.delivery_item_id,
      materialId: toMaterialId(d.material_id),
      receivedQuantity: Number(d.received_quantity),
      acceptedQuantity: Number(d.accepted_quantity),
      rejectedQuantity: Number(d.rejected_quantity),
      rejectionReason: d.rejection_reason ?? undefined,
      unitCost: Number(d.unit_cost),
      createdAt: d.created_at,
    }));
  }

  async findAll(): Promise<readonly InventoryBatch[]> {
    const { data, error } = await supabase.from("receipt_batches").select("*").order("created_at", { ascending: false });
    if (error || !data) return [];
    return data.map((d) => this.mapToEntity(d));
  }

  private mapToEntity(data: any): InventoryBatch {
    return {
      id: toInventoryBatchId(data.id),
      tenantId: toTenantId(data.tenant_id),
      companyId: toCompanyId(data.company_id),
      batchNumber: data.batch_number,
      deliveryId: data.delivery_id,
      idempotencyKey: data.idempotency_key,
      receivedAt: data.received_at,
      receivedBy: data.received_by,
      notes: data.notes ?? undefined,
      createdAt: data.created_at,
    };
  }
}
