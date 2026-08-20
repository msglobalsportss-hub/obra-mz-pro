/**
 * Repositório Supabase: SupabaseStockMovementRepository
 * Categoria: infrastructure/repositories/supabase
 */

import { supabase } from "@/integrations/supabase/client";
import type { IStockMovementRepository } from "../../../core/domain/repositories";
import type { StockMovement } from "../../../core/domain/entities";
import type {
  StockMovementId,
  TenantId,
  CompanyId,
  MaterialId,
  InventoryLocationId,
} from "../../../core/shared/primitives";
import type { IdempotencyKey, ISO8601String } from "../../../core/types/aliases";
import {
  toStockMovementId,
  toTenantId,
  toCompanyId,
  toMaterialId,
  toInventoryLocationId,
} from "../../../core/shared/primitives";

export class SupabaseStockMovementRepository implements IStockMovementRepository {
  async findById(id: StockMovementId): Promise<StockMovement | null> {
    const { data, error } = await supabase
      .from("stock_movements")
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
  ): Promise<StockMovement | null> {
    const { data, error } = await supabase
      .from("stock_movements")
      .select("*")
      .eq("company_id", companyId)
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (error || !data) return null;

    return this.mapToEntity(data);
  }

  async listByMaterial(
    tenantId: TenantId,
    companyId: CompanyId,
    materialId: MaterialId
  ): Promise<readonly StockMovement[]> {
    const { data, error } = await supabase
      .from("stock_movements")
      .select("*")
      .eq("company_id", companyId)
      .eq("material_id", materialId)
      .order("occurred_at", { ascending: false });

    if (error || !data) return [];

    return data.map((d) => this.mapToEntity(d));
  }

  async listByLocationAndPeriod(
    tenantId: TenantId,
    companyId: CompanyId,
    locationId: InventoryLocationId,
    from: ISO8601String,
    to: ISO8601String
  ): Promise<readonly StockMovement[]> {
    let query = supabase
      .from("stock_movements")
      .select("*")
      .eq("company_id", companyId)
      .gte("occurred_at", from)
      .lte("occurred_at", to)
      .order("occurred_at", { ascending: false });

    if (locationId !== ("ALL" as unknown as InventoryLocationId)) {
      query = query.or(`source_location_id.eq.${locationId},destination_location_id.eq.${locationId}`);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((d) => this.mapToEntity(d));
  }

  async appendMovement(movement: StockMovement): Promise<void> {
    // Nota: Clientes não podem fazer INSERT direto via RLS.
    // Movimentos de stock são gerados exclusivamente via Stored Procedures PL/pgSQL RPCs.
    const { error } = await supabase.from("stock_movements").insert({
      id: movement.id,
      tenant_id: movement.tenantId,
      company_id: movement.companyId,
      material_id: movement.materialId,
      movement_type: movement.movementType,
      status: movement.status,
      quantity: movement.quantity,
      unit_cost: movement.unitCost,
      total_cost: movement.totalCost,
      source_location_id: movement.sourceLocationId ?? null,
      destination_location_id: movement.destinationLocationId ?? null,
      reference_type: movement.referenceType ?? null,
      reference_id: movement.referenceId ?? null,
      idempotency_key: movement.idempotencyKey,
      performed_by: movement.performedBy,
      reason: movement.reason ?? null,
      occurred_at: movement.occurredAt ?? new Date().toISOString(),
    });

    if (error) throw new Error(`Erro ao registar movimento de stock via Supabase: ${error.message}`);
  }

  async findAll(): Promise<readonly StockMovement[]> {
    const { data, error } = await supabase.from("stock_movements").select("*").order("occurred_at", { ascending: false });
    if (error || !data) return [];
    return data.map((d) => this.mapToEntity(d));
  }

  private mapToEntity(data: any): StockMovement {
    return {
      id: toStockMovementId(data.id),
      tenantId: toTenantId(data.tenant_id),
      companyId: toCompanyId(data.company_id),
      materialId: toMaterialId(data.material_id),
      movementType: data.movement_type,
      status: data.status,
      quantity: Number(data.quantity),
      unitCost: Number(data.unit_cost),
      totalCost: Number(data.total_cost),
      sourceLocationId: data.source_location_id ? toInventoryLocationId(data.source_location_id) : undefined,
      destinationLocationId: data.destination_location_id ? toInventoryLocationId(data.destination_location_id) : undefined,
      referenceType: data.reference_type ?? undefined,
      referenceId: data.reference_id ?? undefined,
      idempotencyKey: data.idempotency_key,
      performedBy: data.performed_by,
      reason: data.reason ?? undefined,
      occurredAt: data.occurred_at,
      createdAt: data.created_at,
    };
  }
}
