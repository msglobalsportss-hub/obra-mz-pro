// Seeds de demonstração para Compras, Entregas, Movimentos e Saldos (Etapa 6.3)
// Todos os seeds são internamente consistentes — verificar com validateSeedsConsistency()
import type {
  PurchaseOrder,
  PurchaseOrderItem,
  Delivery,
  DeliveryItem,
  StockMovement,
  InventoryBalance,
} from "./purchase-types";

// ---------------------------------------------------------------------------
// PurchaseOrders
// ---------------------------------------------------------------------------

export const demoPurchaseOrdersSeed: PurchaseOrder[] = [
  {
    // po-1 — Rascunho (sem entregas)
    id: "po-1",
    orderNumber: "PC-2026-0001",
    supplierId: "supp-1", // Cimentos de Moçambique, SARL
    supplierReference: "QT-CIM-2026-001",
    destinationType: "central_stock",
    destinationProjectId: undefined,
    orderDate: "2026-07-10",
    expectedDeliveryDate: "2026-07-14",
    status: "draft",
    currency: "MZN",
    subtotal: 16800,
    discountAmount: undefined,
    taxAmount: undefined,
    totalAmount: 16800,
    paymentTermType: "credit_30",
    paymentTermDays: 30,
    notes: "Encomenda inicial de cimento para stock central.",
    internalNotes: undefined,
    attachmentIds: undefined,
    createdAt: "2026-07-10T08:00:00.000Z",
    updatedAt: "2026-07-10T08:00:00.000Z",
    approvedAt: undefined,
    sentAt: undefined,
    cancelledAt: undefined,
  },
  {
    // po-2 — Parcialmente Recebido (obra o1)
    id: "po-2",
    orderNumber: "PC-2026-0002",
    supplierId: "supp-2", // Sogecoa Materiais de Construção
    supplierReference: "QT-SOG-2026-042",
    destinationType: "project",
    destinationProjectId: "o1",
    orderDate: "2026-07-12",
    expectedDeliveryDate: "2026-07-16",
    status: "partially_received",
    currency: "MZN",
    // poi-2: 30 × 620 = 18600; poi-3: 500 × 42 = 21000 → subtotal = 39600
    subtotal: 39600,
    discountAmount: undefined,
    taxAmount: undefined,
    totalAmount: 39600,
    paymentTermType: "credit_15",
    paymentTermDays: 15,
    notes: "Materiais para fundação da Obra 1.",
    internalNotes: undefined,
    attachmentIds: undefined,
    createdAt: "2026-07-12T09:00:00.000Z",
    updatedAt: "2026-07-18T14:30:00.000Z",
    approvedAt: "2026-07-12T10:00:00.000Z",
    sentAt: "2026-07-13T08:00:00.000Z",
    cancelledAt: undefined,
  },
];

// ---------------------------------------------------------------------------
// PurchaseOrderItems
// ---------------------------------------------------------------------------

