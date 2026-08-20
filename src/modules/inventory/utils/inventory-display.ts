import type { Material, Obra } from "@/lib/mock-data";
import type { Warehouse } from "@/lib/materials/warehouse";
import type { Supplier } from "@/lib/suppliers";
import type { PurchaseOrder, Delivery } from "@/lib/purchases";

export function getMaterialDisplay(materialId: string, materials: Material[] = []): { name: string; sku: string; unit: string } {
  const mat = materials.find((m) => m.id === materialId || m.sku === materialId);
  if (mat) {
    return {
      name: mat.name,
      sku: mat.sku || mat.id,
      unit: (mat as any).unit || (mat as any).unidade || "un",
    };
  }
  // Fallback humanizado
  return {
    name: materialId.replace(/^MAT-/, "").replace(/-/g, " "),
    sku: materialId,
    unit: "un",
  };
}

export function getLocationDisplay(
  locationId: string,
  warehouses: Warehouse[] = [],
  obras: Obra[] = []
): { label: string; type: "warehouse" | "project" | "transit" | "unknown"; code: string } {
  if (!locationId) {
    return { label: "Não especificada", type: "unknown", code: "-" };
  }

  if (locationId.startsWith("LOC-TRANSIT-") || locationId.includes("TRANSIT")) {
    return { label: "Stock Em Trânsito", type: "transit", code: "TRANSIT" };
  }

  // Verificar se é armazém
  const wh = warehouses.find(
    (w) => w.id === locationId || w.code === locationId || `WH-${w.id}` === locationId || w.id === locationId.replace(/^WH-/, "")
  );
  if (wh) {
    return { label: `Armazém: ${wh.name}`, type: "warehouse", code: wh.code };
  }

  // Verificar se é obra
  const obra = obras.find((o) => o.id === locationId || (o as any).code === locationId || `PROJ-${o.id}` === locationId);
  if (obra) {
    return { label: `Obra: ${obra.nome}`, type: "project", code: (obra as any).code || obra.id };
  }

  // Mapeamentos comuns fallback
  if (locationId.includes("WH") || locationId.includes("MAIN") || locationId.includes("CENTRAL")) {
    return { label: "Armazém Central", type: "warehouse", code: "WH-MAIN" };
  }

  return { label: locationId.replace(/^LOC-/, "").replace(/-/g, " "), type: "unknown", code: locationId };
}

export function getSupplierDisplay(supplierId: string, suppliers: Supplier[] = []): { name: string; nuit: string } {
  const sup = suppliers.find((s) => s.id === supplierId);
  if (sup) {
    return { name: sup.name, nuit: sup.nuit || "" };
  }
  return { name: supplierId || "Fornecedor Não Identificado", nuit: "" };
}

export function getPurchaseOrderDisplay(poId: string, purchaseOrders: PurchaseOrder[] = []): { orderNumber: string; status: string } {
  const po = purchaseOrders.find((p) => p.id === poId || p.orderNumber === poId);
  if (po) {
    return { orderNumber: po.orderNumber, status: po.status };
  }
  return { orderNumber: poId || "-", status: "draft" };
}

export function getDeliveryDisplay(deliveryId: string, deliveries: Delivery[] = []): { deliveryNumber: string; deliveryNoteNumber?: string } {
  const del = deliveries.find((d) => d.id === deliveryId || d.deliveryNumber === deliveryId);
  if (del) {
    return { deliveryNumber: del.deliveryNumber, deliveryNoteNumber: del.deliveryNoteNumber };
  }
  return { deliveryNumber: deliveryId || "-" };
}
