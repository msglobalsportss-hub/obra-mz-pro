/**
 * Reconstrução Determinística de Saldos: InventoryBalanceRebuilder
 * Categoria: core/engine
 *
 * Reconstrói deterministicamente todos os saldos de inventário (InventoryBalance) a partir do
 * histórico de movimentos imutáveis (StockMovement).
 *
 * REGRAS ARQUITETURAIS (Refinamentos 5, 10 e 20):
 * 1. Staging Area: Reconstrói todos os saldos numa estrutura em memória temporária primeiro.
 * 2. Validação de Escopo: Garante que TODOS os movimentos pertencem estritamente ao tenantId e companyId solicitados.
 * 3. Ordenação Estável Determinística: Ordena por occurredAt -> createdAt -> movementId.
 * 4. Substituição Administrativa: Dentro da Unit of Work, substitui as projeções em lote com substituição
 *    controlada sem ser bloqueada por expectedVersion.
 * 5. Se a reconstrução falhar antes do commit, os saldos atuais permanecem intactos.
 */

import type { InventoryTransactionContext } from "../contracts/shared/inventory-transaction-context";
import type { InventoryRepositoryContext } from "../domain/repositories";
import type { InventoryBalance, StockMovement } from "../domain/entities";
import type { TenantId, CompanyId, MaterialId, InventoryLocationId } from "../shared/primitives";
import { InventoryBalanceEngine } from "./inventory-balance-engine";
import { BalanceKeyResolver } from "../services/balance-key-resolver";
import { InventoryBalanceRebuildError } from "../shared/errors";
import { nowISO, generateInventoryId } from "../helpers";
import { toInventoryAuditLogId } from "../shared/primitives";
import type { InventoryAuditLog } from "../domain/entities";

export interface InventoryBalanceRebuildParams {
  readonly materialId?: MaterialId;
  readonly locationId?: InventoryLocationId;
  readonly fromDate?: string;
  readonly toDate?: string;
}

export interface InventoryBalanceDiscrepancy {
  readonly balanceKey: string;
  readonly materialId: string;
  readonly locationId: string;
  readonly previousOnHand: number;
  readonly rebuiltOnHand: number;
  readonly previousAvgCost: number;
  readonly rebuiltAvgCost: number;
}

export interface InventoryBalanceRebuildResult {
  readonly processedMovements: number;
  readonly rebuiltBalances: number;
  readonly correctedBalances: number;
  readonly unchangedBalances: number;
  readonly discrepancies: readonly InventoryBalanceDiscrepancy[];
  readonly startedAt: string;
  readonly completedAt: string;
}

