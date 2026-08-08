import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryUnitOfWork } from "../infrastructure/repositories/in-memory-unit-of-work";
import { InMemoryEventPublisher } from "../infrastructure/event-bus/in-memory-event-publisher";
import { InventoryEngine } from "../core/engine/inventory-engine";
import type { InventoryTransactionContext } from "../core/contracts/shared/inventory-transaction-context";
import {
  toTenantId,
  toCompanyId,
  toMaterialId,
  toInventoryLocationId,
} from "../core/shared/primitives";

describe("Inventory Adjustments Operations (Vitest)", () => {
  let uow: InMemoryUnitOfWork;
  let eventPublisher: InMemoryEventPublisher;
  let engine: InventoryEngine;

  const tenantId = toTenantId("TENANT-A");
  const companyId = toCompanyId("COMP-1");
  const locationId = toInventoryLocationId("LOC-WAREHOUSE");
  const materialId = toMaterialId("MAT-TIMBER");

  beforeEach(async () => {
    uow = new InMemoryUnitOfWork();
    eventPublisher = new InMemoryEventPublisher();
    engine = new InventoryEngine(uow, eventPublisher);

    await uow.locations.saveLocation({
      id: locationId,
      tenantId,
      companyId,
      code: "MAIN_WH",
      name: "Armazém Principal",
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

  it("should process positive adjustment and increase stock", async () => {
    const ctx: InventoryTransactionContext = {
      tenantId,
      companyId,
      correlationId: "corr-adj-1",
      idempotencyKey: "idem-adj-1",
      timestamp: new Date().toISOString(),
      sourceModule: "inventory",
    };

    const res = await engine.adjustStock(ctx, {
      locationId,
      adjustmentType: "manual_override",
      reasonCode: "FOUND_EXTRA",
      reasonDescription: "Encontrado lote excedente na contagem física",
      items: [{ materialId, quantity: 25, unitCost: 120 }],
    });

    expect(res.status).toBe("completed");
    const bal = await uow.balances.findByDimensions({
      tenantId,
      companyId,
      materialId,
      locationId,
      stockState: "available",
    });
    expect(bal?.onHandQuantity).toBe(25);
    expect(bal?.averageCost).toBe(120);
  });

  it("should process negative adjustment and decrease stock", async () => {
    // Primeiramente dar entrada de 50 un
    await engine.receiveStock(
      {
        tenantId,
        companyId,
        correlationId: "c1",
        idempotencyKey: "k1",
        timestamp: new Date().toISOString(),
        sourceModule: "p",
      },
      { materialId, locationId, quantity: 50, unitCost: 100 },
    );

    const ctx: InventoryTransactionContext = {
      tenantId,
      companyId,
      correlationId: "corr-adj-2",
      idempotencyKey: "idem-adj-2",
      timestamp: new Date().toISOString(),
      sourceModule: "inventory",
    };

    const res = await engine.adjustStock(ctx, {
      locationId,
      adjustmentType: "damage_writeoff",
      reasonCode: "DAMAGED_WATER",
      reasonDescription: "Danificado por infiltração de água",
      items: [{ materialId, quantity: -10 }],
    });

    expect(res.status).toBe("completed");
    const bal = await uow.balances.findByDimensions({
      tenantId,
      companyId,
      materialId,
      locationId,
      stockState: "available",
    });
    expect(bal?.onHandQuantity).toBe(40);
    expect(bal?.averageCost).toBe(100);
  });

  it("should reject adjustment if reasonDescription is missing or empty", async () => {
    const ctx: InventoryTransactionContext = {
      tenantId,
      companyId,
      correlationId: "corr-adj-3",
      idempotencyKey: "idem-adj-3",
      timestamp: new Date().toISOString(),
      sourceModule: "inventory",
    };

    await expect(
      engine.adjustStock(ctx, {
        locationId,
        adjustmentType: "manual_override",
        reasonCode: "FOUND_EXTRA",
        reasonDescription: "   ",
        items: [{ materialId, quantity: 5 }],
      }),
    ).rejects.toThrow();
  });

  it("should reject negative adjustment if stock would become negative without policy allowance", async () => {
    await engine.receiveStock(
      {
        tenantId,
        companyId,
        correlationId: "c1",
        idempotencyKey: "k1",
        timestamp: new Date().toISOString(),
        sourceModule: "p",
      },
      { materialId, locationId, quantity: 10, unitCost: 100 },
    );

    const ctx: InventoryTransactionContext = {
      tenantId,
      companyId,
      correlationId: "corr-adj-4",
      idempotencyKey: "idem-adj-4",
      timestamp: new Date().toISOString(),
      sourceModule: "inventory",
    };

    await expect(
      engine.adjustStock(ctx, {
        locationId,
        adjustmentType: "shrinkage",
        reasonCode: "LOST",
        reasonDescription: "Perda não explicada",
        items: [{ materialId, quantity: -50 }],
      }),
    ).rejects.toThrow();
  });
});
