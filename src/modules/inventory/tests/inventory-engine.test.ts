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
  toActorId,
} from "../core/shared/primitives";

describe("InventoryEngine Core Operations (Vitest)", () => {
  let uow: InMemoryUnitOfWork;
  let eventPublisher: InMemoryEventPublisher;
  let engine: InventoryEngine;

  const tenantId = toTenantId("TENANT-A");
  const companyId = toCompanyId("COMP-1");
  const locationIdA = toInventoryLocationId("LOC-WAREHOUSE");
  const locationIdB = toInventoryLocationId("LOC-PROJECT-1");
  const materialId = toMaterialId("MAT-CEMENT-50KG");

  beforeEach(async () => {
    uow = new InMemoryUnitOfWork();
    eventPublisher = new InMemoryEventPublisher();
    engine = new InventoryEngine(uow, eventPublisher);

    await uow.locations.saveLocation({
      id: locationIdA,
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

    await uow.locations.saveLocation({
      id: locationIdB,
      tenantId,
      companyId,
      code: "PROJ_LOC",
      name: "Localização de Obra",
      type: "project",
      isActive: true,
      isDefault: false,
      allowsInbound: true,
      allowsOutbound: true,
      allowsReservations: true,
      allowsTransfers: true,
      allowsConsumption: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  it("should process initial stock receipt when quantity is zero", async () => {
    const ctx: InventoryTransactionContext = {
      tenantId,
      companyId,
      correlationId: "corr-rec-1",
      idempotencyKey: "idem-rec-1",
      timestamp: new Date().toISOString(),
      sourceModule: "purchases",
    };

    const res = await engine.receiveStock(ctx, {
      materialId,
      locationId: locationIdA,
      quantity: 100,
      unitCost: 50,
    });

    expect(res.status).toBe("completed");
    expect(res.movementIds.length).toBe(1);

    const bal = await uow.balances.findByDimensions({
      tenantId,
      companyId,
      materialId,
      locationId: locationIdA,
      stockState: "available",
    });
    expect(bal?.onHandQuantity).toBe(100);
    expect(bal?.averageCost).toBe(50);
    expect(bal?.totalValue).toBe(5000);
  });

  it("should calculate WAC accurately on subsequent entries with different unit costs", async () => {
    // Entry 1: 100 @ 50 MT = 5000 MT
    await engine.receiveStock(
      {
        tenantId,
        companyId,
        correlationId: "c1",
        idempotencyKey: "k1",
        timestamp: new Date().toISOString(),
        sourceModule: "p",
      },
      { materialId, locationId: locationIdA, quantity: 100, unitCost: 50 },
    );
    // Entry 2: 50 @ 80 MT = 4000 MT
    // New WAC = 9000 / 150 = 60 MT
    await engine.receiveStock(
      {
        tenantId,
        companyId,
        correlationId: "c2",
        idempotencyKey: "k2",
        timestamp: new Date().toISOString(),
        sourceModule: "p",
      },
      { materialId, locationId: locationIdA, quantity: 50, unitCost: 80 },
    );

    const bal = await uow.balances.findByDimensions({
      tenantId,
      companyId,
      materialId,
      locationId: locationIdA,
      stockState: "available",
    });
    expect(bal?.onHandQuantity).toBe(150);
    expect(bal?.averageCost).toBe(60);
    expect(bal?.totalValue).toBe(9000);
  });

  it("should reduce onHand quantity and preserve WAC on stock issue", async () => {
    await engine.receiveStock(
      {
        tenantId,
        companyId,
        correlationId: "c1",
        idempotencyKey: "k1",
        timestamp: new Date().toISOString(),
        sourceModule: "p",
      },
      { materialId, locationId: locationIdA, quantity: 100, unitCost: 50 },
    );

    const res = await engine.issueStock(
      {
        tenantId,
        companyId,
        correlationId: "c3",
        idempotencyKey: "k3",
        timestamp: new Date().toISOString(),
        sourceModule: "p",
      },
      { materialId, locationId: locationIdA, quantity: 30 },
    );

    expect(res.status).toBe("completed");
    const bal = await uow.balances.findByDimensions({
      tenantId,
      companyId,
      materialId,
      locationId: locationIdA,
      stockState: "available",
    });
    expect(bal?.onHandQuantity).toBe(70);
    expect(bal?.averageCost).toBe(50);
    expect(bal?.totalValue).toBe(3500);
  });

  it("should reject stock issue when stock is insufficient", async () => {
    await engine.receiveStock(
      {
        tenantId,
        companyId,
        correlationId: "c1",
        idempotencyKey: "k1",
        timestamp: new Date().toISOString(),
        sourceModule: "p",
      },
      { materialId, locationId: locationIdA, quantity: 10, unitCost: 50 },
    );

    await expect(
      engine.issueStock(
        {
          tenantId,
          companyId,
          correlationId: "c4",
          idempotencyKey: "k4",
          timestamp: new Date().toISOString(),
          sourceModule: "p",
        },
        { materialId, locationId: locationIdA, quantity: 50 },
      ),
    ).rejects.toThrow();
  });

  it("should generate paired transfer movements and calculate WAC at destination", async () => {
    await engine.receiveStock(
      {
        tenantId,
        companyId,
        correlationId: "c1",
        idempotencyKey: "k1",
        timestamp: new Date().toISOString(),
        sourceModule: "p",
      },
      { materialId, locationId: locationIdA, quantity: 100, unitCost: 50 },
    );
    await engine.receiveStock(
      {
        tenantId,
        companyId,
        correlationId: "c2",
        idempotencyKey: "k2",
        timestamp: new Date().toISOString(),
        sourceModule: "p",
      },
      { materialId, locationId: locationIdB, quantity: 20, unitCost: 80 },
    );

    const res = await engine.transferStock(
      {
        tenantId,
        companyId,
        correlationId: "c5",
        idempotencyKey: "k5",
        timestamp: new Date().toISOString(),
        sourceModule: "p",
      },
      {
        materialId,
        sourceLocationId: locationIdA,
        destinationLocationId: locationIdB,
        quantity: 40,
      },
    );

    expect(res.movementIds.length).toBe(2);
    const balA = await uow.balances.findByDimensions({
      tenantId,
      companyId,
      materialId,
      locationId: locationIdA,
      stockState: "available",
    });
    const balB = await uow.balances.findByDimensions({
      tenantId,
      companyId,
      materialId,
      locationId: locationIdB,
      stockState: "available",
    });

    expect(balA?.onHandQuantity).toBe(60);
    expect(balB?.onHandQuantity).toBe(60);
    expect(balB?.averageCost).toBe(60);
  });

  it("should reserve stock without reducing onHand quantity", async () => {
    await engine.receiveStock(
      {
        tenantId,
        companyId,
        correlationId: "c1",
        idempotencyKey: "k1",
        timestamp: new Date().toISOString(),
        sourceModule: "p",
      },
      { materialId, locationId: locationIdA, quantity: 100, unitCost: 50 },
    );

    const res = await engine.reserveStock(
      {
        tenantId,
        companyId,
        correlationId: "c6",
        idempotencyKey: "k6",
        timestamp: new Date().toISOString(),
        sourceModule: "p",
      },
      { materialId, locationId: locationIdA, quantity: 30 },
    );

    const bal = await uow.balances.findByDimensions({
      tenantId,
      companyId,
      materialId,
      locationId: locationIdA,
      stockState: "available",
    });
    expect(bal?.onHandQuantity).toBe(100);
    expect(bal?.reservedQuantity).toBe(30);
    expect(bal?.availableQuantity).toBe(70);
  });

  it("should consume reserved stock reducing both reserved and onHand quantities", async () => {
    await engine.receiveStock(
      {
        tenantId,
        companyId,
        correlationId: "c1",
        idempotencyKey: "k1",
        timestamp: new Date().toISOString(),
        sourceModule: "p",
      },
      { materialId, locationId: locationIdA, quantity: 100, unitCost: 50 },
    );
    const resReserve = await engine.reserveStock(
      {
        tenantId,
        companyId,
        correlationId: "c6",
        idempotencyKey: "k6",
        timestamp: new Date().toISOString(),
        sourceModule: "p",
      },
      { materialId, locationId: locationIdA, quantity: 30 },
    );
    const reservationId = (resReserve.resultDetails as { reservation: { id: unknown } }).reservation
      .id as unknown as import("../core/shared/primitives").InventoryReservationId;

    await engine.consumeReservation(
      {
        tenantId,
        companyId,
        correlationId: "c7",
        idempotencyKey: "k7",
        timestamp: new Date().toISOString(),
        sourceModule: "p",
      },
      { reservationId, quantityToConsume: 10 },
    );

    const bal = await uow.balances.findByDimensions({
      tenantId,
      companyId,
      materialId,
      locationId: locationIdA,
      stockState: "available",
    });
    expect(bal?.onHandQuantity).toBe(90);
    expect(bal?.reservedQuantity).toBe(20);
    expect(bal?.availableQuantity).toBe(70);
  });

  it("should release reserved stock restoring available quantity", async () => {
    await engine.receiveStock(
      {
        tenantId,
        companyId,
        correlationId: "c1",
        idempotencyKey: "k1",
        timestamp: new Date().toISOString(),
        sourceModule: "p",
      },
      { materialId, locationId: locationIdA, quantity: 100, unitCost: 50 },
    );
    const resReserve2 = await engine.reserveStock(
      {
        tenantId,
        companyId,
        correlationId: "c6",
        idempotencyKey: "k6",
        timestamp: new Date().toISOString(),
        sourceModule: "p",
      },
      { materialId, locationId: locationIdA, quantity: 30 },
    );
    const reservationId2 = (resReserve2.resultDetails as { reservation: { id: unknown } })
      .reservation.id as unknown as import("../core/shared/primitives").InventoryReservationId;

    await engine.releaseReservation(
      {
        tenantId,
        companyId,
        correlationId: "c-rel",
        idempotencyKey: "k-rel",
        timestamp: new Date().toISOString(),
        sourceModule: "p",
      },
      { reservationId: reservationId2, quantityToRelease: 15, reason: "Cancelamento de obra" },
    );

    const bal = await uow.balances.findByDimensions({
      tenantId,
      companyId,
      materialId,
      locationId: locationIdA,
      stockState: "available",
    });
    expect(bal?.onHandQuantity).toBe(100);
    expect(bal?.reservedQuantity).toBe(15);
    expect(bal?.availableQuantity).toBe(85);
  });

  it("should rollback transaction state completely if Unit of Work fails", async () => {
    await engine.receiveStock(
      {
        tenantId,
        companyId,
        correlationId: "c1",
        idempotencyKey: "k1",
        timestamp: new Date().toISOString(),
        sourceModule: "p",
      },
      { materialId, locationId: locationIdA, quantity: 100, unitCost: 50 },
    );

    await expect(
      engine.transferStock(
        {
          tenantId,
          companyId,
          correlationId: "c8",
          idempotencyKey: "k8",
          timestamp: new Date().toISOString(),
          sourceModule: "p",
        },
        {
          materialId,
          sourceLocationId: locationIdA,
          destinationLocationId: toInventoryLocationId("NON-EXISTENT"),
          quantity: 50,
        },
      ),
    ).rejects.toThrow();

    const balA = await uow.balances.findByDimensions({
      tenantId,
      companyId,
      materialId,
      locationId: locationIdA,
      stockState: "available",
    });
    expect(balA?.onHandQuantity).toBe(100);
  });
});