export const demoPurchaseOrderItemsSeed: PurchaseOrderItem[] = [
  {
    // poi-1 — Cimento 32.5R no po-1 (draft, nada recebido)
    id: "poi-1",
    purchaseOrderId: "po-1",
    materialId: "mat-cimento-325",
    supplierMaterialId: "supp-mat-1",
    descriptionSnapshot: "Cimento 32.5R",
    brandSnapshot: "Cimentos de Moçambique",
    purchaseUnitId: "unit-saco",
    purchaseUnitSymbolSnapshot: "saco",
    baseUnitId: "unit-saco",
    baseUnitSymbolSnapshot: "saco",
    conversionFactor: 1,
    orderedPurchaseQuantity: 40,
    orderedBaseQuantity: 40, // 40 × 1
    unitPrice: 420,
    baseUnitPrice: 420, // 420 / 1
    discountAmount: undefined,
    taxAmount: undefined,
    lineTotal: 16800, // 40 × 420
    receivedPurchaseQuantity: 0,
    receivedBaseQuantity: 0,
    remainingPurchaseQuantity: 40,
    notes: undefined,
    createdAt: "2026-07-10T08:00:00.000Z",
    updatedAt: "2026-07-10T08:00:00.000Z",
  },
  {
    // poi-2 — Varão 12mm no po-2 (15 barras aceites de 30 pedidas)
    id: "poi-2",
    purchaseOrderId: "po-2",
    materialId: "mat-varao-12mm",
    supplierMaterialId: "supp-mat-3",
    descriptionSnapshot: "Varão de Aço 12mm",
    brandSnapshot: "Cofal",
    purchaseUnitId: "unit-varao",
    purchaseUnitSymbolSnapshot: "varao",
    baseUnitId: "unit-varao",
    baseUnitSymbolSnapshot: "varao",
    conversionFactor: 1,
    orderedPurchaseQuantity: 30,
    orderedBaseQuantity: 30,
    unitPrice: 620,
    baseUnitPrice: 620,
    discountAmount: undefined,
    taxAmount: undefined,
    lineTotal: 18600, // 30 × 620
    // 15 barras aceites (di-1.acceptedPurchaseQuantity = 15)
    receivedPurchaseQuantity: 15,
    receivedBaseQuantity: 15,
    remainingPurchaseQuantity: 15, // 30 - 15
    notes: undefined,
    createdAt: "2026-07-12T09:00:00.000Z",
    updatedAt: "2026-07-18T14:30:00.000Z",
  },
  {
    // poi-3 — Tijolo de Cimento 15 no po-2 (200 un aceites de 500 pedidas)
    id: "poi-3",
    purchaseOrderId: "po-2",
    materialId: "mat-tijolo-15",
    supplierMaterialId: "supp-mat-4",
    descriptionSnapshot: "Tijolo de Cimento 15",
    brandSnapshot: "Sogecoa Bloco",
    purchaseUnitId: "unit-un",
    purchaseUnitSymbolSnapshot: "un",
    baseUnitId: "unit-un",
    baseUnitSymbolSnapshot: "un",
    conversionFactor: 1,
    orderedPurchaseQuantity: 500,
    orderedBaseQuantity: 500,
    unitPrice: 42,
    baseUnitPrice: 42,
    discountAmount: undefined,
    taxAmount: undefined,
    lineTotal: 21000, // 500 × 42
    // 200 un aceites (di-2.acceptedPurchaseQuantity = 200)
    receivedPurchaseQuantity: 200,
    receivedBaseQuantity: 200,
    remainingPurchaseQuantity: 300, // 500 - 200
    notes: undefined,
    createdAt: "2026-07-12T09:00:00.000Z",
    updatedAt: "2026-07-18T14:30:00.000Z",
  },
];

// ---------------------------------------------------------------------------
// Deliveries
// ---------------------------------------------------------------------------

export const demoDeliveriesSeed: Delivery[] = [
  {
    // del-1 — Confirmada (parcial de po-2)
    id: "del-1",
    deliveryNumber: "ENT-2026-0001",
    purchaseOrderId: "po-2",
    supplierId: "supp-2",
    deliveryDate: "2026-07-18",
    supplierDocumentNumber: "GR-SOG-44821",
    invoiceNumber: "FT-SOG-2026-1042",
    deliveryNoteNumber: "GE-SOG-2026-0991",
    status: "confirmed",
    receivedBy: "Carlos Matos",
    receivedLocation: "Portão principal da obra",
    vehiclePlate: "MBP-1234-M",
    driverName: "João Siluane",
    destinationType: "project",
    destinationProjectId: "o1",
    notes: "Primeira entrega parcial. Restam 15 varões e 300 tijolos.",
    attachmentIds: undefined,
    createdAt: "2026-07-18T08:00:00.000Z",
    updatedAt: "2026-07-18T14:30:00.000Z",
    confirmedAt: "2026-07-18T14:30:00.000Z",
    cancelledAt: undefined,
  },
  {
    // del-2 — Rascunho (quantidades restantes de po-2)
    id: "del-2",
    deliveryNumber: "ENT-2026-0002",
    purchaseOrderId: "po-2",
    supplierId: "supp-2",
    deliveryDate: "2026-07-25",
    supplierDocumentNumber: undefined,
    invoiceNumber: undefined,
    deliveryNoteNumber: undefined,
    status: "draft",
    receivedBy: undefined,
    receivedLocation: undefined,
    vehiclePlate: undefined,
    driverName: undefined,
    destinationType: "project",
    destinationProjectId: "o1",
    notes: undefined,
    attachmentIds: undefined,
    createdAt: "2026-07-24T10:00:00.000Z",
    updatedAt: "2026-07-24T10:00:00.000Z",
    confirmedAt: undefined,
    cancelledAt: undefined,
  },
];

