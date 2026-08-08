/**
 * Barrel principal de exportação do módulo Core do Inventário — Fase 2A.
 *
 * NOTA: O subpacote 'domain' é INTERNO ao Core.
 * Não é re-exportado aqui para evitar conflitos com interfaces existentes.
 * O Application Layer acede directamente via './domain/...'
 */

export * from "./shared";
export * from "./types";
export * from "./helpers";
export * from "./contracts";
export * from "./events";
export * from "./engine";
export * from "./interfaces";
export * from "./services";
export * from "./policies";
export * from "./validation";
