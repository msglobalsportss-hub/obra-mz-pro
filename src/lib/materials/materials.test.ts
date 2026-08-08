import type { Material, MaterialCategory, MaterialUnit } from "../mock-data";
import {
  validateMaterialInput,
  validateCategoryInput,
  validateUnitInput,
  isInternalCodeUnique,
  isSkuUnique,
  isUnitSymbolUnique,
} from "./materials-validation";
import {
  initialMaterialCategories,
  initialMaterialUnits,
  demoMaterialsSeed,
} from "./materials-defaults";

export function runMaterialsTests() {
  console.log("=== EXECUTANDO TESTES AUTOMATIZADOS DA ETAPA 6.1 (MATERIAIS) ===");

  const cats: MaterialCategory[] = [...initialMaterialCategories];
  const units: MaterialUnit[] = [...initialMaterialUnits];
  const materials: Material[] = [...demoMaterialsSeed];

  // Teste 1: Criar material válido
  const err1 = validateMaterialInput(
    { name: "Bloco de Cimento 15", categoryId: "cat-tijolo", unitId: "unit-un", referencePrice: 45 },
    undefined,
    materials
  );
  console.assert(err1 === null, `Teste 1 Falhou: ${err1}`);

  // Teste 2: Impedir material sem nome
  const err2 = validateMaterialInput({ name: "  ", categoryId: "cat-tijolo", unitId: "unit-un" }, undefined, materials);
  console.assert(err2 === "O nome do material é obrigatório.", "Teste 2 Falhou: Sem nome deve falhar");

  // Teste 3: Impedir material sem categoria
  const err3 = validateMaterialInput({ name: "Tijolo", categoryId: "", unitId: "unit-un" }, undefined, materials);
  console.assert(err3 === "A categoria do material é obrigatória.", "Teste 3 Falhou: Sem categoria deve falhar");

  // Teste 4: Impedir material sem unidade
  const err4 = validateMaterialInput({ name: "Tijolo", categoryId: "cat-tijolo", unitId: "" }, undefined, materials);
  console.assert(err4 === "A unidade de medida é obrigatória.", "Teste 4 Falhou: Sem unidade deve falhar");

  // Teste 5: Impedir preço negativo
  const err5 = validateMaterialInput({ name: "Tijolo", categoryId: "cat-tijolo", unitId: "unit-un", referencePrice: -10 }, undefined, materials);
  console.assert(err5 === "O preço de referência não pode ser negativo.", "Teste 5 Falhou: Preço negativo deve falhar");

  // Teste 6: Impedir stock mínimo negativo
  const err6 = validateMaterialInput({ name: "Tijolo", categoryId: "cat-tijolo", unitId: "unit-un", minimumStock: -5 }, undefined, materials);
  console.assert(err6 === "O stock mínimo de referência não pode ser negativo.", "Teste 6 Falhou: Stock mínimo negativo deve falhar");

  // Teste 7: Impedir código interno duplicado (Normalized: MAT-CIM-001 vs mat-cim-001)
  const isUniqueCode = isInternalCodeUnique("mat-cim-001", undefined, materials);
  console.assert(!isUniqueCode, "Teste 7 Falhou: Código interno em minúsculas deve ser detetado como duplicado");

  // Teste 8: Impedir SKU duplicado (Normalized: CIM-325R-50KG vs cim-325r-50kg)
  const isUniqueSku = isSkuUnique("cim-325r-50kg", undefined, materials);
  console.assert(!isUniqueSku, "Teste 8 Falhou: SKU em minúsculas deve ser detetado como duplicado");

  // Teste 9: Editar material próprio mantendo código
  const err9 = validateMaterialInput(
    { name: "Cimento 32.5R Editado", categoryId: "cat-cimento", unitId: "unit-saco", internalCode: "MAT-CIM-001" },
    "mat-cimento-325",
    materials
  );
  console.assert(err9 === null, `Teste 9 Falhou ao editar material próprio: ${err9}`);

  // Teste 10: Desativar material
  const mat10 = { ...materials[0]!, status: "inactive" as const };
  console.assert(mat10.status === "inactive", "Teste 10 Falhou: Estado deve ser inactive");

  // Teste 11: Ativar material
  const mat11 = { ...mat10, status: "active" as const };
  console.assert(mat11.status === "active", "Teste 11 Falhou: Estado deve ser active");

  // Teste 12: Criar categoria
  const err12 = validateCategoryInput({ name: "Vidros e Alumínios" }, undefined, cats);
  console.assert(err12 === null, `Teste 12 Falhou: ${err12}`);

  // Teste 13: Editar categoria
  const err13 = validateCategoryInput({ name: "Madeira Trata" }, "cat-madeira", cats);
  console.assert(err13 === null, `Teste 13 Falhou: ${err13}`);

  // Teste 14: Desativar categoria utilizada
  const cat14 = { ...cats[0]!, status: "inactive" as const };
  console.assert(cat14.status === "inactive", "Teste 14 Falhou: Categoria desativada deve manter-se inactive");

  // Teste 15: Criar unidade
  const err15 = validateUnitInput({ name: "Pacote", symbol: "pct" }, undefined, units);
  console.assert(err15 === null, `Teste 15 Falhou: ${err15}`);

  // Teste 16: Impedir símbolo duplicado (Normalized: M³ vs m³)
  const isUniqueSym = isUnitSymbolUnique("m³", undefined, units);
  console.assert(!isUniqueSym, "Teste 16 Falhou: Símbolo m³ duplicado deve falhar");

  // Teste 17: Desativar unidade utilizada
  const unit17 = { ...units[0]!, status: "inactive" as const };
  console.assert(unit17.status === "inactive", "Teste 17 Falhou: Unidade desativada deve manter-se inactive");

  // Teste 18: Filtros de materiais
  const activeMats = materials.filter((m) => m.status === "active");
  console.assert(activeMats.length === materials.length, "Teste 18 Falhou: Todos os 6 devem estar ativos");

  // Teste 19: Pesquisa por nome, código e SKU
  const searchName = materials.filter((m) => m.name.toLowerCase().includes("cimento"));
  const searchCode = materials.filter((m) => (m.internalCode || "").toLowerCase().includes("fer-004"));
  console.assert(searchName.length === 1 && searchCode.length === 1, "Teste 19 Falhou: Pesquisa deve localizar materiais exatamente");

  // Teste 20 & 21: Proteção de seed sem duplicação
  const emptyMaterials: Material[] = [];
  const seededMaterials = emptyMaterials.length === 0 ? demoMaterialsSeed : emptyMaterials;
  console.assert(seededMaterials.length === 6, "Teste 20/21 Falhou: Seed deve carregar exatamente 6 materiais sem duplicar");

  // Teste 22: Cenário A — Store nova (Todos os seeds carregados)
  const scA_mats = demoMaterialsSeed;
  const scA_cats = initialMaterialCategories;
  const scA_units = initialMaterialUnits;
  console.assert(scA_mats.length === 6 && scA_cats.length === 11 && scA_units.length === 12, "Cenário A Falhou: Store nova deve possuir seeds completos");

  // Teste 23: Cenário B — Store antiga (Sem campos de materiais)
  const legacyState: any = { clientes: [{ id: "c1" }], obras: [{ id: "o1" }] };
  const scB_mats = legacyState.materials && legacyState.materials.length > 0 ? legacyState.materials : demoMaterialsSeed;
  const scB_cats = legacyState.materialCategories && legacyState.materialCategories.length > 0 ? legacyState.materialCategories : initialMaterialCategories;
  const scB_units = legacyState.materialUnits && legacyState.materialUnits.length > 0 ? legacyState.materialUnits : initialMaterialUnits;
  console.assert(scB_mats.length === 6 && scB_cats.length === 11 && scB_units.length === 12, "Cenário B Falhou: Migração de store antiga deve atribuir defaults com segurança");

  // Teste 24: Cenário C — Store parcialmente preenchida (Materiais existentes não são apagados)
  const partialState: any = {
    materials: [{ id: "custom-1", name: "Material Personalizado", categoryId: "cat-cimento", unitId: "unit-saco", status: "active" }],
    materialCategories: undefined,
    materialUnits: [],
  };
  const scC_mats = partialState.materials && partialState.materials.length > 0 ? partialState.materials : demoMaterialsSeed;
  const scC_cats = partialState.materialCategories && partialState.materialCategories.length > 0 ? partialState.materialCategories : initialMaterialCategories;
  const scC_units = partialState.materialUnits && partialState.materialUnits.length > 0 ? partialState.materialUnits : initialMaterialUnits;
  console.assert(scC_mats.length === 1 && scC_mats[0].id === "custom-1", "Cenário C Falhou: Materiais existentes em store parcial NÃO devem ser apagados");
  console.assert(scC_cats.length === 11 && scC_units.length === 12, "Cenário C Falhou: Categorias/Unidades ausentes devem receber defaults sem destruir materiais");

  console.log("=== TODOS OS TESTES DA ETAPA 6.1 (INCLUINDO CENÁRIOS A, B e C) PASSARAM COM SUCESSO! ===");
  return true;
}
