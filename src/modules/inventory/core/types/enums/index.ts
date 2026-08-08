/**
 * Enums e tipos constantes do Módulo de Inventário — Fase 2A.
 *
 * Convenções de nomenclatura alinhadas com o projeto ObraMZ existente:
 * - snake_case para valores (compatível com futura persistência em Supabase)
 * - TypeScript union types (sem enum real — facilita comparação e narrowing)
 */

// ---------------------------------------------------------------------------
// Método de Custeio
// Apenas weighted_average está operacional na Fase 2B.
// Os demais métodos são tipos válidos para preparação futura.
// ---------------------------------------------------------------------------
export type InventoryCostingMethod =
  "weighted_average" | "fifo" | "lifo" | "specific_identification";

// ---------------------------------------------------------------------------
// Estado de Stock (Physical Stock State)
// NOTA: "reserved" como estado de stock é distinto de reservedQuantity.
// reservedQuantity é uma dimensão do saldo; "reserved" pode ser usado
// em cenários de classificação de lotes, NÃO de contabilização dupla.
// ---------------------------------------------------------------------------
export type InventoryStockState =
  | "available" // stock normal disponível para uso
  | "reserved" // classificação logística — NÃO confundir com reservedQuantity
  | "damaged" // material danificado
  | "inspection" // em inspeção/quarentena
  | "expired" // prazo de validade expirado
  | "blocked" // bloqueado por motivo administrativo
  | "disposed"; // eliminado/abatido

// ---------------------------------------------------------------------------
// Tipo de Movimento de Stock
// ---------------------------------------------------------------------------
export type StockMovementType =
  | "opening_balance" // saldo inicial de abertura
  | "purchase_receipt" // entrada por receção de compra
  | "delivery_receipt" // entrada por entrega confirmada
  | "transfer_out" // saída por transferência
  | "transfer_in" // entrada por transferência
  | "reservation" // reserva de material (NÃO reduz stock físico)
  | "reservation_release" // libertação de reserva
  | "consumption" // consumo de material em obra
  | "return_in" // devolução de obra para armazém
  | "return_out" // devolução a fornecedor
  | "adjustment_in" // ajuste de entrada
  | "adjustment_out" // ajuste de saída
  | "physical_count_in" // diferença de inventário físico (positiva)
  | "physical_count_out" // diferença de inventário físico (negativa)
  | "damage" // registo de dano
  | "disposal" // abate/descarte
  | "reversal" // estorno de um movimento
  | "correction"; // correção administrativa

// ---------------------------------------------------------------------------
// Estado do Movimento
// ---------------------------------------------------------------------------
export type StockMovementStatus =
  | "draft" // rascunho, ainda não processado
  | "pending" // aguarda processamento
  | "confirmed" // confirmado e imutável
  | "reversed" // estornado por movimento de reversão
  | "cancelled" // cancelado antes de confirmar
  | "failed"; // falhou processamento

// ---------------------------------------------------------------------------
// Estado de Reserva
// ---------------------------------------------------------------------------
export type InventoryReservationStatus =
  | "draft"
  | "pending"
  | "active"
  | "partially_fulfilled"
  | "fulfilled"
  | "released"
  | "expired"
  | "cancelled";

// ---------------------------------------------------------------------------
// Estado de Transferência
// ---------------------------------------------------------------------------
export type StockTransferStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "in_transit"
  | "partially_received"
  | "received"
  | "cancelled"
  | "rejected";

// ---------------------------------------------------------------------------
// Tipo de Ajuste
// ---------------------------------------------------------------------------
export type StockAdjustmentType = "increase" | "decrease" | "mixed";

// ---------------------------------------------------------------------------
// Estado de Ajuste
// ---------------------------------------------------------------------------
export type StockAdjustmentStatus =
  "draft" | "pending_approval" | "approved" | "confirmed" | "cancelled" | "rejected";

// ---------------------------------------------------------------------------
// Código de Razão de Ajuste
// ---------------------------------------------------------------------------
export type StockAdjustmentReasonCode =
  | "physical_count_difference"
  | "damage"
  | "loss"
  | "theft"
  | "data_correction"
  | "measurement_error"
  | "return"
  | "expiration"
  | "disposal"
  | "opening_balance"
  | "other";

// ---------------------------------------------------------------------------
// Estado de Inventário Físico
// ---------------------------------------------------------------------------
export type PhysicalInventoryCountStatus =
  "draft" | "scheduled" | "in_progress" | "counted" | "under_review" | "reconciled" | "cancelled";

// ---------------------------------------------------------------------------
// Âmbito de Inventário Físico
// ---------------------------------------------------------------------------
export type PhysicalInventoryCountScope =
  "full_location" | "selected_materials" | "selected_category" | "cycle_count";

// ---------------------------------------------------------------------------
// Estado de Lote (Logístico/Operacional)
// ---------------------------------------------------------------------------
export type InventoryBatchStatus =
  "active" | "inspection" | "blocked" | "expired" | "depleted" | "disposed";

// ---------------------------------------------------------------------------
// Estado de Qualidade do Lote (Preparação Arquitetural)
// Representa o controlo de qualidade do lote.
// NÃO substitui o estado físico de stock (InventoryStockState).
// ---------------------------------------------------------------------------
export type InventoryBatchQualityStatus =
  "pending_inspection" | "approved" | "rejected" | "quarantined";

// ---------------------------------------------------------------------------
// Tipo de Referência de Negócio
// ---------------------------------------------------------------------------
export type InventoryReferenceType =
  | "purchase_order"
  | "delivery"
  | "material_consumption"
  | "project"
  | "reservation"
  | "transfer"
  | "adjustment"
  | "physical_count"
  | "return"
  | "supplier"
  | "manual"
  | "migration"
  | "system";

// ---------------------------------------------------------------------------
// Entidade Auditável
// ---------------------------------------------------------------------------
export type InventoryAuditableEntityType =
  | "inventory_location"
  | "inventory_policy"
  | "stock_movement"
  | "inventory_balance"
  | "inventory_reservation"
  | "stock_transfer"
  | "stock_adjustment"
  | "physical_inventory_count"
  | "inventory_batch";

// ---------------------------------------------------------------------------
// Ação de Auditoria
// ---------------------------------------------------------------------------
export type InventoryAuditAction =
  | "created"
  | "updated"
  | "confirmed"
  | "cancelled"
  | "reversed"
  | "approved"
  | "rejected"
  | "reconciled"
  | "deleted"; // apenas soft delete, nunca eliminação física

// ---------------------------------------------------------------------------
// Tipo de Operação de Inventário (para idempotência)
// ---------------------------------------------------------------------------
export type InventoryOperationType =
  | "stock_entry"
  | "stock_consumption"
  | "stock_transfer"
  | "stock_reservation"
  | "stock_reservation_release"
  | "stock_adjustment"
  | "physical_count_start"
  | "physical_count_reconcile"
  | "balance_rebuild";

// ---------------------------------------------------------------------------
// Estado de Operação Processada
// ---------------------------------------------------------------------------
export type ProcessedOperationStatus = "processing" | "completed" | "failed";
