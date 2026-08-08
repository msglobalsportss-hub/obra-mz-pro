import type { Supplier, SupplierMaterial } from "./supplier-types";
import type { Material, MaterialUnit } from "../mock-data";
import { normalizeOptionalText, normalizeNuit } from "./supplier-utils";

/**
 * Valida se um NUIT é único na coleção de fornecedores
 */
export function isNuitUnique(
  nuit: string | undefined | null,
  currentId: string | undefined,
  suppliers: Supplier[]
): boolean {
  const norm = normalizeNuit(nuit);
  if (!norm) return true;

  return !suppliers.some((s) => s.id !== currentId && normalizeNuit(s.nuit) === norm);
}

/**
 * Valida a unicidade da relação comercial:
 * supplierId + materialId + purchaseUnitId + normalizeOptionalText(brand)
 */
export function isSupplierMaterialUnique(
  input: Partial<SupplierMaterial>,
  currentId: string | undefined,
  relationships: SupplierMaterial[]
): boolean {
  if (!input.supplierId || !input.materialId || !input.purchaseUnitId) return true;

  const targetBrand = normalizeOptionalText(input.brand);

  return !relationships.some((r) => {
    if (r.id === currentId) return false;
    return (
      r.supplierId === input.supplierId &&
      r.materialId === input.materialId &&
      r.purchaseUnitId === input.purchaseUnitId &&
      normalizeOptionalText(r.brand) === targetBrand
    );
  });
}

/**
 * Validação completa de payload de Fornecedor
 */
export function validateSupplierInput(
  input: Partial<Supplier>,
  currentId: string | undefined,
  existingSuppliers: Supplier[]
): string | null {
  if (!input.name || !input.name.trim()) {
    return "O nome comercial do fornecedor é obrigatório.";
  }

  if (!input.phone || !input.phone.trim()) {
    return "O telefone principal é obrigatório.";
  }

  const country = input.country?.trim() || "Moçambique";
  if (country === "Moçambique") {
    if (!input.province || !input.province.trim()) {
      return "A província é obrigatória para fornecedores em Moçambique.";
    }
  }

  if (!input.city || !input.city.trim()) {
    return "A cidade / distrito é obrigatória.";
  }

  if (input.email && input.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email.trim())) {
      return "O endereço de email introduzido não é válido.";
    }
  }

  if (input.nuit && input.nuit.trim()) {
    const normNuit = normalizeNuit(input.nuit);
    if (country === "Moçambique" && normNuit.length !== 9) {
      return "O NUIT moçambicano deve conter exatamente 9 dígitos numéricos.";
    }
    if (!isNuitUnique(input.nuit, currentId, existingSuppliers)) {
      return `O NUIT "${input.nuit.trim()}" já está registado para outro fornecedor.`;
    }
  }

  if (input.rating !== undefined && (input.rating < 1 || input.rating > 5)) {
    return "A avaliação deve ser entre 1 e 5 estrelas.";
  }

  return null;
}

/**
 * Validação de Relação Comercial (SupplierMaterial)
 */
export function validateSupplierMaterialInput(
  input: Partial<SupplierMaterial>,
  currentId: string | undefined,
  existingRelationships: SupplierMaterial[],
  materials: Material[],
  units: MaterialUnit[],
  suppliers: Supplier[]
): string | null {
  if (!input.supplierId || !input.supplierId.trim()) {
    return "O fornecedor é obrigatório.";
  }

  if (!input.materialId || !input.materialId.trim()) {
    return "O material é obrigatório.";
  }

  if (!input.purchaseUnitId || !input.purchaseUnitId.trim()) {
    return "A unidade de compra é obrigatória.";
  }

  if (input.unitPrice === undefined || input.unitPrice === null || input.unitPrice <= 0) {
    return "O preço unitário de compra deve ser maior que zero (MT).";
  }

  if (input.conversionFactor === undefined || input.conversionFactor === null || input.conversionFactor <= 0) {
    return "O fator de conversão para a unidade base deve ser maior que zero.";
  }

  if (input.minimumOrderQuantity !== undefined && input.minimumOrderQuantity !== null && input.minimumOrderQuantity <= 0) {
    return "A quantidade mínima por encomenda deve ser maior que zero quando definida.";
  }

  if (input.leadTimeDays !== undefined && input.leadTimeDays !== null && input.leadTimeDays < 0) {
    return "O prazo de entrega em dias não pode ser negativo.";
  }

  // Validação de unicidade de relação comercial
  if (!isSupplierMaterialUnique(input, currentId, existingRelationships)) {
    return "Já existe uma relação comercial registada para este fornecedor, material, unidade de compra e marca.";
  }

  // Se for uma criação nova, validar estado das entidades associadas
  if (!currentId) {
    const supplier = suppliers.find((s) => s.id === input.supplierId);
    if (supplier && supplier.status === "inactive") {
      return "Não é possível criar relações comerciais com um fornecedor inativo.";
    }

    const material = materials.find((m) => m.id === input.materialId);
    if (material && material.status === "inactive") {
      return "Não é possível associar um material inativo a um fornecedor.";
    }

    const unit = units.find((u) => u.id === input.purchaseUnitId);
    if (unit && unit.status === "inactive") {
      return "Não é possível selecionar uma unidade de compra inativa.";
    }
  }

  return null;
}
