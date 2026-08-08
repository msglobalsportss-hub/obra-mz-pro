/**
 * Zustand Store: inventoryStore
 * Categoria: store
 *
 * STORE REATIVA ISOLADA DO CORE DE INVENTÁRIO
 *
 * REGRAS ARQUITETURAIS (Refinamentos 5, 9, 17 e 18):
 * 1. A Store contem EXCLUSIVAMENTE View Models.
 * 2. ZERO lógica de negócio, ZERO cálculos de custo, ZERO incrementos manuais de saldo.
 * 3. Chave de Armazenamento por Escopo Multi-empresa:
 *    StorageKey = `${tenantId}:${companyId}:${schemaVersion}`.
 * 4. Troca de empresa (switchCompanyScope) e Logout (logout):
 *    Eliminam 100% dos dados da sessão anterior para evitar contaminação.
 * 5. Os estados temporários `loading` e `error` NÃO são mantidos entre trocas de escopo.
 */

import type {
  InventoryStoreState,
  InventoryBalanceView,
  StockMovementView,
} from "./inventory-store.types";
import { nowISO } from "../core/helpers";

export const CURRENT_SCHEMA_VERSION = 1;

export function buildInventoryStorageKey(
  tenantId: string | null,
  companyId: string | null,
  schemaVersion = CURRENT_SCHEMA_VERSION,
): string {
  if (!tenantId || !companyId) return `inventory:anonymous:v${schemaVersion}`;
  return `inventory:${tenantId}:${companyId}:v${schemaVersion}`;
}

export const initialStoreState: InventoryStoreState = {
  tenantId: null,
  companyId: null,
  schemaVersion: CURRENT_SCHEMA_VERSION,
  balances: {},
  movements: [],
  reservations: [],
  transfers: [],
  adjustments: [],
  locations: [],
  batches: [],
  loading: false,
  initialized: false,
  lastSyncAt: undefined,
  error: undefined,
};

class InventoryStoreManager {
  private state: InventoryStoreState = { ...initialStoreState };
  private listeners: Array<(state: InventoryStoreState) => void> = [];

  getState(): InventoryStoreState {
    return this.state;
  }

  getStorageKey(): string {
    return buildInventoryStorageKey(
      this.state.tenantId,
      this.state.companyId,
      this.state.schemaVersion,
    );
  }

  setState(
    partial:
      Partial<InventoryStoreState> | ((prev: InventoryStoreState) => Partial<InventoryStoreState>),
  ): void {
    const nextPartial = typeof partial === "function" ? partial(this.state) : partial;
    this.state = Object.freeze({ ...this.state, ...nextPartial });
    this.notify();
  }

  subscribe(listener: (state: InventoryStoreState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.state);
      } catch (err) {
        console.error("[InventoryStore] Erro ao notificar listener:", err);
      }
    }
  }

  /**
   * REFINAMENTO 5 e 18: Troca de Escopo Multi-empresa.
   * Purga 100% dos dados da empresa anterior se o escopo mudar.
   */
  switchCompanyScope(tenantId: string | null, companyId: string | null): void {
    if (this.state.tenantId !== tenantId || this.state.companyId !== companyId) {
      this.setState({
        ...initialStoreState,
        tenantId,
        companyId,
        lastSyncAt: nowISO(),
      });
    }
  }

  /**
   * Logout do utilizador — Purga total do estado.
   */
  logout(): void {
    this.setState({ ...initialStoreState });
  }

  /**
   * Invalidação Manual por Schema Version.
   */
  invalidateCache(): void {
    this.setState({
      ...initialStoreState,
      tenantId: this.state.tenantId,
      companyId: this.state.companyId,
      lastSyncAt: nowISO(),
    });
  }

  /**
   * Atualização atómica de saldo com deduplicação.
   */
  upsertBalanceView(balance: InventoryBalanceView): void {
    const key = `${balance.materialId}:${balance.locationId}:${balance.stockState}`;
    this.setState((prev) => ({
      balances: {
        ...prev.balances,
        [key]: balance,
      },
      lastSyncAt: nowISO(),
    }));
  }

  /**
   * Adiciona movimento com deduplicação estrita por ID.
   */
  appendMovementView(movement: StockMovementView): void {
    this.setState((prev) => {
      if (prev.movements.some((m) => m.id === movement.id)) {
        return prev; // evitar duplicados em replayed
      }
      return {
        movements: [movement, ...prev.movements],
        lastSyncAt: nowISO(),
      };
    });
  }
}

export const inventoryStoreManager = new InventoryStoreManager();
