/**
 * Contratos de Comandos da camada Application.
 * Casos de uso concretos serão implementados nas fases posteriores.
 */

export interface IInventoryCommand {
  commandId?: string;
  timestamp?: string;
}
