// Tipos de domínio da Etapa 6.3 — Compras, Entregas, Movimentos e Saldos de Inventário
// Importar PaymentTermType do módulo de fornecedores existente
import type { PaymentTermType } from "@/lib/suppliers/supplier-types";
export type { PaymentTermType };

// ---------------------------------------------------------------------------
// Enumerações de estado
// ---------------------------------------------------------------------------

export type PurchaseOrderStatus =
  | "draft"
  | "pending_approval" // enum preparado — sem fluxo no MVP
  | "approved"
  | "sent"
  | "partially_received"
  | "received"
  | "cancelled";

export type DeliveryStatus =
  | "expected" // Prevista
  | "in_transit" // Em Trânsito
  | "arrived" // Chegada ao local
  | "in_inspection" // Em Conferência
  | "partially_received" // Parcialmente Recebida
  | "received" // Recebida (conferência concluída)
  | "received_with_divergence" // Recebida com Divergência
  | "confirmed" // Confirmada (movimentos registados e selada)
  | "rejected" // Rejeitada na conferência
  | "cancelled" // Cancelada
  | "draft"; // legado para retrocompatibilidade

export interface DeliveryDocument {
  id: string;
  deliveryId: string;
  batchId?: string;
  fileName: string;
  fileType: string;
  fileSize: number; // em bytes
  fileUrl: string;
  category:
    | "remittance_note"
    | "invoice"
    | "cargo_photo"
    | "material_photo"
    | "proof_of_delivery"
    | "signature"
    | "other";
  uploadedAt: string;
  uploadedByUserId?: string;
  uploadedByUserName?: string;
}

export interface ReceiptBatchItem {
  id: string;
  batchId: string;
  materialId: string;
  purchaseOrderItemId?: string;
  deliveredQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity?: number;
  rejectionReason?: string;
  unitPrice?: number;
  batchNumber?: string;
  notes?: string;
}

export interface ReceiptBatch {
  id: string;
  deliveryId: string;
  batchNumber: string; // ex: "LOTE-001"
  receivedAt: string; // ISO
  receivedByUserId: string;
  receivedByUserName: string;
  items: ReceiptBatchItem[];
  documents?: DeliveryDocument[];
  movementIds: string[];
  correlationId: string;
  idempotencyKey: string;
  notes?: string;
}

export interface Delivery {
  id: string;
  deliveryNumber: string; // "ENT-2026-0001" ou "DEL-9941"
  purchaseOrderId: string;
  supplierId: string;

  deliveryDate: string; // ISO (data prevista)
  arrivedAt?: string;
  confirmedAt?: string;
  cancelledAt?: string;

  supplierDocumentNumber?: string;
  invoiceNumber?: string;
  deliveryNoteNumber?: string;

  status: DeliveryStatus;

  receivedBy?: string;
  receivedByUserId?: string;
  receivedByUserName?: string;
  receivedLocation?: string;
  vehiclePlate?: string;
  driverName?: string;

  destinationType: DestinationType;
  destinationWarehouseId?: string;
  destinationProjectId?: string;

  notes?: string;
  destinationChangeJustification?: string;
  destinationChangedBy?: string;

  batches?: ReceiptBatch[];
  documents?: DeliveryDocument[];
  movementIds?: string[];
  correlationId?: string;
  inventoryProcessedAt?: string;

  createdAt: string;
  updatedAt: string;
}

export type PurchaseDelivery = Delivery;

/**
 * Validador da Máquina de Estados Operacionais da Entrega
 */
export function canTransitionDeliveryStatus(current: DeliveryStatus, target: DeliveryStatus): boolean {
  if (current === target) return true;
  if (current === "confirmed" || current === "cancelled") {
    // Estados finais irreversíveis
    return false;
  }

  const allowedTransitions: Record<string, DeliveryStatus[]> = {
    expected: ["in_transit", "arrived", "cancelled", "draft"],
    draft: ["expected", "in_transit", "arrived", "in_inspection", "confirmed", "cancelled"],
    in_transit: ["arrived", "cancelled"],
    arrived: ["in_inspection", "rejected", "cancelled"],
    in_inspection: ["partially_received", "received", "received_with_divergence", "rejected", "cancelled"],
    partially_received: ["in_inspection", "received", "received_with_divergence", "confirmed", "cancelled"],
    received: ["confirmed", "cancelled"],
    received_with_divergence: ["confirmed", "cancelled"],
    rejected: ["cancelled"],
  };

  return (allowedTransitions[current] || []).includes(target);
}

export type StockMovementType =
  | "purchase_receipt" // ← Etapa 6.3
  | "consumption" // ← Etapa 6.5 (tipo preparado, sem lógica)
  | "return_to_supplier" // ← Etapa 6.4
  | "project_transfer" // ← Etapa 6.4
  | "adjustment_in" // ← Etapa 6.4
  | "adjustment_out" // ← Etapa 6.4
  | "opening_balance"; // ← Etapa 6.4

