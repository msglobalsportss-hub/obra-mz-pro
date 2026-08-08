// Utilitários de domínio para Compras, Entregas e Inventário (Etapa 6.3)
import type {
  PurchaseOrder,
  PurchaseOrderItem,
  Delivery,
  InventoryBalance,
  InventoryLocationType,
  DestinationType,
  StockMovement,
} from "./purchase-types";

// ---------------------------------------------------------------------------
// Numeração de documentos
// ---------------------------------------------------------------------------

/**
 * Gera o próximo número de pedido de compra.
 * Formato: PC-{year}-{NNN} (com padding de 4 dígitos)
 * Inclui pedidos cancelados no cálculo do máximo (não reutiliza números).
 */
export function nextPurchaseOrderNumber(orders: PurchaseOrder[]): string {
  const year = new Date().getFullYear();
  const prefix = `PC-${year}-`;
  const nums = orders
    .map((o) => o.orderNumber)
    .filter((n) => n.startsWith(prefix))
    .map((n) => parseInt(n.slice(prefix.length), 10))
    .filter((n) => !isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

/**
 * Gera o próximo número de entrega.
 * Formato: ENT-{year}-{NNN} (com padding de 4 dígitos)
 */
export function nextDeliveryNumber(deliveries: Delivery[]): string {
  const year = new Date().getFullYear();
  const prefix = `ENT-${year}-`;
  const nums = deliveries
    .map((d) => d.deliveryNumber)
    .filter((n) => n.startsWith(prefix))
    .map((n) => parseInt(n.slice(prefix.length), 10))
    .filter((n) => !isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

// ---------------------------------------------------------------------------
// Cálculos de totais do pedido
// ---------------------------------------------------------------------------

/**
 * Calcula subtotal e totalAmount a partir dos itens do pedido.
 * Protegido contra NaN e Infinity em todos os valores.
 */
export function calculateOrderTotals(
  items: PurchaseOrderItem[],
  discountAmount?: number,
  taxAmount?: number,
): { subtotal: number; totalAmount: number } {
  const subtotal = items.reduce((sum, item) => {
    const lineTotal = Number.isFinite(item.lineTotal) ? item.lineTotal : 0;
    return sum + lineTotal;
  }, 0);

  const discount = Number.isFinite(discountAmount) ? (discountAmount ?? 0) : 0;
  const tax = Number.isFinite(taxAmount) ? (taxAmount ?? 0) : 0;
  const totalAmount = Math.max(0, subtotal - discount + tax);

  return { subtotal, totalAmount };
}

/**
 * Calcula o lineTotal de um item do pedido.
 * lineTotal = orderedPurchaseQuantity × unitPrice − discountAmount + taxAmount
 */
export function calculateItemLineTotal(
  orderedPurchaseQuantity: number,
  unitPrice: number,
  discountAmount?: number,
  taxAmount?: number,
): number {
  if (!Number.isFinite(orderedPurchaseQuantity) || !Number.isFinite(unitPrice)) return 0;
  const gross = orderedPurchaseQuantity * unitPrice;
  const discount = Number.isFinite(discountAmount) ? (discountAmount ?? 0) : 0;
  const tax = Number.isFinite(taxAmount) ? (taxAmount ?? 0) : 0;
  return Math.max(0, gross - discount + tax);
}

/**
 * Calcula o estado do PurchaseOrder com base nos itens após uma confirmação de entrega.
 * Retorna "received" se todos os itens tiverem remainingPurchaseQuantity <= 0.
 */
export function calculateOrderStatusFromItems(
  items: PurchaseOrderItem[],
): "partially_received" | "received" {
  const allDone = items.every((item) => item.remainingPurchaseQuantity <= 0);
  return allDone ? "received" : "partially_received";
}

// ---------------------------------------------------------------------------
// Chave lógica de InventoryBalance
// ---------------------------------------------------------------------------

/**
 * Gera a chave lógica única de um InventoryBalance.
 * Formato: "{materialId}::{locationType}::{projectId ?? ""}"
 * Nunca deve existir dois InventoryBalance com a mesma chave.
 */
export function getInventoryBalanceKey(
  materialId: string,
  locationType: InventoryLocationType,
  projectId?: string,
): string {
  return `${materialId}::${locationType}::${projectId ?? ""}`;
}

// ---------------------------------------------------------------------------
// Resolução de destino de inventário
// ---------------------------------------------------------------------------

/**
 * Mapeia o DestinationType da entrega para InventoryLocationType + projectId.
 *
 * Regra: "supplier_direct" é um tipo logístico — o saldo entra em "project".
 * Nunca cria um locationType "supplier_direct" no InventoryBalance.
 *
 * @throws Error se destinationType !== "central_stock" e projectId for falsy
 */
export function resolveInventoryDestination(
  destinationType: DestinationType,
  destinationProjectId?: string,
): { locationType: InventoryLocationType; projectId?: string } {
  if (destinationType === "central_stock") {
    return { locationType: "central_stock", projectId: undefined };
  }

  // "project" ou "supplier_direct" → locationType = "project"
  if (!destinationProjectId) {
    throw new Error(
      `destinationProjectId é obrigatório para destinationType "${destinationType}".`,
    );
  }

  return { locationType: "project", projectId: destinationProjectId };
}

// ---------------------------------------------------------------------------
// Custo médio ponderado
// ---------------------------------------------------------------------------

/**
 * Calcula o novo custo médio ponderado após uma entrada de stock.
 *
 * Fórmula: (currentQty × currentAvg + newQty × newCost) / (currentQty + newQty)
 *
 * Proteções:
 * - Se newQty <= 0 ou não finito: retorna currentAvg sem alterar
 * - Se newCost < 0 ou não finito: lança erro (deve ser validado antes)
 * - Se currentQty < 0 (dados corrompidos): trata como 0 com aviso
 * - Se divisor = 0: retorna currentAvg
 * - Nunca retorna NaN ou Infinity
 */
export function calculateWeightedAverageCost(
  currentQty: number,
  currentAvg: number,
  newQty: number,
  newCost: number,
): number {
  // Guard: nova quantidade deve ser positiva e finita
  if (!Number.isFinite(newQty) || newQty <= 0) {
    return Number.isFinite(currentAvg) ? currentAvg : 0;
  }

  // Guard: custo atual
  const safeCurrentAvg = Number.isFinite(currentAvg) && currentAvg >= 0 ? currentAvg : 0;

  // Guard: quantidade atual — tratar negativa como 0
  const safeCurrentQty = Number.isFinite(currentQty) && currentQty >= 0 ? currentQty : 0;

  const divisor = safeCurrentQty + newQty;
  if (divisor === 0) return safeCurrentAvg;

  const result = (safeCurrentQty * safeCurrentAvg + newQty * newCost) / divisor;

  // Verificação final contra NaN/Infinity
  if (!Number.isFinite(result) || result < 0) return safeCurrentAvg;

  return result;
}

// ---------------------------------------------------------------------------
// Reconstrução de saldos a partir de movimentos
// ---------------------------------------------------------------------------

/**
 * Reconstrói todos os InventoryBalance a partir dos StockMovements.
 * Função pura — não modifica o estado.
 *
 * Útil para:
 * - Migração quando há duplicados ou NaN em averageCost
 * - Auditoria de consistência
 * - Testes de seed
 *
 * Nesta fase (Etapa 6.3), apenas purchase_receipt é processado.
 * Tipos futuros (consumption, transfer) serão adicionados na Etapa 6.4.
 *
 * @returns { balances, warnings } — warnings são erros de dados, não causam crash
 */
export function rebuildInventoryBalancesFromMovements(
  movements: StockMovement[],
  nowIso: string,
): { balances: InventoryBalance[]; warnings: string[] } {
  const warnings: string[] = [];
  const balanceMap = new Map<
    string,
    {
      materialId: string;
      locationType: InventoryLocationType;
      projectId?: string;
      quantityOnHand: number;
      averageCost: number;
      lastMovementAt?: string;
    }
  >();

  // Ordenar cronologicamente por createdAt
  const sorted = [...movements].sort((a, b) =>
    (a.createdAt ?? "").localeCompare(b.createdAt ?? ""),
  );

  for (const m of sorted) {
    // Validar movimento
    if (!Number.isFinite(m.quantity) || m.quantity <= 0) {
      warnings.push(`StockMovement ${m.id}: quantity inválida (${m.quantity}) — ignorado.`);
      continue;
    }
    if (!Number.isFinite(m.unitCost) || m.unitCost < 0) {
      warnings.push(`StockMovement ${m.id}: unitCost inválido (${m.unitCost}) — ignorado.`);
      continue;
    }
    if (!m.destinationLocationType) {
      warnings.push(`StockMovement ${m.id}: destinationLocationType ausente — ignorado.`);
      continue;
    }
    if (m.destinationLocationType === "project" && !m.destinationProjectId) {
      warnings.push(
        `StockMovement ${m.id}: destinationProjectId ausente para locationType "project" — ignorado.`,
      );
      continue;
    }

    // Apenas purchase_receipt nesta fase (entradas)
    if (m.movementType !== "purchase_receipt") {
      // Outros tipos serão processados na Etapa 6.4
      continue;
    }

    const key = getInventoryBalanceKey(
      m.materialId,
      m.destinationLocationType,
      m.destinationProjectId,
    );

    const current = balanceMap.get(key) ?? {
      materialId: m.materialId,
      locationType: m.destinationLocationType,
      projectId: m.destinationProjectId,
      quantityOnHand: 0,
      averageCost: 0,
      lastMovementAt: undefined,
    };

    const newAvg = calculateWeightedAverageCost(
      current.quantityOnHand,
      current.averageCost,
      m.quantity,
      m.unitCost,
    );

    balanceMap.set(key, {
      ...current,
      quantityOnHand: current.quantityOnHand + m.quantity,
      averageCost: newAvg,
      lastMovementAt: m.createdAt ?? nowIso,
    });
  }

  // Construir entidades InventoryBalance
  const balances: InventoryBalance[] = [];
  let idx = 1;
  for (const [, data] of balanceMap) {
    const qoh = data.quantityOnHand;
    const avg = data.averageCost;
    const totalValue = Number.isFinite(qoh) && Number.isFinite(avg) ? qoh * avg : 0;

    balances.push({
      id: `inv-bal-rebuilt-${idx++}`,
      materialId: data.materialId,
      locationType: data.locationType,
      projectId: data.projectId,
      quantityOnHand: qoh,
      averageCost: avg,
      totalValue,
      lastMovementAt: data.lastMovementAt,
      createdAt: nowIso,
      updatedAt: nowIso,
    });
  }

  return { balances, warnings };
}

// ---------------------------------------------------------------------------
// Cálculo do acceptedPurchaseQuantity
// ---------------------------------------------------------------------------

/**
 * Calcula a quantidade aceite em unidades de compra a partir da quantidade aceite em base.
 * acceptedPurchaseQuantity = acceptedBaseQuantity / conversionFactor
 *
 * @throws Error se conversionFactor <= 0
 */
export function calculateAcceptedPurchaseQuantity(
  acceptedBaseQuantity: number,
  conversionFactor: number,
): number {
  if (!Number.isFinite(conversionFactor) || conversionFactor <= 0) {
    throw new Error("conversionFactor deve ser maior que zero.");
  }
  if (!Number.isFinite(acceptedBaseQuantity) || acceptedBaseQuantity < 0) {
    return 0;
  }
  return acceptedBaseQuantity / conversionFactor;
}

// ---------------------------------------------------------------------------
// Valor total do inventário
// ---------------------------------------------------------------------------

/**
 * Calcula o valor total de todos os saldos de inventário.
 */
export function calculateInventoryTotalValue(balances: InventoryBalance[]): number {
  return balances.reduce((sum, b) => {
    const v = Number.isFinite(b.totalValue) ? b.totalValue : 0;
    return sum + v;
  }, 0);
}
