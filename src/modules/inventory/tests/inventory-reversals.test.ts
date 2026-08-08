import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryUnitOfWork } from "../infrastructure/repositories/in-memory-unit-of-work";
import { InMemoryEventPublisher } from "../infrastructure/event-bus/in-memory-event-publisher";
import { InventoryEngine } from "../core/engine/inventory-engine";
import { InventoryConsistencyChecker } from "../core/services/inventory-consistency-checker";
import type { InventoryTransactionContext } from "../core/contracts/shared/inventory-transaction-context";
import {
  toTenantId,
  toCompanyId,
  toMaterialId,
  toInventoryLocationId,
  toStockMovementId,
} from "../core/shared/primitives";

describe("Inventory Reversals Operations (Vitest)", () => {
  let uow: InMemoryUnitOfWork;
  let eventPublisher: InMemoryEventPublisher;
  let engine: InventoryEngine;

  const tenantId = toTenantId("TENANT-A");
  const companyId = toCompanyId("COMP-1");
  const locationId = toInventoryLocationId("LOC-WAREHOUSE");
  const materialId = toMaterialId("MAT-PIPES");

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

  it("should create compensatory movement for original entry reversal", async () => {
    const resEntry = await engine.receiveStock(
      {
        tenantId,
        companyId,
        correlationId: "c1",
        idempotencyKey: "k1",
        timestamp: new Date().toISOString(),
        sourceModule: "p",
      },
      { materialId, locationId, quantity: 100, unitCost: 40 },
    );

    const movIdToReverse = toStockMovementId(resEntry.movementIds[0]!);

    const resRev = await engine.reverseMovement(
      {
        tenantId,
        companyId,
        correlationId: "c-rev",
        idempotencyKey: "k-rev",
        timestamp: new Date().toISOString(),
        sourceModule: "p",
      },
      { movementIdToReverse: movIdToReverse, reason: "Erro de lançamento na fatura" },
    );

    expect(resRev.status).toBe("completed");
    const bal = await uow.balances.findByDimensions({
      tenantId,
      companyId,
      materialId,
      locationId,
      stockState: "available",
    });
    expect(bal?.onHandQuantity).toBe(0);

    const revMov = await uow.movements.findById(toStockMovementId(resRev.movementIds[0]!));
    expect(revMov?.reversalOfMovementId).toBe(movIdToReverse);
  });

  it("should reject double reversal of the same movement", async () => {
    const resEntry = await engine.receiveStock(
      {
        tenantId,
        companyId,
        correlationId: "c1",
        idempotencyKey: "k1",
        timestamp: new Date().toISOString(),
        sourceModule: "p",
      },
      { materialId, locationId, quantity: 100, unitCost: 40 },
    );

    const movIdToReverse = toStockMovementId(resEntry.movementIds[0]!);

    await engine.reverseMovement(
      {
        tenantId,
        companyId,
        correlationId: "c-rev-1",
        idempotencyKey: "k-rev-1",
        timestamp: new Date().toISOString(),
        sourceModule: "p",
      },
      { movementIdToReverse: movIdToReverse, reason: "Primeira reversão" },
    );

    // Tentar reverter novamente o mesmo movimento
    await expect(
      engine.reverseMovement(
        {
          tenantId,
          companyId,
          correlationId: "c-rev-2",
          idempotencyKey: "k-rev-2",
          timestamp: new Date().toISOString(),
          sourceModule: "p",
        },
        { movementIdToReverse: movIdToReverse, reason: "Segunda reversão" },
      ),
    ).rejects.toThrow();
  });

  it("should be diagnosed by ConsistencyChecker if double reversal occurs", async () => {
    const health = await InventoryConsistencyChecker.checkHealth(tenantId, companyId, uow.context);
    expect(health.healthy).toBe(true);
  });
});
