import type { PaymentTermType } from "./supplier-types";

export const MOZAMBIQUE_PROVINCES = [
  "Maputo Cidade",
  "Maputo Província",
  "Gaza",
  "Inhambane",
  "Sofala",
  "Manica",
  "Tete",
  "Zambézia",
  "Nampula",
  "Cabo Delgado",
  "Niassa",
] as const;

export const PAYMENT_TERM_LABELS: Record<PaymentTermType, string> = {
  cash: "Pronto Pagamento em Dinheiro",
  advance: "Pagamento Adiantado / Sinal",
  on_delivery: "Pagamento Contra Entrega",
  credit_7: "Crédito 7 Dias",
  credit_15: "Crédito 15 Dias",
  credit_30: "Crédito 30 Dias",
  credit_60: "Crédito 60 Dias",
  custom: "Condição Personalizada",
};

/**
 * Normaliza um texto opcional para comparação de unicidade:
 * remove espaços externos, converte para minúsculas e trata null/undefined/espaços como "".
 */
export function normalizeOptionalText(text?: string | null): string {
  if (!text) return "";
  const trimmed = text.trim();
  return trimmed ? trimmed.toLowerCase() : "";
}

/**
 * Normaliza NUIT Moçambicano removendo espaços e caracteres não numéricos.
 */
export function normalizeNuit(nuit?: string | null): string {
  if (!nuit) return "";
  return nuit.replace(/\D/g, "");
}

/**
 * Calcula o preço unitário convertido por unidade base:
 * Preço Base = Preço Comercial / Fator de Conversão.
 */
export function calculateBaseUnitPrice(unitPrice: number, conversionFactor: number): number {
  if (!unitPrice || unitPrice <= 0) return 0;
  if (!conversionFactor || conversionFactor <= 0) return unitPrice;
  return Number((unitPrice / conversionFactor).toFixed(2));
}

/**
 * Formata o rótulo legível das condições de pagamento.
 */
export function formatPaymentTermLabel(type?: PaymentTermType, days?: number, customNotes?: string): string {
  if (!type) return "Não especificada";
  if (type === "custom") {
    return customNotes ? `Personalizado: ${customNotes}` : "Condição Personalizada";
  }
  if (days && days > 0) {
    return `${PAYMENT_TERM_LABELS[type]} (${days} dias)`;
  }
  return PAYMENT_TERM_LABELS[type] || "Outra";
}

/**
 * Obtém o preço base unitário convertido se os valores forem válidos (números finitos e maiores que zero).
 * Devolve null se os dados forem inválidos.
 */
export function getValidBaseUnitPrice(rel?: { unitPrice?: number; conversionFactor?: number } | null): number | null {
  if (!rel) return null;
  const { unitPrice, conversionFactor } = rel;
  if (
    typeof unitPrice !== "number" ||
    !Number.isFinite(unitPrice) ||
    unitPrice <= 0 ||
    typeof conversionFactor !== "number" ||
    !Number.isFinite(conversionFactor) ||
    conversionFactor <= 0
  ) {
    return null;
  }
  return unitPrice / conversionFactor;
}

/**
 * Retorna os IDs de cotações ativas que possuem o menor preço base convertido.
 * Suporta empates com tolerância de ponto flutuante (0.01 MZN).
 */
export function getBestSupplierQuoteIds(rels: { id: string; status: string; unitPrice: number; conversionFactor: number; currency?: string }[]): string[] {
  const validRels = (rels || []).filter((r) => r && r.status === "active");
  let minPrice: number | null = null;

  for (const r of validRels) {
    const base = getValidBaseUnitPrice(r);
    if (base !== null) {
      if (minPrice === null || base < minPrice) {
        minPrice = base;
      }
    }
  }

  if (minPrice === null) return [];

  const min = minPrice;
  return validRels
    .filter((r) => {
      const base = getValidBaseUnitPrice(r);
      return base !== null && Math.abs(base - min) < 0.01;
    })
    .map((r) => r.id);
}

/**
 * Encontra o segundo menor preço base convertido que é estritamente maior que o melhor preço.
 */
export function getSecondBestBasePrice(rels: { status: string; unitPrice: number; conversionFactor: number }[], bestPrice: number): number | null {
  const validRels = (rels || []).filter((r) => r && r.status === "active");
  let secondBest: number | null = null;

  for (const r of validRels) {
    const base = getValidBaseUnitPrice(r);
    if (base !== null && base > bestPrice + 0.009) {
      if (secondBest === null || base < secondBest) {
        secondBest = base;
      }
    }
  }

  return secondBest;
}

/**
 * Calcula a poupança por unidade base em relação à segunda melhor cotação.
 */
export function calculateSavingsAgainstSecondBest(bestPrice: number, secondBestPrice: number | null): number {
  if (secondBestPrice === null) return 0;
  const diff = secondBestPrice - bestPrice;
  return diff > 0.009 ? diff : 0;
}

/**
 * Ordena as cotações comerciais sem mutar o array original.
 * 1. Preço base válido primeiro
 * 2. Menor preço base primeiro
 * 3. Menor prazo em caso de empate no preço
 * 4. Nome do fornecedor em caso de empate no prazo
 */
export function sortSupplierQuotes<T extends { supplierId: string; status: string; unitPrice: number; conversionFactor: number; leadTimeDays?: number }>(
  rels: T[],
  suppliersMap?: Map<string, string>
): T[] {
  return [...rels].sort((a, b) => {
    const baseA = getValidBaseUnitPrice(a);
    const baseB = getValidBaseUnitPrice(b);

    if (baseA !== null && baseB === null) return -1;
    if (baseA === null && baseB !== null) return 1;

    if (baseA !== null && baseB !== null) {
      if (Math.abs(baseA - baseB) >= 0.01) {
        return baseA - baseB;
      }

      const leadA = a.leadTimeDays ?? Infinity;
      const leadB = b.leadTimeDays ?? Infinity;
      if (leadA !== leadB) {
        return leadA - leadB;
      }
    }

    if (suppliersMap) {
      const nameA = suppliersMap.get(a.supplierId) || "";
      const nameB = suppliersMap.get(b.supplierId) || "";
      return nameA.localeCompare(nameB);
    }

    return 0;
  });
}

