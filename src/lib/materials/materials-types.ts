import type { Material, MaterialCategory, MaterialUnit } from "../mock-data";

export interface MaterialFilterState {
  searchQuery: string;
  categoryId: string;
  unitId: string;
  status: "all" | "active" | "inactive";
  withoutPriceOnly: boolean;
  sortBy: "name" | "price" | "createdAt";
  sortOrder: "asc" | "desc";
}

export interface MaterialCatalogSummary {
  totalMaterials: number;
  activeMaterials: number;
  inactiveMaterials: number;
  activeCategoriesCount: number;
  materialsWithoutPriceCount: number;
}
