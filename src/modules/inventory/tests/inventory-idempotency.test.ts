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
  toProcessedInventoryOperationId,
} from "../core/shared/primitives";

describe("Inventory Idempotency & Concurrency (Vitest)", () => {
  let uow: InMemoryUnitOfWork;
  let eventPublisher: InMemoryEventPublisher;
  let engine: InventoryEngine;

  const tenantId = toTenantId("TENANT-A");
  const companyId = toCompanyId("COMP-1");
  const locationId = toInventoryLocationId("LOC-WAREHOUSE");
  const materialId = toMaterialId("MAT-BLOCKS");

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

  it("should return completed on first call and replayed on second call with identical idempotencyKey", async () => {
    const ctx: InventoryTransactionContext = {
      tenantId,
      companyId,
      correlationId: "c-idem-1",
      idempotencyKey: "UNIQUE-IDEM-KEY-1",
      timestamp: new Date().toISOString(),
      sourceModule: "purchases",
    };

    const res1 = await engine.receiveStock(ctx, {
      materialId,
      locationId,
      quantity: 100,
      unitCost: 10,
    });
    expect(res1.status).toBe("completed");

    const res2 = await engine.receiveStock(ctx, {
      materialId,
      locationId,
      quantity: 100,
      unitCost: 10,
    });
    expect(res2.status).toBe("replayed");
    expect(res2.movementIds[0]).toBe(res1.movementIds[0]);
  });

  it("should throw InventoryOperationAlreadyProcessingError if operation status is processing", async () => {
    const key = "IDEM-PROCESSING-KEY";

    // Inserir manualmente um registo com status 'processing' no repositório
    await uow.processedOperations.storeProcessedOperation({
      id: toProcessedInventoryOperationId("op-proc-1"),
      tenantId,
      companyId,
      idempotencyKey: key,
      operationType: "stock_entry",
      referenceType: "system",
      referenceId: key,
      status: "processing",
      processingStartedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    const ctx: InventoryTransactionContext = {
      tenantId,
      companyId,
      correlationId: "c-idem-2",
      idempotencyKey: key,
      timestamp: new Date().toISOString(),
      sourceModule: "purchases",
    };

    await expect(
      engine.receiveStock(ctx, { materialId, locationId, quantity: 50, unitCost: 10 }),
    ).rejects.toThrow();
  });

  it("should allow same idempotencyKey for different companies (isolated multi-tenant keying)", async () => {
    const sameKey = "SHARED-IDEM-KEY";

    const ctxCompany1: InventoryTransactionContext = {
      tenantId,
      companyId: toCompanyId("COMP-1"),
      correlationId: "c-c1",
      idempotencyKey: sameKey,
      timestamp: new Date().toISOString(),
      sourceModule: "purchases",
    };

    const ctxCompany2: InventoryTransactionContext = {
      tenantId,
      companyId: toCompanyId("COMP-2"),
      correlationId: "c-c2",
      idempotencyKey: sameKey,
      timestamp: new Date().toISOString(),
      sourceModule: "purchases",
    };

    const locC1 = toInventoryLocationId("LOC-COMP-1");
    const locC2 = toInventoryLocationId("LOC-COMP-2");

    await uow.locations.saveLocation({
      id: locC1,
      tenantId,
      companyId: toCompanyId("COMP-1"),
      code: "MAIN_WH_1",
      name: "Armazém COMP-1",
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
      id: locC2,
      tenantId,
      companyId: toCompanyId("COMP-2"),
      code: "MAIN_WH_2",
      name: "Armazém COMP-2",
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

    const res1 = await engine.receiveStock(ctxCompany1, {
      materialId,
      locationId: locC1,
      quantity: 40,
      unitCost: 10,
    });
    const res2 = await engine.receiveStock(ctxCompany2, {
      materialId,
      locationId: locC2,
      quantity: 40,
      unitCost: 10,
    });

    expect(res1.status).toBe("completed");
    expect(res2.status).toBe("completed");
    expect(res1.operationId).not.toBe(res2.operationId);
  });
});
