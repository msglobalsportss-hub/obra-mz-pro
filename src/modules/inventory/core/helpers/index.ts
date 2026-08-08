/**
 * Helpers puros do Core de Inventário — Fase 2A.
 *
 * Regra: funções puras, independentes de frameworks, sem regras de negócio.
 * Regras de stock, custo, reservas, transferências ou validações NUNCA aqui.
 */

import type { InventoryBalanceDimensions } from "../domain/entities";

/**
 * Constrói uma chave determinística para identificar um saldo de inventário.
 *
 * A chave considera todas as dimensões do saldo (ADR-006):
 * tenantId | companyId | materialId | locationId | stockState | batchId | expirationDate
 *
 * Regras de normalização:
 * - batchId ausente → 'no-batch'
 * - expirationDate ausente → 'no-exp'
 * - Separador '|' para evitar colisões com IDs que contenham '::'
 */
export function buildBalanceDimensionKey(dimensions: InventoryBalanceDimensions): string {
  const batchPart = dimensions.batchId ?? "no-batch";
  const expPart = dimensions.expirationDate
    ? normalizeExpirationDate(dimensions.expirationDate)
    : "no-exp";

  return [
    dimensions.tenantId,
    dimensions.companyId,
    dimensions.materialId,
    dimensions.locationId,
    dimensions.stockState,
    batchPart,
    expPart,
  ].join("|");
}

/**
 * Normaliza uma data de validade para o formato YYYY-MM-DD.
 * Garante consistência na comparação de datas de validade.
 */
export function normalizeExpirationDate(isoDate: string): string {
  return isoDate.slice(0, 10); // YYYY-MM-DD
}

/**
 * Helper simples de chave de saldo (compatibilidade com Fase 6.3 existente).
 * Mantido para evitar breaking changes nos módulos atuais.
 * A versão completa usa buildBalanceDimensionKey.
 *
 * @deprecated Prefer buildBalanceDimensionKey para novos casos de uso.
 */
export function buildBalanceKey(
  materialId: string,
  locationType: string,
  locationId?: string,
): string {
  return `${materialId}:${locationType}:${locationId ?? "global"}`;
}

/**
 * Gera um ID simples baseado em timestamp + random para contextos sem UUID.
 * Em produção, usar crypto.randomUUID() via adaptador.
 */
export function generateInventoryId(prefix: string): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 7);
  return `${prefix}-${ts}-${rand}`;
}

/**
 * Gera um timestamp ISO 8601 atual.
 * Extraído como helper para facilitar testes (injeção de tempo).
 */
export function nowISO(): string {
  return new Date().toISOString();
}
