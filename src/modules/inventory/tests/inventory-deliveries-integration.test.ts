import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryUnitOfWork } from "../infrastructure/repositories/in-memory-unit-of-work";
import { InMemoryEventPublisher } from "../infrastructure/event-bus/in-memory-event-publisher";
import { InventoryEngine } from "../core/engine/inventory-engine";
import { ProcessDeliveryIntoInventoryUseCase } from "../features/deliveries-integration/process-delivery-into-inventory";
import { DeliveryConfirmedEventHandler } from "../features/deliveries-integration/delivery-confirmed.handler";
import {
  toTenantId,
  toCompanyId,
  toInventoryLocationId,
  toMaterialId,
} from "../core/shared/primitives";

describe("Deliveries Integration (Vitest)", () => {
  let uow: InMemoryUnitOfWork;
  let eventPublisher: InMemoryEventPublisher;
  let engine: InventoryEngine;
  let useCase: ProcessDeliveryIntoInventoryUseCase;
  let handler: DeliveryConfirmedEventHandler;

  const tenantId = toTenantId("TENANT-A");
  const companyId = toCompanyId("COMP-1");
  const warehouseLocId = toInventoryLocationId("LOC-MAIN-WH");
  const projectLocId = toInventoryLocationId("LOC-SITE-PROJ");

  beforeEach(async () => {
    uow = new InMemoryUnitOfWork();
    eventPublisher = new InMemoryEventPublisher();
    engine = new InventoryEngine(uow, eventPublisher);
    useCase = new ProcessDeliveryIntoInventoryUseCase(engine, uow.locations);
    handler = new DeliveryConfirmedEventHandler(useCase);

    await uow.locations.saveLocation({
      id: warehouseLocId,
      tenantId,
      companyId,
      code: "MAIN_WH",
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

    await uow.locations.saveLocation({
      id: projectLocId,
      tenantId,
      companyId,
      code: "SITE_LOC",
      name: "Local da Obra 01",
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

  it("should process confirmed delivery into warehouse location", async () => {
    const res = await useCase.execute({
      deliveryId: "DEL-1001",
      receiptId: "REC-1",
      tenantId: "TENANT-A",
      companyId: "COMP-1",
      destinationType: "warehouse",
      destinationLocationId: "LOC-MAIN-WH",
      items: [
        {
          deliveryItemId: "DI-1",
          materialId: toMaterialId("MAT-STEEL"),
          receivedQuantity: 50,
          unitCost: 120,
        },
        {
          deliveryItemId: "DI-2",
          materialId: toMaterialId("MAT-BRICK"),
          receivedQuantity: 1000,
          unitCost: 15,
        },
      ],
    });

    expect(res.success).toBe(true);
    expect(res.status).toBe("completed");

    const balSteel = await uow.balances.findByDimensions({
      tenantId,
      companyId,
      materialId: toMaterialId("MAT-STEEL"),
      locationId: warehouseLocId,
      stockState: "available",
    });
    expect(balSteel?.onHandQuantity).toBe(50);
  });

  it("should process supplier direct delivery into active project location", async () => {
    const res = await useCase.execute({
      deliveryId: "DEL-1002",
      receiptId: "REC-1",
      tenantId: "TENANT-A",
      companyId: "COMP-1",
      destinationType: "supplier_direct",
      destinationLocationId: "LOC-SITE-PROJ",
      items: [
        {
          deliveryItemId: "DI-3",
          materialId: toMaterialId("MAT-SAND"),
          receivedQuantity: 15,
          unitCost: 800,
        },
      ],
    });

    expect(res.success).toBe(true);
    expect(res.status).toBe("completed");

    const balSand = await uow.balances.findByDimensions({
      tenantId,
      companyId,
      materialId: toMaterialId("MAT-SAND"),
      locationId: projectLocId,
      stockState: "available",
    });
    expect(balSand?.onHandQuantity).toBe(15);
  });

  it("should allow multiple partial receipts for same deliveryId if receiptId is different", async () => {
    // Parcial 1: 30 un
    const res1 = await useCase.execute({
      deliveryId: "DEL-PARCIAL-1",
      receiptId: "REC-PARCIAL-1",
      tenantId: "TENANT-A",
      companyId: "COMP-1",
      destinationType: "warehouse",
      destinationLocationId: "LOC-MAIN-WH",
      items: [
        {
          deliveryItemId: "DI-P1",
          materialId: toMaterialId("MAT-CEMENT"),
          receivedQuantity: 30,
          unitCost: 50,
        },
      ],
    });
    expect(res1.status).toBe("completed");

    // Parcial 2: 20 un (mesmo deliveryId, receiptId diferente)
    const res2 = await useCase.execute({
      deliveryId: "DEL-PARCIAL-1",
      receiptId: "REC-PARCIAL-2",
      tenantId: "TENANT-A",
      companyId: "COMP-1",
      destinationType: "warehouse",
      destinationLocationId: "LOC-MAIN-WH",
      items: [
        { deliveryItemId: "DI-P2", materialId: "MAT-CEMENT", receivedQuantity: 20, unitCost: 50 },
      ],
    });
    expect(res2.status).toBe("completed");

    const bal = await uow.balances.findByDimensions({
      tenantId,
      companyId,
      materialId: toMaterialId("MAT-CEMENT"),
      locationId: warehouseLocId,
      stockState: "available",
    });
    expect(bal?.onHandQuantity).toBe(50);
  });

  it("should return replayed status if deliveryId and receiptId are identical", async () => {
    const res1 = await useCase.execute({
      deliveryId: "DEL-1001",
      receiptId: "REC-1",
      tenantId: "TENANT-A",
      companyId: "COMP-1",
      destinationType: "warehouse",
      destinationLocationId: "LOC-MAIN-WH",
      items: [
        { deliveryItemId: "DI-1", materialId: "MAT-STEEL", receivedQuantity: 50, unitCost: 120 },
      ],
    });
    expect(res1.status).toBe("completed");

    const res2 = await useCase.execute({
      deliveryId: "DEL-1001",
      receiptId: "REC-1",
      tenantId: "TENANT-A",
      companyId: "COMP-1",
      destinationType: "warehouse",
      destinationLocationId: "LOC-MAIN-WH",
      items: [
        { deliveryItemId: "DI-1", materialId: "MAT-STEEL", receivedQuantity: 50, unitCost: 120 },
      ],
    });
    expect(res2.status).toBe("replayed");
  });

  it("should handle DeliveryConfirmedEvent integration event via DeliveryConfirmedEventHandler", async () => {
    const event = {
      header: {
        eventId: "evt-100",
        eventType: "deliveries.delivery_confirmed",
        tenantId: "TENANT-A",
        companyId: "COMP-1",
        aggregateId: "DEL-HANDLER-1",
        correlationId: "corr-h1",
        idempotencyKey: "idem-h1",
        occurredAt: new Date().toISOString(),
        sourceModule: "deliveries",
      },
      payload: {
        deliveryId: "DEL-HANDLER-1",
        receiptId: "REC-H1",
        tenantId: "TENANT-A",
        companyId: "COMP-1",
        destinationType: "warehouse",
        destinationLocationId: "LOC-MAIN-WH",
        items: [
          {
            deliveryItemId: "DI-H1",
            materialId: "MAT-GRAVEL",
            receivedQuantity: 40,
            unitCost: 300,
          },
        ],
      },
    };

    const res = await handler.handleDeliveryConfirmed(
      event as unknown as import("../core/events/integration-events").DeliveryConfirmedEvent,
    );
    expect(res.success).toBe(true);
    expect(res.status).toBe("completed");

    const bal = await uow.balances.findByDimensions({
      tenantId,
      companyId,
      materialId: toMaterialId("MAT-GRAVEL"),
      locationId: warehouseLocId,
      stockState: "available",
    });
    expect(bal?.onHandQuantity).toBe(40);
  });
});