// ---------------------------------------------------------------------------
// DeliveryItems
// ---------------------------------------------------------------------------

export const demoDeliveryItemsSeed: DeliveryItem[] = [
  {
    // di-1 — Varão 12mm, entrega del-1 (15 barras, todas aceites)
    id: "di-1",
    deliveryId: "del-1",
    purchaseOrderItemId: "poi-2",
    materialId: "mat-varao-12mm",
    purchaseUnitId: "unit-varao",
    conversionFactor: 1,
    // Físico recebido
    receivedPurchaseQuantity: 15,
    receivedBaseQuantity: 15, // 15 × 1
    // Qualidade
    acceptedQuantity: 15, // em unidade base
    acceptedPurchaseQuantity: 15, // 15 / 1 → reduz remaining do PO
    rejectedQuantity: 0,
    damagedQuantity: undefined,
    // Custo
    actualUnitCost: 620, // por unidade de compra (varao)
    actualBaseUnitCost: 620, // 620 / 1
    batchNumber: undefined,
    expiryDate: undefined,
    notes: undefined,
    createdAt: "2026-07-18T08:00:00.000Z",
  },
  {
    // di-2 — Tijolo 15, entrega del-1 (200 un, todas aceites)
    id: "di-2",
    deliveryId: "del-1",
    purchaseOrderItemId: "poi-3",
    materialId: "mat-tijolo-15",
    purchaseUnitId: "unit-un",
    conversionFactor: 1,
    // Físico recebido
    receivedPurchaseQuantity: 200,
    receivedBaseQuantity: 200,
    // Qualidade
    acceptedQuantity: 200,
    acceptedPurchaseQuantity: 200, // 200 / 1
    rejectedQuantity: 0,
    damagedQuantity: undefined,
    // Custo
    actualUnitCost: 42,
    actualBaseUnitCost: 42,
    batchNumber: undefined,
    expiryDate: undefined,
    notes: undefined,
    createdAt: "2026-07-18T08:00:00.000Z",
  },
  {
    // di-3 — Varão 12mm, entrega del-2 (draft — 15 restantes)
    id: "di-3",
    deliveryId: "del-2",
    purchaseOrderItemId: "poi-2",
    materialId: "mat-varao-12mm",
    purchaseUnitId: "unit-varao",
    conversionFactor: 1,
    receivedPurchaseQuantity: 15,
    receivedBaseQuantity: 15,
    acceptedQuantity: 15,
    acceptedPurchaseQuantity: 15,
    rejectedQuantity: 0,
    damagedQuantity: undefined,
    actualUnitCost: 620,
    actualBaseUnitCost: 620,
    batchNumber: undefined,
    expiryDate: undefined,
    notes: undefined,
    createdAt: "2026-07-24T10:00:00.000Z",
  },
  {
    // di-4 — Tijolo 15, entrega del-2 (draft — 300 restantes)
    id: "di-4",
    deliveryId: "del-2",
    purchaseOrderItemId: "poi-3",
    materialId: "mat-tijolo-15",
    purchaseUnitId: "unit-un",
    conversionFactor: 1,
    receivedPurchaseQuantity: 300,
    receivedBaseQuantity: 300,
    acceptedQuantity: 300,
    acceptedPurchaseQuantity: 300,
    rejectedQuantity: 0,
    damagedQuantity: undefined,
    actualUnitCost: 42,
    actualBaseUnitCost: 42,
    batchNumber: undefined,
    expiryDate: undefined,
    notes: undefined,
    createdAt: "2026-07-24T10:00:00.000Z",
  },
];

