/**
 * Repositório Supabase: SupabaseInventoryBalanceRepository
 * Categoria: infrastructure/repositories/supabase
 */

import { supabase } from "@/integrations/supabase/client";
import type { IInventoryBalanceRepository } from "../../../core/domain/repositories";
import type { InventoryBalance, InventoryBalanceDimensions } from "../../../core/domain/entities";
import type {
  InventoryBalanceId,
  TenantId,
  CompanyId,
  MaterialId,
  InventoryLocationId,
} from "../../../core/shared/primitives";
import {
  toInventoryBalanceId,
  toTenantId,
  toCompanyId,
  toMaterialId,
  toInventoryLocationId,
  toInventoryBatchId,
} from "../../../core/shared/primitives";

export class SupabaseInventoryBalanceRepository implements IInventoryBalanceRepository {
  async findById(id: InventoryBalanceId): Promise<InventoryBalance | null> {
    const { data, error } = await supabase
      .from("inventory_balances")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;

    return this.mapToEntity(data);
  }

  async findByDimensions(dimensions: InventoryBalanceDimensions): Promise<InventoryBalance | null> {
    let query = supabase
      .from("inventory_balances")
      .select("*")
      .eq("company_id", dimensions.companyId)
      .eq("material_id", dimensions.materialId)
      .eq("location_id", dimensions.locationId)
      .eq("stock_state", dimensions.stockState);

    const { data, error } = await query.maybeSingle();

    if (error || !data) return null;

    return this.mapToEntity(data);
  }

  async listByMaterial(
    tenantId: TenantId,
    companyId: CompanyId,
    materialId: MaterialId
  ): Promise<readonly InventoryBalance[]> {
    const { data, error } = await supabase
      .from("inventory_balances")
      .select("*")
      .eq("company_id", companyId)
      .eq("material_id", materialId);

    if (error || !data) return [];

    return data.map((d) => this.mapToEntity(d));
  }

  async listByLocation(
    tenantId: TenantId,
    companyId: CompanyId,
    locationId: InventoryLocationId
  ): Promise<readonly InventoryBalance[]> {
    const { data, error } = await supabase
      .from("inventory_balances")
      .select("*")
      .eq("company_id", companyId)
      .eq("location_id", locationId);

    if (error || !data) return [];

    return data.map((d) => this.mapToEntity(d));
  }

  async storeBalanceProjection(
    balance: InventoryBalance,
    expectedVersion: number | null
  ): Promise<void> {
    const { error } = await supabase.from("inventory_balances").upsert({
      id: balance.id,
      tenant_id: balance.tenantId,
      company_id: balance.companyId,
      material_id: balance.materialId,
      location_id: balance.locationId,
      stock_state: balance.stockState,
      on_hand_quantity: balance.onHandQuantity,
      reserved_quantity: balance.reservedQuantity,
      average_cost: balance.averageCost,
      version: balance.version,
      updated_at: new Date().toISOString(),
    });

    if (error) throw new Error(`Erro ao guardar saldo no Supabase: ${error.message}`);
  }

  async findAll(): Promise<readonly InventoryBalance[]> {
    const { data, error } = await supabase.from("inventory_balances").select("*");
    if (error || !data) return [];
    return data.map((d) => this.mapToEntity(d));
  }

  private mapToEntity(data: any): InventoryBalance {
    return {
      id: toInventoryBalanceId(data.id),
      tenantId: toTenantId(data.tenant_id),
      companyId: toCompanyId(data.company_id),
      materialId: toMaterialId(data.material_id),
      locationId: toInventoryLocationId(data.location_id),
      stockState: data.stock_state,
      batchId: data.batch_id ? toInventoryBatchId(data.batch_id) : undefined,
      expirationDate: data.expiration_date ?? undefined,
      onHandQuantity: Number(data.on_hand_quantity),
      reservedQuantity: Number(data.reserved_quantity),
      availableQuantity: Number(data.available_quantity),
      averageCost: Number(data.average_cost),
      totalValue: Number(data.total_value),
      version: Number(data.version),
      updatedAt: data.updated_at,
    };
  }
}
