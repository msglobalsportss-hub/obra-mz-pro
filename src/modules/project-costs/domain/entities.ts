/**
 * Domínio ProjectMaterialCost — Custos de Materiais da Obra
 *
 * MÓDULO INDEPENDENTE (DOMÍNIO PRÓPRIO)
 *
 * Regra Financeira:
 * O consumo de material na obra:
 * - Reduz o inventário físico via InventoryEngine;
 * - Regista o custo histórico real da obra (quantidade * WAC no momento);
 * - NÃO gera qualquer movimento no Fluxo de Caixa (a saída financeira ocorre na compra).
 */

export interface ProjectMaterialCostEntry {
  readonly id: string;
  readonly projectId: string;
  readonly materialId: string;
  readonly quantity: number;
  readonly unit: string;
  readonly unitCostAtConsumption: number;
  readonly totalCost: number;
  readonly phaseId?: string;
  readonly consumedAt: string;
  readonly movementId: string;
  readonly actorId: string;
  readonly notes?: string;
  readonly sourceLocationId: string;
  readonly supplierId?: string;
  readonly costCenterId?: string;
}

export interface RecordProjectMaterialConsumptionInput {
  readonly projectId: string;
  readonly materialId: string;
  readonly quantity: number;
  readonly unit: string;
  readonly unitCostAtConsumption: number;
  readonly phaseId?: string;
  readonly consumedAt?: string;
  readonly movementId: string;
  readonly actorId: string;
  readonly notes?: string;
  readonly sourceLocationId: string;
}