// ---------------------------------------------------------------------------
// StockMovements
// ---------------------------------------------------------------------------

export const demoStockMovementsSeed: StockMovement[] = [
  {
    // sm-1 — Receção de varão 12mm via del-1
    // Quantidade = di-1.acceptedQuantity = 15
    id: "sm-1",
    materialId: "mat-varao-12mm",
    movementType: "purchase_receipt",
    quantity: 15, // = di-1.acceptedQuantity (apenas aceite, não físico total)
    unitId: "unit-varao",
    unitCost: 620, // = di-1.actualBaseUnitCost
    totalCost: 9300, // 15 × 620
    destinationLocationType: "project",
    destinationProjectId: "o1",
    purchaseOrderId: "po-2",
    deliveryId: "del-1",
    deliveryItemId: "di-1", // chave de idempotência
    referenceType: "delivery_item",
    referenceId: "di-1",
    movementDate: "2026-07-18",
    performedBy: "Carlos Matos", // = del-1.receivedBy
    reason: "Receção de compra PC-2026-0002 / ENT-2026-0001",
    notes: undefined,
    createdAt: "2026-07-18T14:30:00.000Z",
  },
  {
    // sm-2 — Receção de tijolo 15 via del-1
    // Quantidade = di-2.acceptedQuantity = 200
    id: "sm-2",
    materialId: "mat-tijolo-15",
    movementType: "purchase_receipt",
    quantity: 200,
    unitId: "unit-un",
    unitCost: 42,
    totalCost: 8400, // 200 × 42
    destinationLocationType: "project",
    destinationProjectId: "o1",
    purchaseOrderId: "po-2",
    deliveryId: "del-1",
    deliveryItemId: "di-2",
    referenceType: "delivery_item",
    referenceId: "di-2",
    movementDate: "2026-07-18",
    performedBy: "Carlos Matos",
    reason: "Receção de compra PC-2026-0002 / ENT-2026-0001",
    notes: undefined,
    createdAt: "2026-07-18T14:30:00.000Z",
  },
];

// ---------------------------------------------------------------------------
// InventoryBalances
// ---------------------------------------------------------------------------

export const demoInventoryBalancesSeed: InventoryBalance[] = [
  {
    // inv-bal-1 — Varão 12mm na obra o1
    // Consistente com sm-1: qty=15, cost=620
    id: "inv-bal-1",
    materialId: "mat-varao-12mm",
    locationType: "project",
    projectId: "o1",
    quantityOnHand: 15, // = sm-1.quantity
    averageCost: 620, // = sm-1.unitCost
    totalValue: 9300, // 15 × 620
    lastMovementAt: "2026-07-18T14:30:00.000Z",
    createdAt: "2026-07-18T14:30:00.000Z",
    updatedAt: "2026-07-18T14:30:00.000Z",
  },
  {
    // inv-bal-2 — Tijolo 15 na obra o1
    // Consistente com sm-2: qty=200, cost=42
    id: "inv-bal-2",
    materialId: "mat-tijolo-15",
    locationType: "project",
    projectId: "o1",
    quantityOnHand: 200,
    averageCost: 42,
    totalValue: 8400, // 200 × 42
    lastMovementAt: "2026-07-18T14:30:00.000Z",
    createdAt: "2026-07-18T14:30:00.000Z",
    updatedAt: "2026-07-18T14:30:00.000Z",
  },
];

// ---------------------------------------------------------------------------
// Validação de consistência dos seeds (usada nos testes)
// ---------------------------------------------------------------------------

/**
 * Verifica a consistência interna dos seeds de demonstração.
 * Retorna um array de warnings — array vazio significa seeds consistentes.
 * Não lança exceções; apenas recolhe problemas para auditoria.
 */
