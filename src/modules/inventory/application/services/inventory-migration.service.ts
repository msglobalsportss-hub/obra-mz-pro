import { inventoryStoreManager } from "../../store/inventory-store";
import { inventoryActions } from "../actions/action-container";
import { toTenantId, toCompanyId } from "../../core/shared/primitives";
import type { Delivery, PurchaseOrder } from "@/lib/purchases";

export interface MigrationRepairReport {
  scannedDeliveries: number;
  orphanDeliveriesCount: number;
  repairedDeliveriesCount: number;
  repairedMovementsCount: number;
  totalFinancialImpactMZN: number;
  errors: string[];
}

export class InventoryMigrationService {
  /**
   * Executa a varredura e reparação idempotente de entregas confirmadas sem movimento
   */
  public static async repairOrphanDeliveries(params: {
    deliveries: Delivery[];
    purchaseOrders: PurchaseOrder[];
    activeTenantId: string;
    activeCompanyId: string;
    dryRun?: boolean;
  }): Promise<MigrationRepairReport> {
    const { deliveries, purchaseOrders, activeTenantId, activeCompanyId, dryRun = false } = params;
    const storeState = inventoryStoreManager.getState();
    const existingMovements = storeState.movements;

    const report: MigrationRepairReport = {
      scannedDeliveries: deliveries.length,
      orphanDeliveriesCount: 0,
      repairedDeliveriesCount: 0,
      repairedMovementsCount: 0,
      totalFinancialImpactMZN: 0,
      errors: [],
    };

    const poMap = new Map(purchaseOrders.map((p) => [p.id, p]));

    for (const delivery of deliveries) {
      if (delivery.status !== "confirmed" && delivery.status !== "received") {
        continue;
      }

      // Verificar se já existe um movimento associado a esta entrega
      const hasMovement =
        (delivery.movementIds && delivery.movementIds.length > 0) ||
        existingMovements.some(
          (m) =>
            m.referenceId === delivery.deliveryNumber ||
            m.correlationId === delivery.id ||
            (delivery.movementIds && delivery.movementIds.includes(m.id))
        );

      if (!hasMovement) {
        report.orphanDeliveriesCount++;

        const po = poMap.get(delivery.purchaseOrderId);
        const locationId =
          delivery.destinationType === "central_stock"
            ? delivery.destinationWarehouseId || "WH-MAIN"
            : `LOC-PROJ-${delivery.destinationProjectId || "PROJ-1"}`;

        // Se for Dry-Run, apenas calcula o impacto estimado
        if (dryRun) {
          report.repairedDeliveriesCount++;
          // Estimar valor financeiro a partir do pedido de compra
          if (po && po.totalValue) {
            report.totalFinancialImpactMZN += po.totalValue;
          }
          continue;
        }

        // Se não for Dry-Run, executa a receção idempotente
        try {
          const idempotencyKey = `repair-delivery-${delivery.id}`;
          
          // Se houver pedido de compra, reparar itens
          const matId = po?.items?.[0]?.materialId || "MAT-CEMENT";
          const qty = po?.items?.[0]?.quantity || 100;
          const uCost = po?.items?.[0]?.unitPrice || 500;

          const res = await inventoryActions.receiveStock({
            tenantId: toTenantId(activeTenantId),
            companyId: toCompanyId(activeCompanyId),
            correlationId: delivery.id,
            idempotencyKey,
            timestamp: new Date().toISOString(),
            sourceModule: "inventory_repair_migration",
            materialId: matId,
            locationId,
            quantity: qty,
            unitCost: uCost,
          });

          if (res && res.success) {
            report.repairedDeliveriesCount++;
            report.repairedMovementsCount++;
            report.totalFinancialImpactMZN += qty * uCost;

            // Associar os movementIds à entrega
            delivery.movementIds = res.movementIds || [res.operationId];
          } else {
            report.errors.push(`Falha ao reparar entrega ${delivery.deliveryNumber}: ${res.error || "Erro desconhecido"}`);
          }
        } catch (err: any) {
          report.errors.push(`Exceção na entrega ${delivery.deliveryNumber}: ${err.message}`);
        }
      }
    }

    return report;
  }
}
