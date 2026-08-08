/**
 * Entidade Warehouse (Armazém)
 * Categoria: lib/materials
 *
 * Representa os Armazéns físicos da empresa (Principal e Secundários),
 * mapeados para localizações de inventário no InventoryEngine.
 */

export interface Warehouse {
  id: string;
  companyId: string;
  code: string;
  name: string;
  address?: string;
  province?: string;
  city?: string;
  isMainWarehouse: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWarehouseInput {
  companyId?: string;
  code: string;
  name: string;
  address?: string;
  province?: string;
  city?: string;
  isMainWarehouse?: boolean;
}

export interface UpdateWarehouseInput {
  code?: string;
  name?: string;
  address?: string;
  province?: string;
  city?: string;
  isMainWarehouse?: boolean;
  isActive?: boolean;
}

/** Armazéns de demonstração inicial padrão */
export const DEFAULT_INITIAL_WAREHOUSES: Warehouse[] = [
  {
    id: "WH-MAIN-MAPUTO",
    companyId: "COMP-1",
    code: "ARM-MAIN",
    name: "Armazém Principal — Maputo",
    address: "Av. das Indústrias, Parcela 45",
    province: "Maputo Província",
    city: "Matola",
    isMainWarehouse: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "WH-BEIRA-NORTH",
    companyId: "COMP-1",
    code: "ARM-BEIRA",
    name: "Armazém Regional — Beira",
    address: "Zona Industrial da Manga",
    province: "Sofala",
    city: "Beira",
    isMainWarehouse: false,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
