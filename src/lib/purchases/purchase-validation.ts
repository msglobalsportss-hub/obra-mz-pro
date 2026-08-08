// Validações de domínio para Compras, Entregas e Itens (Etapa 6.3)
import type {
  PurchaseOrder,
  PurchaseOrderItem,
  Delivery,
  DeliveryItem,
  InventoryBalance,
  InventoryLocationType,
} from "./purchase-types";

// ---------------------------------------------------------------------------
// validatePurchaseOrderInput
// ---------------------------------------------------------------------------

/**
 * Valida o payload de criação/edição de PurchaseOrder.
 * Retorna string com mensagem de erro, ou null se válido.
 */
export function validatePurchaseOrderInput(
  input: Partial<PurchaseOrder>,
  suppliers: Array<{ id: string; status: string }>,
): string | null {
  if (!input.supplierId?.trim()) {
    return "O fornecedor é obrigatório.";
  }

  const supplier = suppliers.find((s) => s.id === input.supplierId);
  if (supplier && supplier.status === "inactive") {
    return "Não é possível criar um pedido de compra para um fornecedor inativo.";
  }

  if (!input.destinationType) {
    return "O destino da compra é obrigatório.";
  }

  if (input.destinationType !== "central_stock" && !input.destinationProjectId?.trim()) {
    return "A obra de destino é obrigatória para o tipo de destino selecionado.";
  }

  if (!input.orderDate?.trim()) {
    return "A data do pedido é obrigatória.";
  }

  if (!input.currency?.trim()) {
    return "A moeda é obrigatória.";
  }

  if (input.supplierReference !== undefined && input.supplierReference !== null) {
    // Campo opcional — apenas normalizar; sem comprimento mínimo
    if (typeof input.supplierReference !== "string") {
      return "A referência do fornecedor deve ser texto.";
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// validatePurchaseOrderItem
// ---------------------------------------------------------------------------

/**
 * Valida um item de pedido de compra.
 * Retorna string com mensagem de erro, ou null se válido.
 *
 * @param purchaseOrderStatus Estado atual do pedido — itens só podem ser
 *   adicionados/editados em pedidos "draft".
 */
export function validatePurchaseOrderItemInput(
  input: Partial<PurchaseOrderItem>,
  purchaseOrderStatus?: string,
): string | null {
  if (purchaseOrderStatus && purchaseOrderStatus !== "draft") {
    return "Itens só podem ser adicionados ou editados em pedidos em rascunho.";
  }

  if (!input.materialId?.trim()) {
    return "O material é obrigatório.";
  }

  if (
    input.orderedPurchaseQuantity === undefined ||
    input.orderedPurchaseQuantity === null ||
    !Number.isFinite(input.orderedPurchaseQuantity) ||
    input.orderedPurchaseQuantity <= 0
  ) {
    return "A quantidade pedida deve ser maior que zero.";
  }

  if (
    input.unitPrice === undefined ||
    input.unitPrice === null ||
    !Number.isFinite(input.unitPrice) ||
    input.unitPrice <= 0
  ) {
    return "O preço unitário deve ser maior que zero.";
  }

  if (
    input.conversionFactor === undefined ||
    input.conversionFactor === null ||
    !Number.isFinite(input.conversionFactor) ||
    input.conversionFactor <= 0
  ) {
    return "O fator de conversão deve ser maior que zero.";
  }

  return null;
}

// ---------------------------------------------------------------------------
// validateDeliveryInput
// ---------------------------------------------------------------------------

/**
 * Valida o payload de criação/edição de Delivery.
 * Retorna string com mensagem de erro, ou null se válido.
 */
export function validateDeliveryInput(
  input: Partial<Delivery>,
  purchaseOrders: Array<{
    id: string;
    status: string;
    destinationType: string;
    destinationProjectId?: string;
  }>,
  deliveries: Delivery[],
): string | null {
  if (!input.purchaseOrderId?.trim()) {
    return "O pedido de compra é obrigatório.";
  }

  const po = purchaseOrders.find((p) => p.id === input.purchaseOrderId);
  if (!po) {
    return "Pedido de compra não encontrado.";
  }

  const validStatuses = ["approved", "sent", "partially_received"];
  if (!validStatuses.includes(po.status)) {
    return `Não é possível registar entregas para pedidos no estado "${po.status}".`;
  }

  if (!input.deliveryDate?.trim()) {
    return "A data da entrega é obrigatória.";
  }

  if (!input.destinationType) {
    return "O tipo de destino é obrigatório.";
  }

  if (input.destinationType !== "central_stock" && !input.destinationProjectId?.trim()) {
    return "A obra de destino é obrigatória para o tipo de destino selecionado.";
  }

  // Comprimento máximo para campos logísticos opcionais
  if (input.receivedLocation && input.receivedLocation.trim().length > 200) {
    return "O local de receção não pode ter mais de 200 caracteres.";
  }
  if (input.vehiclePlate && input.vehiclePlate.trim().length > 20) {
    return "A matrícula não pode ter mais de 20 caracteres.";
  }
  if (input.driverName && input.driverName.trim().length > 100) {
    return "O nome do motorista não pode ter mais de 100 caracteres.";
  }

  return null;
}

// ---------------------------------------------------------------------------
// validateDeliveryItemInput
// ---------------------------------------------------------------------------

/**
 * Valida um item de entrega.
 * Retorna string com mensagem de erro, ou null se válido.
 *
 * @param purchaseOrderItem - Item do pedido correspondente, para validar excesso
 * @param deliveryStatus - Estado da entrega; edição bloqueada após "confirmed"
 */
export function validateDeliveryItemInput(
  input: Partial<DeliveryItem>,
  purchaseOrderItem?: Pick<
    PurchaseOrderItem,
    "remainingPurchaseQuantity" | "orderedPurchaseQuantity"
  >,
  deliveryStatus?: string,
): string | null {
  if (deliveryStatus && deliveryStatus !== "draft") {
    return "Itens de entrega só podem ser editados enquanto a entrega está em rascunho.";
  }

  if (
    input.receivedPurchaseQuantity === undefined ||
    !Number.isFinite(input.receivedPurchaseQuantity) ||
    input.receivedPurchaseQuantity <= 0
  ) {
    return "A quantidade fisicamente recebida deve ser maior que zero.";
  }

  if (
    !Number.isFinite(input.conversionFactor) ||
    (input.conversionFactor ?? 0) <= 0
  ) {
    return "O fator de conversão deve ser maior que zero.";
  }

  const receivedBase = (input.receivedPurchaseQuantity ?? 0) * (input.conversionFactor ?? 1);

  if (
    input.acceptedQuantity === undefined ||
    !Number.isFinite(input.acceptedQuantity) ||
    input.acceptedQuantity < 0
  ) {
    return "A quantidade aceite deve ser zero ou maior.";
  }

  if (input.acceptedQuantity > receivedBase + 0.001) {
    return "A quantidade aceite não pode ser superior à quantidade fisicamente recebida.";
  }

  // Validar coerência de acceptedPurchaseQuantity
  if (input.acceptedPurchaseQuantity !== undefined) {
    if (!Number.isFinite(input.acceptedPurchaseQuantity) || input.acceptedPurchaseQuantity < 0) {
      return "A quantidade aceite em unidades de compra deve ser zero ou maior.";
    }
  }

  if (
    input.actualUnitCost === undefined ||
    !Number.isFinite(input.actualUnitCost) ||
    input.actualUnitCost < 0
  ) {
    return "O custo unitário real deve ser zero ou maior.";
  }

  if (input.rejectedQuantity !== undefined) {
    if (!Number.isFinite(input.rejectedQuantity) || input.rejectedQuantity < 0) {
      return "A quantidade rejeitada deve ser zero ou maior.";
    }
  }

  if (input.damagedQuantity !== undefined) {
    if (!Number.isFinite(input.damagedQuantity) || input.damagedQuantity < 0) {
      return "A quantidade danificada deve ser zero ou maior.";
    }
  }

  // Validar excesso (sem allowOverDelivery nesta fase)
  if (purchaseOrderItem && input.acceptedPurchaseQuantity !== undefined) {
    if (input.acceptedPurchaseQuantity > purchaseOrderItem.remainingPurchaseQuantity + 0.001) {
      return `A quantidade aceite (${input.acceptedPurchaseQuantity.toFixed(2)}) excede a quantidade restante do pedido (${purchaseOrderItem.remainingPurchaseQuantity.toFixed(2)}).`;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// validateInventoryBalance (interna — usada antes de persistir)
// ---------------------------------------------------------------------------

/**
 * Valida um InventoryBalance antes de persistir.
 * Retorna string com mensagem de erro, ou null se válido.
 */
export function validateInventoryBalance(input: Partial<InventoryBalance>): string | null {
  if (!input.materialId?.trim()) {
    return "materialId é obrigatório no InventoryBalance.";
  }

  const validLocationTypes: InventoryLocationType[] = ["central_stock", "project"];
  if (!input.locationType || !validLocationTypes.includes(input.locationType)) {
    return `locationType inválido: "${input.locationType}".`;
  }

  if (input.locationType === "project" && !input.projectId?.trim()) {
    return "projectId é obrigatório quando locationType === 'project'.";
  }

  if (input.locationType === "central_stock" && input.projectId) {
    return "projectId não deve ser definido quando locationType === 'central_stock'.";
  }

  if (!Number.isFinite(input.quantityOnHand)) {
    return "quantityOnHand deve ser um número finito.";
  }

  if (!Number.isFinite(input.averageCost) || (input.averageCost ?? -1) < 0) {
    return "averageCost deve ser um número finito e não negativo.";
  }

  if (!Number.isFinite(input.totalValue)) {
    return "totalValue deve ser um número finito.";
  }

  return null;
}
