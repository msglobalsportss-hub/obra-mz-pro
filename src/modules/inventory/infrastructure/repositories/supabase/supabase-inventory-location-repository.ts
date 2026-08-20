/**
 * Repositório Supabase: SupabaseInventoryLocationRepository
 * Categoria: infrastructure/repositories/supabase
 */

import { supabase } from "@/integrations/supabase/client";
import type { IInventoryLocationRepository } from "../../../core/domain/repositories";
import type { InventoryLocation } from "../../../core/domain/entities";
import type {
  InventoryLocationId,
  TenantId,
  CompanyId,
} from "../../../core/shared/primitives";
import {
  toInventoryLocationId,
  toTenantId,
  toCompanyId,
  toProjectId,
} from "../../../core/shared/primitives";

export class SupabaseInventoryLocationRepository implements IInventoryLocationRepository {
  async findById(id: InventoryLocationId): Promise<InventoryLocation | null> {
    const { data, error } = await supabase
      .from("inventory_locations")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;

    return this.mapToEntity(data);
  }

  async findByCode(
    tenantId: TenantId,
    companyId: CompanyId,
    code: string
  ): Promise<InventoryLocation | null> {
    const { data, error } = await supabase
      .from("inventory_locations")
      .select("*")
      .eq("company_id", companyId)
      .eq("code", code)
      .maybeSingle();

    if (error || !data) return null;

    return this.mapToEntity(data);
  }

  async listAll(
    tenantId: TenantId,
    companyId: CompanyId
  ): Promise<readonly InventoryLocation[]> {
    const { data, error } = await supabase
      .from("inventory_locations")
      .select("*")
      .eq("company_id", companyId);

    if (error || !data) return [];

    return data.map((d) => this.mapToEntity(d));
  }

  async listActive(
    tenantId: TenantId,
    companyId: CompanyId
  ): Promise<readonly InventoryLocation[]> {
    const { data, error } = await supabase
      .from("inventory_locations")
      .select("*")
      .eq("company_id", companyId)
      .eq("is_active", true);

    if (error || !data) return [];

    return data.map((d) => this.mapToEntity(d));
  }

  async saveLocation(location: InventoryLocation): Promise<void> {
    const { error } = await supabase.from("inventory_locations").upsert({
      id: location.id,
      tenant_id: location.tenantId,
      company_id: location.companyId,
      code: location.code,
      name: location.name,
      type: location.type,
      project_id: location.projectId ?? null,
      is_active: location.isActive,
      updated_at: new Date().toISOString(),
    });

    if (error) throw new Error(`Erro ao guardar localização no Supabase: ${error.message}`);
  }

  private mapToEntity(data: any): InventoryLocation {
    return {
      id: toInventoryLocationId(data.id),
      tenantId: toTenantId(data.tenant_id),
      companyId: toCompanyId(data.company_id),
      code: data.code,
      name: data.name,
      type: data.type,
      projectId: data.project_id ? toProjectId(data.project_id) : undefined,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}
