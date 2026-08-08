import { describe, it, expect, beforeEach } from "vitest";
import { inventoryStoreManager, buildInventoryStorageKey } from "../store/inventory-store";
import { InventorySelectors } from "../store/inventory-selectors";
import type { InventoryBalanceView, StockMovementView } from "../store/inventory-store.types";

describe("Zustand Inventory Store & Selectors (Vitest)", () => {
  beforeEach(() => {
    inventoryStoreManager.logout(); // Reset store state before each test
  });

  it("should format storage key as tenantId:companyId:v{schemaVersion}", () => {
    const key = buildInventoryStorageKey("TENANT-A", "COMP-1", 1);
    expect(key).toBe("inventory:TENANT-A:COMP-1:v1");
  });

  it("should return default anonymous key when tenant or company is null", () => {
    const key = buildInventoryStorageKey(null, null, 1);
    expect(key).toBe("inventory:anonymous:v1");
  });

  it("should switch company scope and purge state of previous company", () => {
    inventoryStoreManager.switchCompanyScope("TENANT-A", "COMP-1");

    inventoryStoreManager.upsertBalanceView({
      id: "BAL-1",
      tenantId: "TENANT-A",
      companyId: "COMP-1",
      materialId: "MAT-1",
      locationId: "LOC-1",
      stockState: "available",
      onHandQuantity: 100,
      reservedQuantity: 0,
      availableQuantity: 100,
      averageCost: 50,
      totalValue: 5000,
      version: 1,
      updatedAt: new Date().toISOString(),
    });

    expect(Object.keys(inventoryStoreManager.getState().balances).length).toBe(1);

    // Mudar de empresa para COMP-2
    inventoryStoreManager.switchCompanyScope("TENANT-A", "COMP-2");

    // Purga imediata do estado anterior!
    expect(inventoryStoreManager.getState().companyId).toBe("COMP-2");
    expect(Object.keys(inventoryStoreManager.getState().balances).length).toBe(0);
  });

  it("should purge all sensitive state on logout", () => {
    inventoryStoreManager.switchCompanyScope("TENANT-A", "COMP-1");
    inventoryStoreManager.appendMovementView({
      id: "MOV-1",
      tenantId: "TENANT-A",
      companyId: "COMP-1",
      materialId: "MAT-1",
      movementType: "delivery_receipt",
      status: "confirmed",
      quantity: 50,
      stockState: "available",
      referenceType: "DELIVERY",
      referenceId: "DEL-1",
      correlationId: "c1",
      occurredAt: new Date().toISOString(),
    });

    expect(inventoryStoreManager.getState().movements.length).toBe(1);

    inventoryStoreManager.logout();

    expect(inventoryStoreManager.getState().tenantId).toBeNull();
    expect(inventoryStoreManager.getState().companyId).toBeNull();
    expect(inventoryStoreManager.getState().movements.length).toBe(0);
  });

  it("should deduplicate movements by ID on appendMovementView", () => {
    inventoryStoreManager.switchCompanyScope("TENANT-A", "COMP-1");

    const mov: StockMovementView = {
      id: "MOV-DEDUP",
      tenantId: "TENANT-A",
      companyId: "COMP-1",
      materialId: "MAT-1",
      movementType: "delivery_receipt",
      status: "confirmed",
      quantity: 50,
      stockState: "available",
      referenceType: "DELIVERY",
      referenceId: "DEL-1",
      correlationId: "c1",
      occurredAt: new Date().toISOString(),
    };

    inventoryStoreManager.appendMovementView(mov);
    inventoryStoreManager.appendMovementView(mov); // Segunda tentativa de adicionar o mesmo movimento

    expect(inventoryStoreManager.getState().movements.length).toBe(1);
  });

  it("should calculate pure selector values correctly", () => {
    inventoryStoreManager.switchCompanyScope("TENANT-A", "COMP-1");

    inventoryStoreManager.upsertBalanceView({
      id: "BAL-1",
      tenantId: "TENANT-A",
      companyId: "COMP-1",
      materialId: "MAT-1",
      locationId: "LOC-1",
      stockState: "available",
      onHandQuantity: 100,
      reservedQuantity: 20,
      availableQuantity: 80,
      averageCost: 50,
      totalValue: 5000,
      version: 1,
      updatedAt: new Date().toISOString(),
    });

    const state = inventoryStoreManager.getState();
    expect(InventorySelectors.selectAvailableQuantity(state, "MAT-1", "LOC-1")).toBe(80);
    expect(InventorySelectors.selectReservedQuantity(state, "MAT-1", "LOC-1")).toBe(20);
    expect(InventorySelectors.selectTotalInventoryValue(state)).toBe(5000);
  });
});
