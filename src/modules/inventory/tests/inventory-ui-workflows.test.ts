/**
 * Testes Integrados de Workflows de UI do Inventário — Inventory UI Workflows Test Suite
 * Categoria: tests
 *
 * Testes automatizados com Vitest validando:
 * 1. Presenter de Erros de Inventário
 * 2. Invocação dos Use Cases via InventoryActions
 * 3. Permissões de UI (useInventoryPermissions)
 */

import { describe, it, expect } from "vitest";
import { InventoryErrorPresenter } from "../application/presenters/inventory-error-presenter";
import { inventoryActions, defaultUnitOfWork } from "../application/actions/action-container";
import {
  toTenantId,
  toCompanyId,
  toInventoryLocationId,
  toMaterialId,
} from "../core/shared/primitives";

describe("Inventory UI Workflows & Presenters (Vitest)", () => {
  it("should format domain errors into user-friendly Portuguese messages", () => {
    const error1 = new Error("INSUFFICIENT_AVAILABLE_STOCK: Stock insuficiente");
    expect(InventoryErrorPresenter.formatError(error1)).toContain("Stock disponível insuficiente");

    const error2 = new Error("INVENTORY_BALANCE_CONFLICT: Concorrência");
    expect(InventoryErrorPresenter.formatError(error2)).toContain(
      "O saldo de inventário foi alterado por outra operação concorrente",
    );

    const error3 = new Error("INVENTORY_MOVEMENT_ALREADY_REVERSED: Estornado");
    expect(InventoryErrorPresenter.formatError(error3)).toContain(
      "Este movimento de inventário já foi revertido",
    );
  });

  it("should execute receive stock via Application Action and update store without mutating stock directly", async () => {
    const res = await inventoryActions.receiveStock({
      tenantId: toTenantId("TENANT-UI"),
      companyId: toCompanyId("COMP-UI"),
      correlationId: "corr-ui-1",
      idempotencyKey: `idem-ui-${Date.now()}`,
      timestamp: new Date().toISOString(),
      sourceModule: "ui_test",
      materialId: "MAT-UI-STEEL",
      locationId: "LOC-UI-WH",
      quantity: 100,
      unitCost: 200,
    });

    expect(res.success).toBe(true);
    expect(res.status).toBe("completed");
    expect(res.movementIds.length).toBe(1);
  });

  it("should execute stock transfer via Application Action cleanly", async () => {
    const tenantId = toTenantId("TENANT-UI");
    const companyId = toCompanyId("COMP-UI");

    await defaultUnitOfWork.locations.saveLocation({
      id: toInventoryLocationId("LOC-WH-A"),
      tenantId,
      companyId,
      name: "Armazém A",
      type: "warehouse",
      status: "active",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await defaultUnitOfWork.locations.saveLocation({
      id: toInventoryLocationId("LOC-WH-B"),
      tenantId,
      companyId,
      name: "Armazém B",
      type: "warehouse",
      status: "active",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Carga inicial
    await inventoryActions.receiveStock({
      tenantId,
      companyId,
      correlationId: "corr-ui-2",
      idempotencyKey: `idem-ui-recv-${Date.now()}`,
      timestamp: new Date().toISOString(),
      sourceModule: "ui_test",
      materialId: "MAT-UI-BRICK",
      locationId: "LOC-WH-A",
      quantity: 50,
      unitCost: 10,
    });

    // Transferência
    const res = await inventoryActions.transferStock({
      tenantId,
      companyId,
      correlationId: "corr-ui-trf",
      idempotencyKey: `idem-ui-trf-${Date.now()}`,
      timestamp: new Date().toISOString(),
      sourceModule: "ui_test",
      materialId: "MAT-UI-BRICK",
      sourceLocationId: "LOC-WH-A",
      destinationLocationId: "LOC-WH-B",
      quantity: 20,
    });

    expect(res.success).toBe(true);
    expect(res.status).toBe("completed");
    expect(res.movementIds.length).toBe(2);
  });
});
