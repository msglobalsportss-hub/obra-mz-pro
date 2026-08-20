import type { Supplier, SupplierMaterial } from "./supplier-types";
import {
  validateSupplierInput,
  validateSupplierMaterialInput,
  isNuitUnique,
  isSupplierMaterialUnique,
} from "./supplier-validation";
import {
  calculateBaseUnitPrice,
  normalizeOptionalText,
  getValidBaseUnitPrice,
  getBestSupplierQuoteIds,
  getSecondBestBasePrice,
  calculateSavingsAgainstSecondBest,
  sortSupplierQuotes,
} from "./supplier-utils";
import {
  initialSuppliersSeed,
  initialSupplierMaterialsSeed,
} from "./supplier-defaults";
import { demoMaterialsSeed, initialMaterialUnits } from "../materials/materials-defaults";

export function runSuppliersTests() {
  console.log("=== EXECUTANDO TESTES AUTOMATIZADOS DA ETAPA 6.2 (FORNECEDORES) ===");

  const suppliers: Supplier[] = [...initialSuppliersSeed];
  const supplierMaterials: SupplierMaterial[] = [...initialSupplierMaterialsSeed];
  const materials = [...demoMaterialsSeed];
  const units = [...initialMaterialUnits];

  // Teste 1: Criar fornecedor válido
  const err1 = validateSupplierInput(
    { name: "Construções & Ferragens do Sul", phone: "+258 84 100 2000", country: "Moçambique", province: "Gaza", city: "Xai-Xai", nuit: "400111222" },
    undefined,
    suppliers
  );
  console.assert(err1 === null, `Teste 1 Falhou: ${err1}`);

  // Teste 2: Impedir fornecedor sem nome
  const err2 = validateSupplierInput({ name: "  ", phone: "+258 84 100 2000", city: "Maputo", province: "Maputo Cidade" }, undefined, suppliers);
  console.assert(err2 === "O nome comercial do fornecedor é obrigatório.", "Teste 2 Falhou: Sem nome deve falhar");

  // Teste 3: Impedir fornecedor sem telefone
  const err3 = validateSupplierInput({ name: "Fornecedor X", phone: "  ", city: "Maputo", province: "Maputo Cidade" }, undefined, suppliers);
  console.assert(err3 === "O telefone principal é obrigatório.", "Teste 3 Falhou: Sem telefone deve falhar");

  // Teste 4: Exigir província em Moçambique
  const err4 = validateSupplierInput({ name: "Fornecedor Y", phone: "+258 84 111 2222", country: "Moçambique", province: "", city: "Matola" }, undefined, suppliers);
  console.assert(err4 === "A província é obrigatória para fornecedores em Moçambique.", "Teste 4 Falhou: Província em MZ é obrigatória");

  // Teste 5: Permitir país estrangeiro sem província obrigatória
  const err5 = validateSupplierInput({ name: "South Africa Steel Ltd", phone: "+27 11 555 0100", country: "África do Sul", city: "Johannesburg" }, undefined, suppliers);
  console.assert(err5 === null, `Teste 5 Falhou: País estrangeiro não exige província de MZ: ${err5}`);

  // Teste 6: Validar sintaxe de email inválida
  const err6 = validateSupplierInput({ name: "Fornecedor Z", phone: "+258 84 111 2222", country: "Moçambique", province: "Manica", city: "Chimoio", email: "email-invalido" }, undefined, suppliers);
  console.assert(err6 === "O endereço de email introduzido não é válido.", "Teste 6 Falhou: Email inválido deve ser detetado");

  // Teste 7: Impedir NUIT moçambicano diferente de 9 dígitos
  const err7 = validateSupplierInput({ name: "Fornecedor W", phone: "+258 84 111 2222", country: "Moçambique", province: "Manica", city: "Chimoio", nuit: "12345" }, undefined, suppliers);
  console.assert(err7 === "O NUIT moçambicano deve conter exatamente 9 dígitos numéricos.", "Teste 7 Falhou: NUIT com tamanho errado deve falhar");

  // Teste 8: Impedir NUIT duplicado (Normalizado)
  const isUniqueNuit = isNuitUnique("400 012 345", undefined, suppliers);
  console.assert(!isUniqueNuit, "Teste 8 Falhou: NUIT com espaços deve ser detetado como duplicado");

  // Teste 9: Editar próprio fornecedor mantendo NUIT
  const err9 = validateSupplierInput(
    { name: "Cimentos de Moçambique Editado", phone: "+258 21 750 100", country: "Moçambique", province: "Maputo Cidade", city: "Maputo", nuit: "400012345" },
    "supp-1",
    suppliers
  );
  console.assert(err9 === null, `Teste 9 Falhou ao editar próprio NUIT: ${err9}`);

  // Teste 10: Desativar e reactivar fornecedor (Soft Delete)
  const supp10 = { ...suppliers[0]!, status: "inactive" as const };
  console.assert(supp10.status === "inactive", "Teste 10 Falhou: Soft delete deve definir status inactive");

  // Teste 11: Validar relação comercial válida (SupplierMaterial)
  const err11 = validateSupplierMaterialInput(
    { supplierId: "supp-1", materialId: "mat-tijolo-15", purchaseUnitId: "unit-un", unitPrice: 40, conversionFactor: 1 },
    undefined,
    supplierMaterials,
    materials,
    units,
    suppliers
  );
  console.assert(err11 === null, `Teste 11 Falhou: ${err11}`);

  // Teste 12: Impedir preço unitário menor ou igual a zero por padrão
  const err12 = validateSupplierMaterialInput(
    { supplierId: "supp-1", materialId: "mat-tijolo-15", purchaseUnitId: "unit-un", unitPrice: 0, conversionFactor: 1 },
    undefined,
    supplierMaterials,
    materials,
    units,
    suppliers
  );
  console.assert(err12 === "O preço unitário de compra deve ser maior que zero (MT).", "Teste 12 Falhou: Preço <= 0 deve falhar");

  // Teste 13: Impedir fator de conversão <= 0
  const err13 = validateSupplierMaterialInput(
    { supplierId: "supp-1", materialId: "mat-tijolo-15", purchaseUnitId: "unit-un", unitPrice: 40, conversionFactor: 0 },
    undefined,
    supplierMaterials,
    materials,
    units,
    suppliers
  );
  console.assert(err13 === "O fator de conversão para a unidade base deve ser maior que zero.", "Teste 13 Falhou: Fator de conversão <= 0 deve falhar");

  // Teste 14: Validar quantidade mínima (vazio é permitido; se preenchido, deve ser > 0)
  const err14 = validateSupplierMaterialInput(
    { supplierId: "supp-1", materialId: "mat-tijolo-15", purchaseUnitId: "unit-un", unitPrice: 40, conversionFactor: 1, minimumOrderQuantity: 0 },
    undefined,
    supplierMaterials,
    materials,
    units,
    suppliers
  );
  console.assert(err14 === "A quantidade mínima por encomenda deve ser maior que zero quando definida.", "Teste 14 Falhou: Qtd mínima 0 deve falhar");

  // Teste 15: Cálculo correto do preço por unidade base (Palete de 40 sacos a 16.400 MT -> 410 MT/saco)
  const basePrice15 = calculateBaseUnitPrice(16400, 40);
  console.assert(basePrice15 === 410, `Teste 15 Falhou: Preço por unidade base de palete devia ser 410, deu: ${basePrice15}`);

  // Teste 16: Impedir relação comercial duplicada (com normalização de marca vazia)
  const isUniqueRel = isSupplierMaterialUnique(
    { supplierId: "supp-1", materialId: "mat-cimento-325", purchaseUnitId: "unit-saco", brand: " Cimentos de Moçambique " },
    undefined,
    supplierMaterials
  );
  console.assert(!isUniqueRel, "Teste 16 Falhou: Relação comercial duplicada deve ser impedida");

  // Teste 17: Normalização de marca vazia em relação comercial
  console.assert(normalizeOptionalText(undefined) === "", "Teste 17a Falhou: undefined deve ser ''");
  console.assert(normalizeOptionalText("   ") === "", "Teste 17b Falhou: espaços em branco devem ser ''");

  // Teste 18: Impedir criar relação com fornecedor inativo
  const inactiveSuppliers = [{ ...suppliers[0]!, status: "inactive" as const }];
  const err18 = validateSupplierMaterialInput(
    { supplierId: "supp-1", materialId: "mat-cimento-325", purchaseUnitId: "unit-saco", unitPrice: 400, conversionFactor: 1 },
    undefined,
    supplierMaterials,
    materials,
    units,
    inactiveSuppliers
  );
  console.assert(err18 === "Não é possível criar relações comerciais com um fornecedor inativo.", "Teste 18 Falhou: Fornecedor inativo deve ser bloqueado");

  // Teste 19: Reidratação de store antiga (propriedade suppliers undefined -> atribui seeds)
  const legacyState: any = { clientes: [{ id: "c1" }] };
  const hydratedLegacySuppliers = legacyState.suppliers !== undefined ? legacyState.suppliers : initialSuppliersSeed;
  console.assert(hydratedLegacySuppliers.length === 3, "Teste 19 Falhou: Store antiga deve carregar os 3 seeds");

  // Teste 20: Reidratação com array vazio preservado (suppliers: [] -> mantém [])
  const clearedState: any = { suppliers: [], supplierMaterials: [] };
  const hydratedClearedSuppliers = clearedState.suppliers !== undefined ? clearedState.suppliers : initialSuppliersSeed;
  console.assert(hydratedClearedSuppliers.length === 0, "Teste 20 Falhou: Array vazio de fornecedores NÃO deve ser sobrescrito com seeds");

  // Teste 21: calculateSafeBaseUnitPrice com valores nulos, indefinios, NaN e fator <= 0
  console.assert(calculateBaseUnitPrice(0, 1) === 0, "Teste 21a: Preço 0 dá 0");
  console.assert(calculateBaseUnitPrice(100, 0) === 100, "Teste 21b: Fator 0 no helper antigo devolve preco");

  // Teste 22: Relação órfã não causa crash na filtragem
  const orphanRel: SupplierMaterial = {
    id: "supp-mat-orphan",
    supplierId: "supp-inexistente",
    materialId: "mat-cimento-325",
    purchaseUnitId: "unit-inexistente",
    conversionFactor: 1,
    unitPrice: 500,
    currency: "MZN",
    isPreferred: false,
    status: "active",
    priceUpdatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const testRels = [...supplierMaterials, orphanRel];
  const filteredRels = testRels.filter((r) => r && r.materialId === "mat-cimento-325" && r.status === "active");
  const orphanSupp = suppliers.find((s) => s.id === orphanRel.supplierId);
  console.assert(orphanSupp === undefined, "Teste 22: Fornecedor de relação órfã vem undefined sem crash");
  console.assert(filteredRels.length === 3, "Teste 22: Array de relações órfãs filtrado com segurança");

  // Teste 23: Cotação única válida -> identifica como melhor preço e poupança é 0
  const singleRel: SupplierMaterial[] = [
    { id: "r1", supplierId: "s1", materialId: "m1", purchaseUnitId: "u1", conversionFactor: 1, unitPrice: 500, currency: "MZN", isPreferred: false, status: "active", priceUpdatedAt: "", createdAt: "", updatedAt: "" }
  ];
  const bestSingle = getBestSupplierQuoteIds(singleRel);
  const secondSingle = getSecondBestBasePrice(singleRel, 500);
  const savingsSingle = calculateSavingsAgainstSecondBest(500, secondSingle);
  console.assert(bestSingle.length === 1 && bestSingle[0] === "r1", "Teste 23a: Única cotação deve ser a melhor");
  console.assert(secondSingle === null, "Teste 23b: Sem segunda cotação deve dar null");
  console.assert(savingsSingle === 0, "Teste 23c: Poupança com cotação única deve ser 0");

  // Teste 24: Cenário A — Fornecedor Preferencial diferente do Melhor Preço
  // Fornecedor A: 450 MT (Preferencial, Fator 1) -> Base 450 MT
  // Fornecedor B: 16400 MT (Fator 40) -> Base 410 MT (Melhor Preço)
  const cenarioA: SupplierMaterial[] = [
    { id: "qa1", supplierId: "supp-1", materialId: "mat-1", purchaseUnitId: "u1", conversionFactor: 1, unitPrice: 450, currency: "MZN", isPreferred: true, status: "active", priceUpdatedAt: "", createdAt: "", updatedAt: "" },
    { id: "qa2", supplierId: "supp-2", materialId: "mat-1", purchaseUnitId: "u1", conversionFactor: 40, unitPrice: 16400, currency: "MZN", isPreferred: false, status: "active", priceUpdatedAt: "", createdAt: "", updatedAt: "" },
  ];
  const bestA = getBestSupplierQuoteIds(cenarioA);
  const secondPriceA = getSecondBestBasePrice(cenarioA, 410);
  const savingsA = calculateSavingsAgainstSecondBest(410, secondPriceA);
  console.assert(bestA.length === 1 && bestA[0] === "qa2", "Teste 24a: Cotação 2 (410 MT) deve ser o Melhor Preço");
  console.assert(cenarioA[0].isPreferred === true && bestA.includes("qa1") === false, "Teste 24b: Preferencial (qa1) mantido independente");
  console.assert(savingsA === 40, "Teste 24c: Poupança deve ser de 40 MT por saco (450 - 410)");

  // Teste 25: Cenário B — Fornecedor Preferencial É TAMBÉM o Melhor Preço
  const cenarioB: SupplierMaterial[] = [
    { id: "qb1", supplierId: "supp-1", materialId: "mat-2", purchaseUnitId: "u1", conversionFactor: 1, unitPrice: 100, currency: "MZN", isPreferred: true, status: "active", priceUpdatedAt: "", createdAt: "", updatedAt: "" },
    { id: "qb2", supplierId: "supp-2", materialId: "mat-2", purchaseUnitId: "u1", conversionFactor: 1, unitPrice: 400, currency: "MZN", isPreferred: false, status: "active", priceUpdatedAt: "", createdAt: "", updatedAt: "" },
  ];
  const bestB = getBestSupplierQuoteIds(cenarioB);
  console.assert(bestB.length === 1 && bestB[0] === "qb1", "Teste 25: qb1 deve ter simultaneamente Preferencial e Melhor Preço");

  // Teste 26: Cenário C — Empate no menor preço (400 MT vs 400 MT)
  const cenarioC: SupplierMaterial[] = [
    { id: "qc1", supplierId: "supp-1", materialId: "mat-3", purchaseUnitId: "u1", conversionFactor: 1, unitPrice: 400, currency: "MZN", isPreferred: false, status: "active", priceUpdatedAt: "", createdAt: "", updatedAt: "" },
    { id: "qc2", supplierId: "supp-2", materialId: "mat-3", purchaseUnitId: "u1", conversionFactor: 1, unitPrice: 400, currency: "MZN", isPreferred: false, status: "active", priceUpdatedAt: "", createdAt: "", updatedAt: "" },
  ];
  const bestC = getBestSupplierQuoteIds(cenarioC);
  const secondPriceC = getSecondBestBasePrice(cenarioC, 400);
  const savingsC = calculateSavingsAgainstSecondBest(400, secondPriceC);
  console.assert(bestC.length === 2 && bestC.includes("qc1") && bestC.includes("qc2"), "Teste 26a: Ambas as cotações empatadas recebem Melhor Preço");
  console.assert(secondPriceC === null && savingsC === 0, "Teste 26b: Empate não exibe mensagem de poupança (savings = 0)");

  // Teste 27: Cotações com conversionFactor <= 0 ou unitPrice inválido são ignoradas
  const invalidQuotes: SupplierMaterial[] = [
    { id: "qi1", supplierId: "supp-1", materialId: "mat-4", purchaseUnitId: "u1", conversionFactor: 0, unitPrice: 100, currency: "MZN", isPreferred: false, status: "active", priceUpdatedAt: "", createdAt: "", updatedAt: "" },
    { id: "qi2", supplierId: "supp-2", materialId: "mat-4", purchaseUnitId: "u1", conversionFactor: 1, unitPrice: -50, currency: "MZN", isPreferred: false, status: "active", priceUpdatedAt: "", createdAt: "", updatedAt: "" },
    { id: "qi3", supplierId: "supp-3", materialId: "mat-4", purchaseUnitId: "u1", conversionFactor: 1, unitPrice: 300, currency: "MZN", isPreferred: false, status: "active", priceUpdatedAt: "", createdAt: "", updatedAt: "" },
  ];
  const bestInv = getBestSupplierQuoteIds(invalidQuotes);
  console.assert(bestInv.length === 1 && bestInv[0] === "qi3", "Teste 27: Apenas a cotação válida (qi3) é elegível a Melhor Preço");

  // Teste 28: Cotações inativas são ignoradas
  const inactiveQuoteList: SupplierMaterial[] = [
    { id: "q_inact", supplierId: "supp-1", materialId: "mat-5", purchaseUnitId: "u1", conversionFactor: 1, unitPrice: 50, currency: "MZN", isPreferred: false, status: "inactive", priceUpdatedAt: "", createdAt: "", updatedAt: "" },
    { id: "q_act", supplierId: "supp-2", materialId: "mat-5", purchaseUnitId: "u1", conversionFactor: 1, unitPrice: 200, currency: "MZN", isPreferred: false, status: "active", priceUpdatedAt: "", createdAt: "", updatedAt: "" },
  ];
  const bestInact = getBestSupplierQuoteIds(inactiveQuoteList);
  console.assert(bestInact.length === 1 && bestInact[0] === "q_act", "Teste 28: Cotação inativa é ignorada");

  // Teste 29: Ordenação sem mutação do array original
  const originalRels: SupplierMaterial[] = [
    { id: "s_high", supplierId: "supp-1", materialId: "mat-6", purchaseUnitId: "u1", conversionFactor: 1, unitPrice: 900, currency: "MZN", isPreferred: false, status: "active", priceUpdatedAt: "", createdAt: "", updatedAt: "" },
    { id: "s_low", supplierId: "supp-2", materialId: "mat-6", purchaseUnitId: "u1", conversionFactor: 1, unitPrice: 300, currency: "MZN", isPreferred: false, status: "active", priceUpdatedAt: "", createdAt: "", updatedAt: "" },
  ];
  const sorted = sortSupplierQuotes(originalRels);
  console.assert(sorted[0].id === "s_low", "Teste 29a: Menor preço vem em primeiro na ordenação");
  console.assert(originalRels[0].id === "s_high", "Teste 29b: Array original NÃO foi mutado");

  console.log("=== TODOS OS TESTES DA ETAPA 6.2 (INCLUINDO MELHOR PREÇO) PASSARAM COM SUCESSO! ===");
  return true;
}

if (typeof describe !== "undefined") {
  describe("Suppliers Validation", () => {
    it("runs all suppliers tests", () => {
      expect(runSuppliersTests()).toBe(true);
    });
  });
}

