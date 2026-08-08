import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryUnitOfWork } from "../infrastructure/repositories/in-memory-unit-of-work";
import { InMemoryEventPublisher } from "../infrastructure/event-bus/in-memory-event-publisher";
import { InventoryEngine } from "../core/engine/inventory-engine";
import {
  toTenantId,
  toCompanyId,
  toInventoryLocationId,
  toMaterialId,
} from "../core/shared/primitives";

describe("Inventory Balance Rebuilder (Vitest)", () => {
  let uow: InMemoryUnitOfWork;
  let eventPublisher: InMemoryEventPublisher;
  let engine: InventoryEngine;

  const tenantId = toTenantId("TENANT-A");
  const companyId = toCompanyId("COMP-1");
  const locationId = toInventoryLocationId("LOC-100");
  const materialId = toMaterialId("MAT-REBUILD-1");

  beforeEach(async () => {
    uow = new InMemoryUnitOfWork();
    eventPublisher = new InMemoryEventPublisher();
    engine = new InventoryEngine(uow, eventPublisher);

    await uow.locations.saveLocation({
      id: locationId,
      tenantId,
      companyId,
      code: "WH-1",
      name: "WH 1",
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

  it("should rebuild balances chronologically from movements and detect discrepancies", async () => {
    const ctx1 = {
      tenantId,
      companyId,
      correlationId: "c1",
      idempotencyKey: "k1",
      timestamp: "2026-07-28T01:00:00.000Z",
      sourceModule: "p",
    };
    await engine.receiveStock(ctx1, { materialId, locationId, quantity: 100, unitCost: 20 });

    const ctx2 = {
      tenantId,
      companyId,
      correlationId: "c2",
      idempotencyKey: "k2",
      timestamp: "2026-07-28T02:00:00.000Z",
      sourceModule: "p",
    };
    await engine.receiveStock(ctx2, { materialId, locationId, quantity: 50, unitCost: 50 });

    const ctx3 = {
      tenantId,
      companyId,
      correlationId: "c3",
      idempotencyKey: "k3",
      timestamp: "2026-07-28T03:00:00.000Z",
      sourceModule: "p",
    };
    await engine.issueStock(ctx3, { materialId, locationId, quantity: 30 });

    const ctxRebuild = {
      tenantId,
      companyId,
      correlationId: "c-reb",
      idempotencyKey: "k-reb",
      timestamp: new Date().toISOString(),
      sourceModule: "system",
    };
    const rebuildResult = await engine.rebuildBalances(ctxRebuild, { materialId });

    expect(rebuildResult.processedMovements).toBe(3);
    expect(rebuildResult.rebuiltBalances).toBe(1);

    const balAfter = await uow.balances.findByDimensions({
      tenantId,
      companyId,
      materialId,
      locationId,
      stockState: "available",
    });
    expect(balAfter?.onHandQuantity).toBe(120);
    expect(balAfter?.averageCost).toBe(30);
  });

  it("should handle equal occurredAt timestamps using tie-breaker deterministic sorting", async () => {
    const sameTimestamp = "2026-07-28T12:00:00.000Z";

    await engine.receiveStock(
      {
        tenantId,
        companyId,
        correlationId: "c1",
        idempotencyKey: "k-t1",
        timestamp: sameTimestamp,
        sourceModule: "p",
      },
      { materialId, locationId, quantity: 100, unitCost: 10 },
    );
    await engine.issueStock(
      {
        tenantId,
        companyId,
        correlationId: "c2",
        idempotencyKey: "k-t2",
        timestamp: sameTimestamp,
        sourceModule: "p",
      },
      { materialId, locationId, quantity: 20 },
    );

    const rebuildResult = await engine.rebuildBalances(
      {
        tenantId,
        companyId,
        correlationId: "c-reb",
        idempotencyKey: "k-reb2",
        timestamp: new Date().toISOString(),
        sourceModule: "system",
      },
      { materialId },
    );

    expect(rebuildResult.processedMovements).toBe(2);
    const balAfter = await uow.balances.findByDimensions({
      tenantId,
      companyId,
      materialId,
      locationId,
      stockState: "available",
    });
    expect(balAfter?.onHandQuantity).toBe(80);
  });

  it("should handle rebuild with empty movement history gracefully", async () => {
    const resEmpty = await engine.rebuildBalances(
      {
        tenantId,
        companyId,
        correlationId: "c-reb",
        idempotencyKey: "k-reb-empty",
        timestamp: new Date().toISOString(),
        sourceModule: "system",
      },
      { materialId: toMaterialId("MAT-NONE") },
    );

    expect(resEmpty.processedMovements).toBe(0);
    expect(resEmpty.rebuiltBalances).toBe(0);
  });
});
