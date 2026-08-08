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

describe("Inventory Batch Atomicity (Vitest)", () => {
  let uow: InMemoryUnitOfWork;
  let eventPublisher: InMemoryEventPublisher;
  let engine: InventoryEngine;

  const tenantId = toTenantId("TENANT-A");
  const companyId = toCompanyId("COMP-1");
  const locationId = toInventoryLocationId("LOC-WAREHOUSE");

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

  it("should ensure ALL-OR-NOTHING batch atomicity when line 2 in a batch of 3 is invalid", async () => {
    const ctx: InventoryTransactionContext = {
      tenantId,
      companyId,
      correlationId: "c-batch-fail",
      idempotencyKey: "IDEM-BATCH-FAIL-1",
      timestamp: new Date().toISOString(),
      sourceModule: "purchases",
    };

    const batchCommands = [
      { materialId: toMaterialId("MAT-L1"), locationId, quantity: 50, unitCost: 10 }, // Válido
      { materialId: toMaterialId("MAT-L2"), locationId, quantity: -999, unitCost: 10 }, // INVÁLIDO (quantidade negativa)
      { materialId: toMaterialId("MAT-L3"), locationId, quantity: 20, unitCost: 10 }, // Válido
    ];

    // Deve lançar erro na fase de validação
    await expect(engine.receiveStockBatch(ctx, batchCommands)).rejects.toThrow();

    // Verificação de provas empíricas: ZERO rastos alterados no repositório!
    const movL1 = await uow.movements.listByMaterial(tenantId, companyId, toMaterialId("MAT-L1"));
    const movL3 = await uow.movements.listByMaterial(tenantId, companyId, toMaterialId("MAT-L3"));
    const balL1 = await uow.balances.findByDimensions({
      tenantId,
      companyId,
      materialId: toMaterialId("MAT-L1"),
      locationId,
      stockState: "available",
    });

    expect(movL1.length).toBe(0);
    expect(movL3.length).toBe(0);
    expect(balL1).toBeNull();
  });
});
