/**
 * Contratos base para Value Objects do domínio de Inventário.
 * Implementações concretas de Value Objects pertencem à Fase 2.
 */

export interface IValueObject<T> {
  equals(other?: IValueObject<T>): boolean;
}