export function validateSeedsConsistency(): string[] {
  const warnings: string[] = [];

  // 1. poi-2.receivedPurchaseQuantity deve = soma de acceptedPurchaseQuantity
  //    dos DeliveryItems de del-1 para poi-2
  const poi2 = demoPurchaseOrderItemsSeed.find((p) => p.id === "poi-2");
  const di1 = demoDeliveryItemsSeed.find((d) => d.id === "di-1");
  if (poi2 && di1) {
    if (poi2.receivedPurchaseQuantity !== di1.acceptedPurchaseQuantity) {
      warnings.push(
        `poi-2.receivedPurchaseQuantity (${poi2.receivedPurchaseQuantity}) ≠ di-1.acceptedPurchaseQuantity (${di1.acceptedPurchaseQuantity})`,
      );
    }
    if (poi2.remainingPurchaseQuantity !== poi2.orderedPurchaseQuantity - poi2.receivedPurchaseQuantity) {
      warnings.push(
        `poi-2.remainingPurchaseQuantity incorreto: esperado ${poi2.orderedPurchaseQuantity - poi2.receivedPurchaseQuantity}, got ${poi2.remainingPurchaseQuantity}`,
      );
    }
  } else {
    warnings.push("poi-2 ou di-1 não encontrado nos seeds.");
  }

  // 2. poi-3.receivedPurchaseQuantity deve = di-2.acceptedPurchaseQuantity
  const poi3 = demoPurchaseOrderItemsSeed.find((p) => p.id === "poi-3");
  const di2 = demoDeliveryItemsSeed.find((d) => d.id === "di-2");
  if (poi3 && di2) {
    if (poi3.receivedPurchaseQuantity !== di2.acceptedPurchaseQuantity) {
      warnings.push(
        `poi-3.receivedPurchaseQuantity (${poi3.receivedPurchaseQuantity}) ≠ di-2.acceptedPurchaseQuantity (${di2.acceptedPurchaseQuantity})`,
      );
    }
  }

  // 3. InventoryBalance totalValue = quantityOnHand × averageCost
  for (const bal of demoInventoryBalancesSeed) {
    const expected = bal.quantityOnHand * bal.averageCost;
    if (Math.abs(bal.totalValue - expected) > 0.01) {
      warnings.push(
        `inv-bal ${bal.id}: totalValue (${bal.totalValue}) ≠ quantityOnHand × averageCost (${expected})`,
      );
    }
  }

  // 4. StockMovement.deliveryItemId deve ser único
  const deliveryItemIds = demoStockMovementsSeed
    .map((m) => m.deliveryItemId)
    .filter(Boolean) as string[];
  const uniqueIds = new Set(deliveryItemIds);
  if (uniqueIds.size !== deliveryItemIds.length) {
    warnings.push("StockMovements contêm deliveryItemIds duplicados.");
  }

  // 5. del-1 confirmed → deve ter movimentos para di-1 e di-2
  const del1Movements = demoStockMovementsSeed.filter((m) => m.deliveryId === "del-1");
  if (del1Movements.length !== 2) {
    warnings.push(`del-1 confirmed deve ter 2 movimentos, encontrado ${del1Movements.length}.`);
  }

  // 6. del-2 draft → não deve ter movimentos
  const del2Movements = demoStockMovementsSeed.filter((m) => m.deliveryId === "del-2");
  if (del2Movements.length > 0) {
    warnings.push(`del-2 (draft) não deve ter movimentos, encontrado ${del2Movements.length}.`);
  }

  // 7. Movimentos de del-1 consistentes com InventoryBalance
  const sm1 = demoStockMovementsSeed.find((m) => m.id === "sm-1");
  const invBal1 = demoInventoryBalancesSeed.find((b) => b.id === "inv-bal-1");
  if (sm1 && invBal1) {
    if (invBal1.quantityOnHand !== sm1.quantity) {
      warnings.push(
        `inv-bal-1.quantityOnHand (${invBal1.quantityOnHand}) ≠ sm-1.quantity (${sm1.quantity})`,
      );
    }
    if (invBal1.averageCost !== sm1.unitCost) {
      warnings.push(
        `inv-bal-1.averageCost (${invBal1.averageCost}) ≠ sm-1.unitCost (${sm1.unitCost})`,
      );
    }
  }

  return warnings;
}
