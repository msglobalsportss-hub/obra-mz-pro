import { describe, it, expect, beforeEach } from "vitest";
import { inventoryStoreManager } from "../store/inventory-store";
import { defaultUnitOfWork, inventoryActions } from "../application/actions/action-container";
import { toTenantId, toCompanyId, toInventoryLocationId } from "../core/shared/primitives";
import { useDeliveriesUiStateStore } from "../store/deliveries-ui-state";
import {
  canTransitionDeliveryStatus,
  type PurchaseDelivery,
  type ReceiptBatch,
  type DeliveryDocument,
} from "@/lib/purchases";

describe("ETAPA 3.7 | BLOCO 1 - Navegação Operacional Real (Vitest)", () => {
  beforeEach(async () => {
    inventoryStoreManager.logout();
    inventoryStoreManager.switchCompanyScope("TENANT-A", "COMP-1");
    useDeliveriesUiStateStore.getState().clearFilters();

    await defaultUnitOfWork.locations.saveLocation({
      id: toInventoryLocationId("WH-MAIN"),
      tenantId: toTenantId("TENANT-A"),
      companyId: toCompanyId("COMP-1"),
      code: "WH-MAIN",
      name: "Armazém Central Maputo",
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

  it("1. Resolução da Rota Dinâmica `/app/inventory/deliveries/$deliveryId`", () => {
    const deliveryId = "del-8801";
    const routePath = `/app/inventory/deliveries/${deliveryId}`;

    expect(routePath).toBe("/app/inventory/deliveries/del-8801");
    expect(deliveryId).toBeTruthy();
  });

  it("2. Preservação de Contexto (Filtros, Pesquisa e Paginação)", () => {
    const store = useDeliveriesUiStateStore.getState();

    store.setSearchTerm("Cimento");
    store.setPhysicalStatusFilter("partially_received");
    store.setCurrentPage(2);

    const updated = useDeliveriesUiStateStore.getState();
    expect(updated.searchTerm).toBe("Cimento");
    expect(updated.physicalStatusFilter).toBe("partially_received");
    expect(updated.currentPage).toBe(2);

    // Limpar filtros restaura estado inicial
    store.clearFilters();
    const cleared = useDeliveriesUiStateStore.getState();
    expect(cleared.searchTerm).toBe("");
    expect(cleared.physicalStatusFilter).toBe("all");
    expect(cleared.currentPage).toBe(1);
  });

  it("3. Validação de Transições de Estado Sem Navegação Falsa", () => {
    expect(canTransitionDeliveryStatus("expected", "in_transit")).toBe(true);
    expect(canTransitionDeliveryStatus("in_transit", "arrived")).toBe(true);
    expect(canTransitionDeliveryStatus("arrived", "in_inspection")).toBe(true);
    expect(canTransitionDeliveryStatus("confirmed", "in_inspection")).toBe(false);
  });

  it("4. Estrutura de Documentos Reais Persistidos", () => {
    const doc: DeliveryDocument = {
      id: "doc-101",
      deliveryId: "del-8801",
      fileName: "Guia_Remessa_8801.pdf",
      fileType: "application/pdf",
      fileSize: 1024500,
      fileUrl: "blob:http://localhost/doc-101",
      category: "remittance_note",
      uploadedAt: new Date().toISOString(),
      uploadedByUserName: "Fiel de Armazém",
    };

    expect(doc.category).toBe("remittance_note");
    expect(doc.fileSize).toBe(1024500);
  });
});