export class InventoryBalanceRebuilder {
  static async rebuild(
    context: InventoryTransactionContext,
    repositories: InventoryRepositoryContext,
    params: InventoryBalanceRebuildParams,
  ): Promise<InventoryBalanceRebuildResult> {
    const startedAt = nowISO();

    // 1. Carregar movimentos históricos para o escopo solicitado
    let movements: readonly StockMovement[] = [];
    if (params.materialId) {
      movements = await repositories.movements.listByMaterial(
        context.tenantId,
        context.companyId,
        params.materialId,
      );
    } else {
      // Carregar todos os movimentos do tenant/company para a localização ou período
      const locId = params.locationId ?? ("ALL" as unknown as InventoryLocationId);
      movements = await repositories.movements.listByLocationAndPeriod(
        context.tenantId,
        context.companyId,
        locId,
        params.fromDate ?? "1970-01-01T00:00:00.000Z",
        params.toDate ?? "2099-12-31T23:59:59.999Z",
      );
    }

    // 2. REFINAMENTO 10: Validar isolamento de Tenant e Empresa (Rejeitar histórico misturado)
    for (const m of movements) {
      if (m.tenantId !== context.tenantId || m.companyId !== context.companyId) {
        throw new InventoryBalanceRebuildError(
          `Movimento ${m.id} pertence a outro tenant/company (${m.tenantId}/${m.companyId}). Reconstrução abortada.`,
        );
      }
    }

    // 3. REFINAMENTO 19: Ordenação determinística estável:
    // occurredAt -> createdAt -> Inbound vs Outbound Priority -> movementId
    const sortedMovements = [...movements].sort((a, b) => {
      const dateA = a.occurredAt ?? a.createdAt;
      const dateB = b.occurredAt ?? b.createdAt;
      const cmpDate = dateA.localeCompare(dateB);
      if (cmpDate !== 0) return cmpDate;

      const cmpCreated = a.createdAt.localeCompare(b.createdAt);
      if (cmpCreated !== 0) return cmpCreated;

      // Se timestamps forem idênticos, entradas têm prioridade sobre saídas
      const isInboundA = ![
        "transfer_out",
        "consumption",
        "return_out",
        "adjustment_out",
        "physical_count_out",
        "damage",
        "disposal",
      ].includes(a.movementType);
      const isInboundB = ![
        "transfer_out",
        "consumption",
        "return_out",
        "adjustment_out",
        "physical_count_out",
        "damage",
        "disposal",
      ].includes(b.movementType);
      if (isInboundA && !isInboundB) return -1;
      if (!isInboundA && isInboundB) return 1;

      return a.id.localeCompare(b.id);
    });

    // 4. REFINAMENTO 20: Reconstruir numa STAGING AREA temporária em memória (Map<balanceKey, InventoryBalance>)
    const stagingBalances = new Map<string, InventoryBalance>();

    for (const movement of sortedMovements) {
      const isOutboundType = [
        "transfer_out",
        "consumption",
        "return_out",
        "adjustment_out",
        "physical_count_out",
        "damage",
        "disposal",
        "reservation",
        "reservation_release",
      ].includes(movement.movementType);

      const targetLocId = isOutboundType
        ? (movement.sourceLocationId ?? movement.destinationLocationId!)
        : (movement.destinationLocationId ?? movement.sourceLocationId!);

      const balanceKey = BalanceKeyResolver.resolveKey({
        tenantId: context.tenantId,
        companyId: context.companyId,
        materialId: movement.materialId,
        locationId: targetLocId,
        stockState: movement.stockState ?? "available",
        batchId: movement.batchId,
        expirationDate: movement.expirationDate,
      });

      const currentStagingBalance = stagingBalances.get(balanceKey) ?? null;
      const projectedStagingBalance = InventoryBalanceEngine.projectBalance(
        currentStagingBalance,
        movement,
      );
      stagingBalances.set(balanceKey, projectedStagingBalance);
    }

    // 5. Comparar com os saldos atualmente persistidos e gerar relatório de discrepâncias
    const discrepancies: InventoryBalanceDiscrepancy[] = [];
    let correctedCount = 0;
    let unchangedCount = 0;

    for (const [key, rebuilt] of stagingBalances.entries()) {
      const currentStored = await repositories.balances.findByDimensions({
        tenantId: context.tenantId,
        companyId: context.companyId,
        materialId: rebuilt.materialId,
        locationId: rebuilt.locationId,
        stockState: rebuilt.stockState,
        batchId: rebuilt.batchId,
        expirationDate: rebuilt.expirationDate,
      });

      const prevOnHand = currentStored?.onHandQuantity ?? 0;
      const prevAvgCost = currentStored?.averageCost ?? 0;

      const hasDiscrepancy =
        prevOnHand !== rebuilt.onHandQuantity || prevAvgCost !== rebuilt.averageCost;

      if (hasDiscrepancy) {
        correctedCount++;
        discrepancies.push({
          balanceKey: key,
          materialId: rebuilt.materialId,
          locationId: rebuilt.locationId,
          previousOnHand: prevOnHand,
          rebuiltOnHand: rebuilt.onHandQuantity,
          previousAvgCost: prevAvgCost,
          rebuiltAvgCost: rebuilt.averageCost,
        });
      } else {
        unchangedCount++;
      }

      // 6. Substituição Administrativa dentro da UoW (Ignora conflito de versão esperado durante o rebuild)
      await repositories.balances.storeBalanceProjection(rebuilt, null);
    }

    const completedAt = nowISO();

    // 7. Registar Log de Auditoria da Reconstrução
    const auditLog: InventoryAuditLog = Object.freeze({
      id: toInventoryAuditLogId(generateInventoryId("aud")),
      tenantId: context.tenantId,
      companyId: context.companyId,
      entityType: "inventory_balance",
      entityId: "rebuild_job",
      action: "reconciled",
      actorId: context.actorId,
      correlationId: context.correlationId,
      causationId: context.causationId,
      referenceType: "system",
      referenceId: context.idempotencyKey,
      occurredAt: completedAt,
      metadata: {
        processedMovements: sortedMovements.length,
        rebuiltBalances: stagingBalances.size,
        correctedBalances: correctedCount,
        discrepanciesCount: discrepancies.length,
      },
    });

    await repositories.auditLogs.storeAuditRecord(auditLog);

    return {
      processedMovements: sortedMovements.length,
      rebuiltBalances: stagingBalances.size,
      correctedBalances: correctedCount,
      unchangedBalances: unchangedCount,
      discrepancies,
      startedAt,
      completedAt,
    };
  }
}
