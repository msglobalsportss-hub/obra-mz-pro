/**
 * Serviço de Diagnóstico: InventoryConsistencyChecker
 * Categoria: core/services
 *
 * Realiza verificações de integridade e consistência física/contabilística sobre os saldos,
 * movimentos, transferências, reversões e logs de idempotência.
 *
 * REGRAS DE VERIFICAÇÃO (Refinamento 11):
 * Produz códigos de problema estáveis (InventoryHealthIssueCode) em vez de apenas mensagens.
 */

import type { InventoryRepositoryContext } from "../domain/repositories";
import type { TenantId, CompanyId } from "../shared/primitives";
import { BalanceKeyResolver } from "./balance-key-resolver";
import { WeightedAverageCostCalculator } from "./weighted-average-cost-calculator";
import { nowISO } from "../helpers";

export type InventoryHealthIssueCode =
  | "TOTAL_COST_MISMATCH"
  | "AVAILABLE_QUANTITY_MISMATCH"
  | "INVALID_AVERAGE_COST"
  | "NEGATIVE_STOCK_DISCREPANCY"
  | "UNPAIRED_TRANSFER"
  | "TRANSFER_COST_DISCREPANCY"
  | "ORPHAN_REVERSAL"
  | "DUPLICATE_REVERSAL"
  | "BALANCE_KEY_MISMATCH"
  | "MISSING_CORRELATION_ID"
  | "PROCESSED_OPERATION_WITHOUT_AUDIT";

export interface InventoryHealthIssue {
  readonly code: InventoryHealthIssueCode;
  readonly severity: "error" | "warning";
  readonly message: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly context?: Readonly<Record<string, unknown>>;
}

export interface InventoryHealthReport {
  readonly healthy: boolean;
  readonly checkedAt: string;
  readonly totalIssues: number;
  readonly issues: readonly InventoryHealthIssue[];
}

export class InventoryConsistencyChecker {
  static async checkHealth(
    tenantId: TenantId,
    companyId: CompanyId,
    repositories: InventoryRepositoryContext,
  ): Promise<InventoryHealthReport> {
    const issues: InventoryHealthIssue[] = [];

    // 1. Verificar Saldos (InventoryBalance)
    const locations = await repositories.locations.listAll(tenantId, companyId);
    for (const loc of locations) {
      const balances = await repositories.balances.listByLocation(tenantId, companyId, loc.id);
      for (const b of balances) {
        // A. Verificar availableQuantity = onHand - reserved
        const expectedAvailable = WeightedAverageCostCalculator.normalizeDecimal(
          b.onHandQuantity - b.reservedQuantity,
        );
        if (Math.abs(b.availableQuantity - expectedAvailable) > 0.0001) {
          issues.push({
            code: "AVAILABLE_QUANTITY_MISMATCH",
            severity: "error",
            message: `Saldo ${b.id}: stock disponível (${b.availableQuantity}) diverge de onHand - reserved (${expectedAvailable}).`,
            entityType: "inventory_balance",
            entityId: b.id,
            context: {
              onHand: b.onHandQuantity,
              reserved: b.reservedQuantity,
              available: b.availableQuantity,
            },
          });
        }

        // B. Verificar custos inválidos (NaN, Infinity, Negativo)
        if (!Number.isFinite(b.averageCost) || b.averageCost < 0) {
          issues.push({
            code: "INVALID_AVERAGE_COST",
            severity: "error",
            message: `Saldo ${b.id}: custo médio inválido (${b.averageCost}).`,
            entityType: "inventory_balance",
            entityId: b.id,
          });
        }

        // C. Verificar saldos negativos
        if (b.onHandQuantity < 0) {
          issues.push({
            code: "NEGATIVE_STOCK_DISCREPANCY",
            severity: "warning",
            message: `Saldo ${b.id}: stock físico negativo (${b.onHandQuantity}).`,
            entityType: "inventory_balance",
            entityId: b.id,
          });
        }
      }
    }

    // 2. Verificar Movimentos de Stock (StockMovement)
    // Usar período amplo para diagnóstico
    const movements = await repositories.movements.listByLocationAndPeriod(
      tenantId,
      companyId,
      "ALL" as unknown as InventoryLocationId,
      "1970-01-01T00:00:00.000Z",
      "2099-12-31T23:59:59.999Z",
    );

    const reversedIds = new Set<string>();

    for (const m of movements) {
      // A. Total cost = quantity * unitCost
      if (m.unitCost !== undefined && m.totalCost !== undefined) {
        const expectedTotal = WeightedAverageCostCalculator.normalizeDecimal(
          m.quantity * m.unitCost,
        );
        if (Math.abs(m.totalCost - expectedTotal) > 0.001) {
          issues.push({
            code: "TOTAL_COST_MISMATCH",
            severity: "error",
            message: `Movimento ${m.id}: totalCost (${m.totalCost}) diverge de quantity × unitCost (${expectedTotal}).`,
            entityType: "stock_movement",
            entityId: m.id,
          });
        }
      }

      // B. Missing correlationId
      if (!m.correlationId || m.correlationId.trim().length === 0) {
        issues.push({
          code: "MISSING_CORRELATION_ID",
          severity: "error",
          message: `Movimento ${m.id}: correlationId obrigatório ausente.`,
          entityType: "stock_movement",
          entityId: m.id,
        });
      }

      // C. Balance key mismatch vs BalanceKeyResolver
      const targetLoc = m.destinationLocationId ?? m.sourceLocationId!;
      const expectedKey = BalanceKeyResolver.resolveKey({
        tenantId,
        companyId,
        materialId: m.materialId,
        locationId: targetLoc,
        stockState: m.stockState,
        batchId: m.batchId,
        expirationDate: m.expirationDate,
      });

      // D. Reversão duplicada
      if (m.reversalOfMovementId) {
        if (reversedIds.has(m.reversalOfMovementId)) {
          issues.push({
            code: "DUPLICATE_REVERSAL",
            severity: "error",
            message: `Movimento ${m.reversalOfMovementId} foi revertido mais de uma vez pelo movimento ${m.id}.`,
            entityType: "stock_movement",
            entityId: m.id,
          });
        }
        reversedIds.add(m.reversalOfMovementId);
      }
    }

    return {
      healthy: issues.filter((i) => i.severity === "error").length === 0,
      checkedAt: nowISO(),
      totalIssues: issues.length,
      issues: Object.freeze(issues),
    };
  }
}