/** Destino logístico da compra ou entrega */
export type DestinationType =
  | "project" // compra destinada a uma obra específica
  | "central_stock" // fornecedor entrega no stock central
  | "supplier_direct"; // fornecedor entrega diretamente na obra — saldo entra em "project"

/** Tipo de localização do InventoryBalance — só dois valores */
export type InventoryLocationType = "central_stock" | "project";

// ---------------------------------------------------------------------------
// PurchaseOrder
// ---------------------------------------------------------------------------

export interface PurchaseOrder {
  id: string;
  orderNumber: string; // "PC-2026-0001" — gerado na store
  supplierId: string;
  supplierReference?: string; // n.º cotação do fornecedor (ex: "QT-00598")
  destinationType: DestinationType;
  destinationProjectId?: string; // obrigatório quando destinationType !== "central_stock"

  orderDate: string; // ISO
  expectedDeliveryDate?: string;

  status: PurchaseOrderStatus;
  currency: string; // default "MZN"

  // Totais — recalculados ao gravar
  subtotal: number;
  discountAmount?: number;
  taxAmount?: number;
  totalAmount: number;

  paymentTermType?: PaymentTermType;
  paymentTermDays?: number;
  commercialConditions?: string;
  notes?: string;
  internalNotes?: string;

  attachmentIds?: string[]; // preparado para futuros uploads

  createdAt: string;
  updatedAt: string;

  // Datas de transição — preenchidas apenas quando ocorrem
  approvedAt?: string;
  sentAt?: string;
  cancelledAt?: string;
}

// ---------------------------------------------------------------------------
// PurchaseOrderItem
// ---------------------------------------------------------------------------

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  materialId: string;
  supplierMaterialId?: string; // referência fraca; snapshots protegem os dados

  // Snapshots — congelados na criação; nunca atualizados após guardar
  descriptionSnapshot: string; // material.name no momento da criação
  brandSnapshot?: string;
  purchaseUnitId: string;
  purchaseUnitSymbolSnapshot: string; // símbolo da unidade de compra
  baseUnitId: string;
  baseUnitSymbolSnapshot: string; // símbolo da unidade base do material
  conversionFactor: number; // > 0

  // Quantidades pedidas
  orderedPurchaseQuantity: number; // em unidades de compra
  orderedBaseQuantity: number; // = orderedPurchaseQuantity × conversionFactor

  // Preços congelados
  unitPrice: number; // preço por unidade de compra
  baseUnitPrice: number; // = unitPrice / conversionFactor
  discountAmount?: number;
  taxAmount?: number;
  lineTotal: number; // orderedPurchaseQuantity × unitPrice − discount + tax

  // Controlo de receção — atualizado atomicamente na confirmação de cada entrega
  // Apenas quantidades ACEITES reduzem o restante (rejeitadas não satisfazem o pedido)
  receivedPurchaseQuantity: number; // acumulado de acceptedPurchaseQuantity das entregas confirmadas
  receivedBaseQuantity: number; // acumulado de acceptedQuantity
  remainingPurchaseQuantity: number; // = orderedPurchaseQuantity − receivedPurchaseQuantity

  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Delivery
// ---------------------------------------------------------------------------

export interface Delivery {
  id: string;
  deliveryNumber: string; // "ENT-2026-0001"
  purchaseOrderId: string;
  supplierId: string; // snapshot do fornecedor no momento

  deliveryDate: string; // ISO

  // Documentação do fornecedor
  supplierDocumentNumber?: string;
  invoiceNumber?: string;
  deliveryNoteNumber?: string;

  status: DeliveryStatus;

  // Receção
  receivedBy?: string;
  receivedLocation?: string; // ex: "Portão principal", "Armazém B"
  vehiclePlate?: string; // matrícula do veículo de entrega
  driverName?: string; // nome do motorista/transportador

  // Destino — deve coincidir com o PurchaseOrder
  destinationType: DestinationType;
  destinationProjectId?: string; // obrigatório quando destinationType !== "central_stock"

  notes?: string;
  attachmentIds?: string[];

  createdAt: string;
  updatedAt: string;

  confirmedAt?: string;
  cancelledAt?: string;
}

// ---------------------------------------------------------------------------
// DeliveryItem
// ---------------------------------------------------------------------------

export interface DeliveryItem {
  id: string;
  deliveryId: string;
  purchaseOrderItemId: string;
  materialId: string;

  // Unidade e conversão (congelados da cotação)
  purchaseUnitId: string;
  conversionFactor: number; // > 0; necessário para calcular conversões

  // Quantidades físicas DESCARREGADAS (inclui aceites + rejeitadas)
  receivedPurchaseQuantity: number; // total descarregado em unidades de compra
  receivedBaseQuantity: number; // = receivedPurchaseQuantity × conversionFactor

