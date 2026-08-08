import type { Material, MaterialCategory, MaterialUnit } from "../mock-data";

/**
 * Normaliza uma string para comparação de unicidade:
 * remove espaços externos e converte para minúsculas.
 */
export function normalizeCode(code?: string): string {
  return code ? code.trim().toLowerCase() : "";
}

/**
 * Validação pura de unicidade de Código Interno (Normalized: Case & Whitespace Insensitive)
 */
export function isInternalCodeUnique(
  code: string | undefined,
  currentId: string | undefined,
  materials: Material[]
): boolean {
  const norm = normalizeCode(code);
  if (!norm) return true; // Código opcional

  return !materials.some((m) => m.id !== currentId && normalizeCode(m.internalCode) === norm);
}

/**
 * Validação pura de unicidade de SKU (Normalized: Case & Whitespace Insensitive)
 */
export function isSkuUnique(
  sku: string | undefined,
  currentId: string | undefined,
  materials: Material[]
): boolean {
  const norm = normalizeCode(sku);
  if (!norm) return true; // SKU opcional

  return !materials.some((m) => m.id !== currentId && normalizeCode(m.sku) === norm);
}

/**
 * Validação pura de unicidade de Símbolo de Unidade de Medida
 */
export function isUnitSymbolUnique(
  symbol: string,
  currentId: string | undefined,
  units: MaterialUnit[]
): boolean {
  const norm = normalizeCode(symbol);
  if (!norm) return false;

  return !units.some((u) => u.id !== currentId && normalizeCode(u.symbol) === norm);
}

/**
 * Validação completa de payload de Material
 */
export function validateMaterialInput(
  input: Partial<Material>,
  currentId: string | undefined,
  existingMaterials: Material[]
): string | null {
  if (!input.name || !input.name.trim()) {
    return "O nome do material é obrigatório.";
  }
  if (!input.categoryId || !input.categoryId.trim()) {
    return "A categoria do material é obrigatória.";
  }
  if (!input.unitId || !input.unitId.trim()) {
    return "A unidade de medida é obrigatória.";
  }
  if (input.referencePrice !== undefined && input.referencePrice < 0) {
    return "O preço de referência não pode ser negativo.";
  }
  if (input.averagePrice !== undefined && input.averagePrice < 0) {
    return "O preço médio de referência não pode ser negativo.";
  }
  if (input.minimumStock !== undefined && input.minimumStock < 0) {
    return "O stock mínimo de referência não pode ser negativo.";
  }
  if (!isInternalCodeUnique(input.internalCode, currentId, existingMaterials)) {
    return `O código interno "${input.internalCode?.trim()}" já está a ser utilizado por outro material.`;
  }
  if (!isSkuUnique(input.sku, currentId, existingMaterials)) {
    return `O SKU "${input.sku?.trim()}" já está a ser utilizado por outro material.`;
  }
  return null;
}

/**
 * Validação de Categoria
 */
export function validateCategoryInput(
  input: Partial<MaterialCategory>,
  currentId: string | undefined,
  existingCategories: MaterialCategory[]
): string | null {
  if (!input.name || !input.name.trim()) {
    return "O nome da categoria é obrigatório.";
  }
  const normName = normalizeCode(input.name);
  const duplicate = existingCategories.some(
    (c) => c.id !== currentId && normalizeCode(c.name) === normName
  );
  if (duplicate) {
    return `Já existe uma categoria com o nome "${input.name.trim()}".`;
  }
  return null;
}

/**
 * Validação de Unidade de Medida
 */
export function validateUnitInput(
  input: Partial<MaterialUnit>,
  currentId: string | undefined,
  existingUnits: MaterialUnit[]
): string | null {
  if (!input.name || !input.name.trim()) {
    return "O nome da unidade é obrigatório.";
  }
  if (!input.symbol || !input.symbol.trim()) {
    return "O símbolo da unidade é obrigatório.";
  }
  if (!isUnitSymbolUnique(input.symbol, currentId, existingUnits)) {
    return `O símbolo de unidade "${input.symbol.trim()}" já está registado.`;
  }
  return null;
}
