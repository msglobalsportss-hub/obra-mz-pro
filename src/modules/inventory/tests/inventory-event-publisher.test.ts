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

describe("Inventory Event Publisher Post-Commit Fault Tolerance (Vitest)", () => {
  let uow: InMemoryUnitOfWork;
  let eventPublisher: InMemoryEventPublisher;
  let engine: InventoryEngine;

  const tenantId = toTenantId("TENANT-A");
  const companyId = toCompanyId("COMP-1");
  const locationId = toInventoryLocationId("LOC-WAREHOUSE");
  const materialId = toMaterialId("MAT-CEMENT");

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

  it("should preserve committed stock transaction even if event subscriber fails after commit", async () => {
    // Subscrever um handler que falha propositadamente
    eventPublisher.subscribe(async (event) => {
      throw new Error("Falha simulada na entrega da mensagem do barramento externo!");
    });

    // Adicionar um evento de integração pendente para ser publicado no commit
    eventPublisher.collectIntegrationEvent({
      eventId: "evt-fail-test",
      eventType: "inventory.stock_received",
      payload: { materialId: "MAT-CEMENT" },
      occurredAt: new Date().toISOString(),
      tenantId: "TENANT-A",
      companyId: "COMP-1",
      correlationId: "c-evt-1",
    });

    const ctx: InventoryTransactionContext = {
      tenantId,
      companyId,
      correlationId: "c-pub-fail",
      idempotencyKey: "IDEM-PUB-FAIL-1",
      timestamp: new Date().toISOString(),
      sourceModule: "purchases",
    };

    // A operação de entrada deve ser concluída sem falhar a alteração física de stock
    const res = await engine.receiveStock(ctx, {
      materialId,
      locationId,
      quantity: 100,
      unitCost: 50,
    });
    expect(res.status).toBe("completed");

    // Confirmar que o saldo foi realmente gravado com sucesso no repositório!
    const bal = await uow.balances.findByDimensions({
      tenantId,
      companyId,
      materialId,
      locationId,
      stockState: "available",
    });
    expect(bal?.onHandQuantity).toBe(100);
  });
});
