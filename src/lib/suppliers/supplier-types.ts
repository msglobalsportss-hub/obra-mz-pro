export type PaymentTermType =
  | "cash"
  | "advance"
  | "on_delivery"
  | "credit_7"
  | "credit_15"
  | "credit_30"
  | "credit_60"
  | "custom";

export interface Supplier {
  id: string;
  name: string;
  legalName?: string;
  nuit?: string;
  country: string; // default "Moçambique"
  province: string; // required when country === "Moçambique"
  city: string;
  address?: string;
  phone: string;
  secondaryPhone?: string;
  email?: string;
  contactPerson?: string;
  contactPersonPhone?: string;
  rating?: number; // 1 to 5
  paymentTermType?: PaymentTermType;
  paymentTermDays?: number;
  paymentTermsNotes?: string;
  defaultLeadTimeDays?: number;
  notes?: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface SupplierMaterial {
  id: string;
  supplierId: string;
  materialId: string;
  supplierCode?: string;
  brand?: string;
  purchaseUnitId: string;
  conversionFactor: number; // Must be > 0
  unitPrice: number; // Must be > 0 by default
  currency: string; // default "MZN"
  minimumOrderQuantity?: number; // Empty = undefined, when present > 0
  leadTimeDays?: number; // Empty = undefined, when present >= 0
  commercialConditions?: string;
  priceUpdatedAt: string;
  isPreferred: boolean;
  status: "active" | "inactive";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierPriceHistory {
  id: string;
  supplierMaterialId: string;
  supplierId: string;
  materialId: string;
  previousUnitPrice?: number;
  newUnitPrice: number;
  currency: string;
  purchaseUnitId: string;
  conversionFactor: number;
  minimumOrderQuantity?: number;
  leadTimeDays?: number;
  brand?: string;
  effectiveDate: string;
  reason?: string;
  createdAt: string;
}

export interface SupplierFilterState {
  searchQuery: string;
  status: "all" | "active" | "inactive";
  province: string;
  materialId: string;
  preferredOnly: boolean;
  sortBy: "name" | "rating" | "materialsCount" | "createdAt";
  sortOrder: "asc" | "desc";
}

export interface SupplierCatalogSummary {
  totalSuppliers: number;
  activeSuppliers: number;
  inactiveSuppliers: number;
  suppliersWithMaterialsCount: number;
  activeCommercialRelationshipsCount: number;
}
