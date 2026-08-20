/**
 * Container de Injeção de Ações — actionContainer
 * Categoria: application/actions
 *
 * Instancia o InventoryEngine, UnitOfWork (Supabase em produção/cloud vs InMemory em DEV/TEST),
 * EventPublisher e Use Cases de Aplicação.
 */

import { InMemoryUnitOfWork } from "../../infrastructure/repositories/in-memory-unit-of-work";
import { SupabaseUnitOfWork } from "../../infrastructure/repositories/supabase/supabase-unit-of-work";
import { InMemoryEventPublisher } from "../../infrastructure/event-bus/in-memory-event-publisher";
import { InventoryEngine } from "../../core/engine/inventory-engine";
import {
  ReceiveInventoryStockUseCase,
  IssueInventoryStockUseCase,
  TransferInventoryStockUseCase,
  ReserveInventoryStockUseCase,
  ReleaseInventoryReservationUseCase,
  ConsumeInventoryReservationUseCase,
  AdjustInventoryStockUseCase,
  ReverseInventoryMovementUseCase,
  RebuildInventoryBalancesUseCase,
  CheckInventoryConsistencyUseCase,
} from "../index";
import { ProcessDeliveryIntoInventoryUseCase } from "../../features/deliveries-integration/process-delivery-into-inventory";
import { InventoryActions } from "./inventory-actions";

// Detetar ambiente de testes (Vitest / Node Test Runner)
const isTestEnv = typeof process !== "undefined" && (process.env.NODE_ENV === "test" || Boolean(process.env.VITEST));

// Convenção Canónica de Variáveis Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || (typeof process !== "undefined" ? process.env.VITE_SUPABASE_URL : undefined);
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || (typeof process !== "undefined" ? process.env.VITE_SUPABASE_ANON_KEY : undefined);

const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);
const isProd = Boolean(import.meta.env.PROD);

// Em PRODUÇÃO, proibir fallback para InMemory. Lançar erro de configuração explícito.
if (isProd && !isConfigured) {
  const msg = "ERRO CRÍTICO DE CONFIGURAÇÃO: As variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias em ambiente de Produção. O sistema recusa-se a inicializar em modo InMemory silencioso.";
  console.error(`[ObraMZ Security Gate] ${msg}`);
  throw new Error(msg);
}

export const defaultUnitOfWork = (!isTestEnv && isConfigured)
  ? new SupabaseUnitOfWork()
  : new InMemoryUnitOfWork();

export const defaultEventPublisher = new InMemoryEventPublisher();
export const defaultInventoryEngine = new InventoryEngine(defaultUnitOfWork, defaultEventPublisher);

// Use Cases
export const receiveStockUseCase = new ReceiveInventoryStockUseCase(defaultInventoryEngine);
export const issueStockUseCase = new IssueInventoryStockUseCase(defaultInventoryEngine);
export const transferStockUseCase = new TransferInventoryStockUseCase(defaultInventoryEngine);
export const reserveStockUseCase = new ReserveInventoryStockUseCase(defaultInventoryEngine);
export const releaseReservationUseCase = new ReleaseInventoryReservationUseCase(defaultInventoryEngine);
export const consumeReservationUseCase = new ConsumeInventoryReservationUseCase(defaultInventoryEngine);
export const adjustStockUseCase = new AdjustInventoryStockUseCase(defaultInventoryEngine);
export const reverseMovementUseCase = new ReverseInventoryMovementUseCase(defaultInventoryEngine);
export const rebuildBalancesUseCase = new RebuildInventoryBalancesUseCase(defaultInventoryEngine);
export const checkHealthUseCase = new CheckInventoryConsistencyUseCase(defaultUnitOfWork.context);
export const processDeliveryUseCase = new ProcessDeliveryIntoInventoryUseCase(
  defaultInventoryEngine,
  defaultUnitOfWork.locations,
);

// Instância Global de Ações
export const inventoryActions = new InventoryActions(
  receiveStockUseCase,
  issueStockUseCase,
  transferStockUseCase,
  reserveStockUseCase,
  releaseReservationUseCase,
  consumeReservationUseCase,
  adjustStockUseCase,
  reverseMovementUseCase,
  rebuildBalancesUseCase,
  checkHealthUseCase,
  processDeliveryUseCase,
  defaultUnitOfWork,
);
