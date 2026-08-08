import { describe, it, expect, beforeEach } from "vitest";
import { inventoryStoreManager } from "../store/inventory-store";
import { InventoryMigrationService } from "../application/services/inventory-migration.service";
import { getMaterialDisplay, getLocationDisplay, getSupplierDisplay } from "../utils/inventory-display";
import { defaultUnitOfWork } from "../application/actions/action-container";
import { toTenantId, toCompanyId, toInventoryLocationId } from "../core/shared/primitives";
import type { Delivery, PurchaseOrder } from "@/lib/purchases";

describe("Fase 3.7 - Novos Testes da Reconstrução Funcional de Inventário", () => {
  beforeEach(async () => {
    inventoryStoreManager.logout();
    inventoryStoreManager.switchCompanyScope("TENANT-A", "COMP-1");

    // Salvar localização no repositório de locais
    await defaultUnitOfWork.locations.saveLocation({
      id: toInventoryLocationId("WH-MAIN"),
      tenantId: toTenantId("TENANT-A"),
      companyId: toCompanyId("COMP-1"),
      code: "WH-MAIN",
      name: "Armazém Central",
      type: "main_warehouse",
      isActive: true,
      isDefault: true,
      allowsInbound: true,
      allowsOutbound: true,
      allowsReservations: true,
      allowsTransfers: true,
      allowsConsumption: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  it("1. Resolução de Nomes Reais (Display Utilities)", () => {
    const matDisplay = getMaterialDisplay("MAT-CEM-425", [
      { id: "MAT-CEM-425", name: "Cimento Portland 42.5", sku: "SKU-CEM", unit: "saco" } as any,
    ]);
    expect(matDisplay.name).toBe("Cimento Portland 42.5");
    expect(matDisplay.unit).toBe("saco");

    const locDisplay = getLocationDisplay("WH-MAIN-MAPUTO", [
      { id: "WH-MAIN-MAPUTO", name: "Armazém Central Maputo", code: "WH-MAIN", isActive: true } as any,
    ]);
    expect(locDisplay.label).toBe("Armazém: Armazém Central Maputo");
    expect(locDisplay.type).toBe("warehouse");

    const transitDisplay = getLocationDisplay("LOC-TRANSIT-TRF-001");
    expect(transitDisplay.label).toBe("Stock Em Trânsito");
    expect(transitDisplay.type).toBe("transit");
  });

  it("2. Reparação Idempotente de Entregas Confirmadas sem Movimento", async () => {
    const mockDeliveries: Delivery[] = [
      {
        id: "del-orphan-1",
        deliveryNumber: "DEL-9941",
        purchaseOrderId: "po-1",
        destinationType: "central_stock",
        destinationWarehouseId: "WH-MAIN",
        deliveryDate: "2026-07-30",
        status: "confirmed",
        createdAt: "2026-07-30T10:00:00Z",
        updatedAt: "2026-07-30T10:00:00Z",
      },
    ];

    const mockPOs: PurchaseOrder[] = [
      {
        id: "po-1",
        orderNumber: "PC-2026-001",
        supplierId: "SUP-1",
        status: "approved",
        orderDate: "2026-07-29",
        expectedDeliveryDate: "2026-07-30",
        totalValue: 50000,
        createdAt: "2026-07-29T10:00:00Z",
        updatedAt: "2026-07-29T10:00:00Z",
        items: [
          {
            id: "poi-1",
            purchaseOrderId: "po-1",
            materialId: "MAT-CEMENT",
            quantity: 100,
            unitPrice: 500,
            lineTotal: 50000,
            receivedQuantity: 100,
          },
        ],
      },
    ];

    // Dry-Run
    const dryRunReport = await InventoryMigrationService.repairOrphanDeliveries({
      deliveries: mockDeliveries,
      purchaseOrders: mockPOs,
      activeTenantId: "TENANT-A",
      activeCompanyId: "COMP-1",
      dryRun: true,
    });

    expect(dryRunReport.orphanDeliveriesCount).toBe(1);
    expect(dryRunReport.repairedDeliveriesCount).toBe(1);
    expect(dryRunReport.totalFinancialImpactMZN).toBe(50000);

    // Reparação Efetiva
    const realReport = await InventoryMigrationService.repairOrphanDeliveries({
      deliveries: mockDeliveries,
      purchaseOrders: mockPOs,
      activeTenantId: "TENANT-A",
      activeCompanyId: "COMP-1",
      dryRun: false,
    });

    expect(realReport.errors).toEqual([]);
    expect(realReport.repairedMovementsCount).toBe(1);
    expect(realReport.repairedDeliveriesCount).toBe(1);

    // Repetir a reparação deve ser idempotente (0 entregas órfãs restantes)
    const repeatReport = await InventoryMigrationService.repairOrphanDeliveries({
      deliveries: mockDeliveries,
      purchaseOrders: mockPOs,
      activeTenantId: "TENANT-A",
      activeCompanyId: "COMP-1",
      dryRun: false,
    });
    expect(repeatReport.orphanDeliveriesCount).toBe(0);
  });
});
