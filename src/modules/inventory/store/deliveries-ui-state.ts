import { create } from "zustand";
import { persist } from "zustand/middleware";

// ---------------------------------------------------------------------------
// Tipos de estado da conferência (persistidos entre sessões)
// ---------------------------------------------------------------------------

export interface ConferenceState {
  deliveryId: string;
  /** itemId → quantidade entregue pelo fornecedor */
  deliveredQuantities: Record<string, number>;
  /** itemId → quantidade aceite pelo fiel */
  acceptedQuantities: Record<string, number>;
  /** itemId → motivo de rejeição */
  rejectionReasons: Record<string, string>;
  /** itemId → observações livres */
  observations: Record<string, string>;
  startedAt: string;
  lastUpdatedAt: string;
}

export type DeliveryDetailMode = "view" | "conference" | "summary" | "success";

// ---------------------------------------------------------------------------
// Interface da store
// ---------------------------------------------------------------------------

interface DeliveriesUiState {
  // Filtros da lista de entregas
  searchTerm: string;
  physicalStatusFilter: string;
  stockStatusFilter: string;
  supplierFilter: string;
  destTypeFilter: string;
  warehouseFilter: string;
  projectFilter: string;
  overdueOnly: boolean;
  divergentOnly: boolean;
  partialOnly: boolean;
  missingDocsOnly: boolean;
  showAdvancedFilters: boolean;
  currentPage: number;
  itemsPerPage: number;
  scrollY: number;

  // Estado de UI da ficha de entrega
  detailMode: DeliveryDetailMode;
  setDetailMode: (mode: DeliveryDetailMode) => void;

  // Estado persistente da conferência em curso
  conferenceState: ConferenceState | null;
  setConferenceState: (state: ConferenceState) => void;
  updateConferenceField: (
    deliveryId: string,
    field: keyof Omit<ConferenceState, "deliveryId" | "startedAt" | "lastUpdatedAt">,
    itemId: string,
    value: number | string
  ) => void;
  clearConferenceState: (deliveryId: string) => void;

  // Actions de filtros
  setSearchTerm: (val: string) => void;
  setPhysicalStatusFilter: (val: string) => void;
  setStockStatusFilter: (val: string) => void;
  setSupplierFilter: (val: string) => void;
  setDestTypeFilter: (val: string) => void;
  setWarehouseFilter: (val: string) => void;
  setProjectFilter: (val: string) => void;
  setOverdueOnly: (val: boolean) => void;
  setDivergentOnly: (val: boolean) => void;
  setPartialOnly: (val: boolean) => void;
  setMissingDocsOnly: (val: boolean) => void;
  setShowAdvancedFilters: (val: boolean) => void;
  setCurrentPage: (val: number) => void;
  setItemsPerPage: (val: number) => void;
  setScrollY: (val: number) => void;
  clearFilters: () => void;
}

// ---------------------------------------------------------------------------
// Store com persistência (sobrevive a recarregamentos de página)
// ---------------------------------------------------------------------------

export const useDeliveriesUiStateStore = create<DeliveriesUiState>()(
  persist(
    (set, get) => ({
      // Defaults dos filtros
      searchTerm: "",
      physicalStatusFilter: "all",
      stockStatusFilter: "all",
      supplierFilter: "all",
      destTypeFilter: "all",
      warehouseFilter: "all",
      projectFilter: "all",
      overdueOnly: false,
      divergentOnly: false,
      partialOnly: false,
      missingDocsOnly: false,
      showAdvancedFilters: false,
      currentPage: 1,
      itemsPerPage: 10,
      scrollY: 0,

      // Defaults do estado da ficha
      detailMode: "view",
      conferenceState: null,

      // --- Actions de UI da ficha ---

      setDetailMode: (mode) => set({ detailMode: mode }),

      setConferenceState: (state) => set({ conferenceState: state }),

      updateConferenceField: (deliveryId, field, itemId, value) => {
        const current = get().conferenceState;
        const now = new Date().toISOString();
        if (!current || current.deliveryId !== deliveryId) {
          // Inicializar novo estado de conferência
          set({
            conferenceState: {
              deliveryId,
              deliveredQuantities: {},
              acceptedQuantities: {},
              rejectionReasons: {},
              observations: {},
              startedAt: now,
              lastUpdatedAt: now,
              [field]: { [itemId]: value },
            },
          });
        } else {
          set({
            conferenceState: {
              ...current,
              lastUpdatedAt: now,
              [field]: {
                ...(current[field] as Record<string, unknown>),
                [itemId]: value,
              },
            },
          });
        }
      },

      clearConferenceState: (deliveryId) => {
        const current = get().conferenceState;
        if (current?.deliveryId === deliveryId) {
          set({ conferenceState: null, detailMode: "view" });
        }
      },

      // --- Actions de filtros ---

      setSearchTerm: (val) => set({ searchTerm: val, currentPage: 1 }),
      setPhysicalStatusFilter: (val) => set({ physicalStatusFilter: val, currentPage: 1 }),
      setStockStatusFilter: (val) => set({ stockStatusFilter: val, currentPage: 1 }),
      setSupplierFilter: (val) => set({ supplierFilter: val, currentPage: 1 }),
      setDestTypeFilter: (val) => set({ destTypeFilter: val, currentPage: 1 }),
      setWarehouseFilter: (val) => set({ warehouseFilter: val, currentPage: 1 }),
      setProjectFilter: (val) => set({ projectFilter: val, currentPage: 1 }),
      setOverdueOnly: (val) => set({ overdueOnly: val, currentPage: 1 }),
      setDivergentOnly: (val) => set({ divergentOnly: val, currentPage: 1 }),
      setPartialOnly: (val) => set({ partialOnly: val, currentPage: 1 }),
      setMissingDocsOnly: (val) => set({ missingDocsOnly: val, currentPage: 1 }),
      setShowAdvancedFilters: (val) => set({ showAdvancedFilters: val }),
      setCurrentPage: (val) => set({ currentPage: val }),
      setItemsPerPage: (val) => set({ itemsPerPage: val, currentPage: 1 }),
      setScrollY: (val) => set({ scrollY: val }),
      clearFilters: () =>
        set({
          searchTerm: "",
          physicalStatusFilter: "all",
          stockStatusFilter: "all",
          supplierFilter: "all",
          destTypeFilter: "all",
          warehouseFilter: "all",
          projectFilter: "all",
          overdueOnly: false,
          divergentOnly: false,
          partialOnly: false,
          missingDocsOnly: false,
          currentPage: 1,
        }),
    }),
    {
      name: "obramz-deliveries-ui-state",
      // Persistir apenas o estado de conferência e os filtros
      partialize: (state) => ({
        conferenceState: state.conferenceState,
        searchTerm: state.searchTerm,
        physicalStatusFilter: state.physicalStatusFilter,
        stockStatusFilter: state.stockStatusFilter,
        supplierFilter: state.supplierFilter,
        destTypeFilter: state.destTypeFilter,
        warehouseFilter: state.warehouseFilter,
        projectFilter: state.projectFilter,
        overdueOnly: state.overdueOnly,
        divergentOnly: state.divergentOnly,
        partialOnly: state.partialOnly,
        missingDocsOnly: state.missingDocsOnly,
        itemsPerPage: state.itemsPerPage,
      }),
    }
  )
);
