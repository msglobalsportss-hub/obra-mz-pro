/**
 * Guards utilitários arquiteturais.
 * Regras concretas de stock pertencem à Fase 2.
 */

export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
