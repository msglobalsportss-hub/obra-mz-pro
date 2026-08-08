/**
 * Aliases de tipo neutros reutilizáveis no Core — Fase 2A.
 *
 * NOTA: TenantId, CompanyId, ActorId são branded types em shared/primitives.
 * Este ficheiro define apenas aliases que NÃO conflituam com primitives.
 *
 * Notas sobre precisão numérica:
 * - Quantidades e preços utilizam number (compatibilidade com o projeto atual).
 * - Quantidades não podem ser NaN ou Infinity.
 * - Preços não podem ser negativos.
 * - A introdução de bibliotecas monetárias (Decimal.js, etc.) será avaliada na Fase 2B.
 */

export type ISO8601String = string;
export type CurrencyCode = "MZN" | "EUR" | "USD" | (string & {});

/**
 * Quantidade de stock — sempre em unidades BASE, sempre positiva.
 * Nunca NaN, nunca Infinity, nunca negativa em contextos documentais.
 */
export type Quantity = number;

/**
 * Preço unitário por unidade base.
 * Deve ser >= 0. Nunca NaN, nunca Infinity.
 */
export type UnitPrice = number;

/**
 * Valor monetário total.
 * = Quantity × UnitPrice. Nunca NaN, nunca negativo.
 */
export type MoneyAmount = number;

// ---------------------------------------------------------------------------
// Aliases de strings para contexto de eventos e correlação
// (simples string — não exigem branded types para flexibilidade de integração)
// ---------------------------------------------------------------------------
export type EventId = string;
export type CorrelationId = string;
export type CausationId = string;
export type IdempotencyKey = string;