  // Separação qualitativa — em unidades BASE
  acceptedQuantity: number; // aceite em unidade base → entra no stock e no InventoryBalance
  acceptedPurchaseQuantity: number; // = acceptedQuantity / conversionFactor → reduz remainingPurchaseQuantity do PO
  rejectedQuantity?: number; // em unidade base → não entra no stock nem reduz o PO
  damagedQuantity?: number; // em unidade base → só entra se incluída em acceptedQuantity

  // Custo real
  actualUnitCost: number; // custo por unidade de compra (pode diferir do PO)
  actualBaseUnitCost: number; // = actualUnitCost / conversionFactor

  batchNumber?: string;
  expiryDate?: string;
  notes?: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// StockMovement
// ---------------------------------------------------------------------------

export interface StockMovement {
  id: string;
  materialId: string;
  movementType: StockMovementType;

  // Quantidade — sempre em unidades BASE, sempre positivo
  quantity: number;
  unitId: string; // ID da unidade base do material

  // Custo real
  unitCost: number; // custo por unidade base (>= 0)
  totalCost: number; // = quantity × unitCost

  // Destino — obrigatório
  destinationLocationType: InventoryLocationType;
  destinationProjectId?: string; // obrigatório quando destinationLocationType === "project"

  // Rastreabilidade
  purchaseOrderId?: string;
  deliveryId?: string;
  deliveryItemId?: string; // chave de idempotência para purchase_receipt

  referenceType: string; // "delivery_item" | "manual_adjustment" | "opening_balance" | …
  referenceId: string; // ID da entidade referenciada

  movementDate: string; // data operacional (pode ser anterior à data de criação)

  // Contexto humano
  performedBy?: string; // nome livre; futuramente complementado com performedByUserId
  reason?: string; // motivo operacional curto e estruturado (gerado automaticamente)
  notes?: string; // observações adicionais livres (preenchido pelo utilizador)

  createdAt: string;
}

// ---------------------------------------------------------------------------
// InventoryBalance
// ---------------------------------------------------------------------------

export interface InventoryBalance {
  id: string;
  materialId: string;

  // Localização — chave lógica: materialId + locationType + projectId
  locationType: InventoryLocationType; // "central_stock" | "project"
  projectId?: string; // obrigatório quando locationType === "project"; undefined para central_stock

  // Saldo atual — calculado cumulativamente, nunca NaN
  quantityOnHand: number; // em unidades BASE; nunca NaN; pode ser 0
  averageCost: number; // custo médio ponderado por unidade base; >= 0
  totalValue: number; // = quantityOnHand × averageCost

  lastMovementAt?: string; // ISO do último StockMovement que afetou este saldo

  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Tipos auxiliares para os dados de duplicação (não persistidos)
// ---------------------------------------------------------------------------

/**
 * Dados pré-preenchidos para duplicação de pedido.
 * Retornado por preparePurchaseOrderDuplicate() — nunca persistido.
 * O UI usa estes dados para pré-preencher o formulário de novo pedido.
 */
export interface PurchaseOrderDuplicateData {
  supplierId: string;
  supplierReference?: string;
  destinationType: DestinationType;
  destinationProjectId?: string;
  currency: string;
  paymentTermType?: PaymentTermType;
  paymentTermDays?: number;
  commercialConditions?: string;
  notes?: string;
  internalNotes?: string;
  orderDate: string; // data atual
  status: "draft";
  items: Array<{
    materialId: string;
    supplierMaterialId?: string;
    descriptionSnapshot: string;
    brandSnapshot?: string;
    purchaseUnitId: string;
    purchaseUnitSymbolSnapshot: string;
    baseUnitId: string;
    baseUnitSymbolSnapshot: string;
    conversionFactor: number;
    orderedPurchaseQuantity: number;
    unitPrice: number;
    notes?: string;
  }>;
}

// ---------------------------------------------------------------------------
// Labels e utilitários de apresentação
// ---------------------------------------------------------------------------

export const purchaseOrderStatusLabel: Record<PurchaseOrderStatus, string> = {
  draft: "Rascunho",
  pending_approval: "Aguarda Aprovação",
  approved: "Aprovado",
  sent: "Enviado",
  partially_received: "Parcialmente Recebido",
  received: "Recebido",
  cancelled: "Cancelado",
};

export const deliveryStatusLabel: Record<DeliveryStatus, string> = {
  draft: "Rascunho",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
};

export const destinationTypeLabel: Record<DestinationType, string> = {
  project: "Obra",
  central_stock: "Stock Central",
  supplier_direct: "Entrega Direta na Obra",
};

export const stockMovementTypeLabel: Record<StockMovementType, string> = {
  purchase_receipt: "Receção de Compra",
  consumption: "Consumo",
  return_to_supplier: "Devolução ao Fornecedor",
  project_transfer: "Transferência",
  adjustment_in: "Ajuste de Entrada",
  adjustment_out: "Ajuste de Saída",
  opening_balance: "Saldo de Abertura",
};
