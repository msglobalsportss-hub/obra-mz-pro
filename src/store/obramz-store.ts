import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Cliente, Obra, ObraEvento, ObraFoto, ObraFase, Orcamento, OrcamentoHistorico, Pagamento,
  Atividade, Empresa, Utilizador, EstadoOrcamento, EstadoObra, Worker, Team, ProjectAssignment,
  AttendanceStatus, AttendanceRecord, AttendanceSchedule, DisabledDayRecord,
  Material, MaterialCategory, MaterialUnit,
} from "@/lib/mock-data";
import { validateScheduleOverlap } from "@/lib/attendance-schedule";
import {
  initialMaterialCategories,
  initialMaterialUnits,
  demoMaterialsSeed,
  validateMaterialInput,
  validateCategoryInput,
  validateUnitInput,
} from "@/lib/materials";
import type { Warehouse, CreateWarehouseInput, UpdateWarehouseInput } from "@/lib/materials/warehouse";
import { DEFAULT_INITIAL_WAREHOUSES } from "@/lib/materials/warehouse";
import { inventoryActions } from "@/modules/inventory/application/actions/action-container";
import type {
  Supplier, SupplierMaterial, SupplierPriceHistory,
} from "@/lib/suppliers";
import {
  initialSuppliersSeed,
  initialSupplierMaterialsSeed,
  initialSupplierPriceHistoriesSeed,
  validateSupplierInput,
  validateSupplierMaterialInput,
} from "@/lib/suppliers";
import type {
  PurchaseOrder,
  PurchaseOrderItem,
  Delivery,
  DeliveryItem,
  StockMovement,
  InventoryBalance,
  InventoryLocationType,
  PurchaseOrderDuplicateData,
} from "@/lib/purchases";
import {
  demoPurchaseOrdersSeed,
  demoPurchaseOrderItemsSeed,
  demoDeliveriesSeed,
  demoDeliveryItemsSeed,
  demoStockMovementsSeed,
  demoInventoryBalancesSeed,
  validatePurchaseOrderInput,
  validatePurchaseOrderItemInput,
  validateDeliveryInput,
  validateDeliveryItemInput,
  validateInventoryBalance,
  nextPurchaseOrderNumber,
  nextDeliveryNumber,
  calculateOrderTotals,
  calculateItemLineTotal,
  calculateOrderStatusFromItems,
  calculateWeightedAverageCost,
  calculateAcceptedPurchaseQuantity,
  getInventoryBalanceKey,
  resolveInventoryDestination,
  calculateInventoryTotalValue,
} from "@/lib/purchases";

import { totalOrcamento } from "@/lib/mock-data";

const nowIso = () => new Date().toISOString();
const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

// -------------------------------------------------------------------
// Seed inicial — dados de demonstração consistentes conforme o brief.
// -------------------------------------------------------------------

const empresaSeed: Empresa = {
  nome: "Construções Horizonte, Lda.",
  nuit: "400123456",
  telefone: "+258 84 123 4567",
  email: "geral@horizonte.co.mz",
  website: "www.horizonte.co.mz",
  provincia: "Maputo",
  cidade: "Maputo",
  endereco: "Av. 24 de Julho, nº 1234, Maputo",
  descricao: "Empreiteira especializada em construção civil e renovações.",
  banco: "BCI — 1234567890 — Construções Horizonte, Lda.",
  mpesa: "+258 84 123 4567",
  emola: "+258 86 123 4567",
};

const utilizadorSeed: Utilizador = {
  nome: "António Machava",
  email: "antonio@horizonte.co.mz",
  cargo: "Gerente",
};

const clientesSeed: Cliente[] = [
  {
    id: "c1", nome: "João Mabote", tipo: "particular",
    telefone: "+258 82 111 2233", email: "joao.mabote@email.mz", nuit: "100200301",
    provincia: "Maputo", cidade: "Matola", endereco: "Bairro Machava, Rua 12",
    criadoEm: "2026-03-15T09:00:00.000Z",
  },
  {
    id: "c2", nome: "Ana Macamo", tipo: "particular",
    telefone: "+258 84 333 4455", email: "ana.macamo@email.mz", nuit: "100400502",
    provincia: "Maputo", cidade: "Maputo", endereco: "Bairro Polana, Av. Julius Nyerere",
    criadoEm: "2026-04-01T09:00:00.000Z",
  },
  {
    id: "c3", nome: "Empresa Nova Vida, Lda.", tipo: "empresa",
    telefone: "+258 21 320 100", email: "contacto@novavida.co.mz", nuit: "400889977",
    provincia: "Maputo", cidade: "Maputo", endereco: "Av. 25 de Setembro, nº 210",
    criadoEm: "2026-01-10T09:00:00.000Z",
  },
  {
    id: "c4", nome: "Alberto Mondlane", tipo: "particular",
    telefone: "+258 87 555 6677", email: "alberto.m@email.mz", nuit: "100778899",
    provincia: "Gaza", cidade: "Xai-Xai", endereco: "Bairro Praia, Rua 4",
    criadoEm: "2026-05-20T09:00:00.000Z",
  },
  {
    id: "c5", nome: "Celina Mucavele", tipo: "particular",
    telefone: "+258 82 998 7766", email: "celina.muc@email.mz", nuit: "100554433",
    provincia: "Maputo", cidade: "Marracuene", endereco: "Bairro Central, Rua 8",
    criadoEm: "2026-05-25T09:00:00.000Z",
  },
  {
    id: "c6", nome: "Construções Índico, Lda.", tipo: "empresa",
    telefone: "+258 26 213 400", email: "obras@indico.co.mz", nuit: "400221133",
    provincia: "Inhambane", cidade: "Inhambane", endereco: "Av. da Independência, 78",
    criadoEm: "2026-04-05T09:00:00.000Z",
  },
];

const obrasSeed: Obra[] = [
  {
    id: "o1", nome: "Construção de Moradia T3 — Matola", clienteId: "c1",
    tipo: "Construção de moradia", descricao: "Construção de moradia unifamiliar T3 com garagem.",
    provincia: "Maputo", cidade: "Matola", endereco: "Bairro Machava, Rua 12, nº 45",
    inicio: "2026-04-10", fimPrevisto: "2026-11-30",
    progresso: 42, valorPrevisto: 1250000, estado: "em_andamento",
    responsavel: "Eng. Mário Sitoe",
    progressoAtualizadoEm: "2026-07-10T10:00:00.000Z",
    criadoEm: "2026-03-20T09:00:00.000Z",
    eventos: [
      { id: "e1", data: "2026-04-10", titulo: "Início dos trabalhos", tipo: "obra_criada", visibilidade: "publica" },
      { id: "e2", data: "2026-06-01", titulo: "Fundação concluída", tipo: "progresso", visibilidade: "publica" },
      { id: "e3", data: "2026-07-01", titulo: "Alvenaria em curso", tipo: "progresso", visibilidade: "publica" },
    ],
  },
  {
    id: "o2", nome: "Renovação de Escritório — Maputo", clienteId: "c3",
    tipo: "Renovação", descricao: "Renovação completa de escritório em edifício comercial.",
    provincia: "Maputo", cidade: "Maputo", endereco: "Av. 25 de Setembro, nº 210, 3º andar",
    inicio: "2026-02-15", fimPrevisto: "2026-05-30",
    progresso: 100, valorPrevisto: 480000, estado: "concluida",
    responsavel: "António Machava",
    progressoAtualizadoEm: "2026-05-30T10:00:00.000Z",
    criadoEm: "2026-02-01T09:00:00.000Z",
    eventos: [
      { id: "e1", data: "2026-02-15", titulo: "Início dos trabalhos", tipo: "obra_criada", visibilidade: "publica" },
      { id: "e2", data: "2026-05-30", titulo: "Obra concluída e entregue", tipo: "outro", visibilidade: "publica" },
    ],
  },
  {
    id: "o3", nome: "Renovação apartamento Polana", clienteId: "c2",
    tipo: "Renovação", descricao: "Renovação completa de apartamento T2.",
    provincia: "Maputo", cidade: "Maputo", endereco: "Av. Julius Nyerere, Edif. Polana",
    inicio: "2026-05-02", fimPrevisto: "2026-08-15",
    progresso: 85, valorPrevisto: 620000, estado: "em_andamento",
    responsavel: "António Machava",
    criadoEm: "2026-04-25T09:00:00.000Z",
    eventos: [
      { id: "e1", data: "2026-05-02", titulo: "Início dos trabalhos", tipo: "obra_criada", visibilidade: "publica" },
    ],
  },
  {
    id: "o4", nome: "Ampliação residencial Xai-Xai", clienteId: "c4",
    tipo: "Ampliação", descricao: "Ampliação de dois quartos e casa de banho.",
    provincia: "Gaza", cidade: "Xai-Xai", endereco: "Bairro Praia, Rua 4",
    inicio: "2026-08-01", fimPrevisto: "2026-11-15",
    progresso: 0, valorPrevisto: 890000, estado: "planeada",
    responsavel: "Eng. Mário Sitoe",
    criadoEm: "2026-07-01T09:00:00.000Z",
    eventos: [],
  },
  {
    id: "o5", nome: "Pintura exterior — Marracuene", clienteId: "c5",
    tipo: "Pintura", descricao: "Pintura exterior e interior de vivenda.",
    provincia: "Maputo", cidade: "Marracuene", endereco: "Bairro Central, Rua 8",
    inicio: "2026-06-10", fimPrevisto: "2026-07-15",
    progresso: 100, valorPrevisto: 220000, estado: "concluida",
    responsavel: "António Machava",
    criadoEm: "2026-06-05T09:00:00.000Z",
    eventos: [],
  },
  {
    id: "o6", nome: "Instalação elétrica loja Inhambane", clienteId: "c6",
    tipo: "Instalação elétrica", descricao: "Instalação elétrica completa de loja comercial.",
    provincia: "Inhambane", cidade: "Inhambane", endereco: "Av. da Independência, 78",
    inicio: "2026-05-20", fimPrevisto: "2026-07-05",
    progresso: 40, valorPrevisto: 380000, estado: "suspensa",
    responsavel: "Eng. Paulo Chissano",
    criadoEm: "2026-05-10T09:00:00.000Z",
    eventos: [],
  },
];

const orcamentosSeed: Orcamento[] = [
  {
    id: "orc1", numero: "ORC-2026-001", clienteId: "c1", obraId: "o1",
    titulo: "Construção de moradia T3 — Matola",
    descricao: "Orçamento para construção de moradia unifamiliar T3.",
    emissao: "2026-03-20", validade: "2026-04-20", estado: "aceite",
    itens: [
      { id: "i1", descricao: "Escavação e movimento de terras", categoria: "Preliminares", unidade: "m³", quantidade: 120, precoUnitario: 850, desconto: 0 },
      { id: "i2", descricao: "Fundação em betão armado", categoria: "Fundação", unidade: "m³", quantidade: 45, precoUnitario: 8500, desconto: 0 },
      { id: "i3", descricao: "Alvenaria de bloco 20cm", categoria: "Alvenaria", unidade: "m²", quantidade: 320, precoUnitario: 950, desconto: 0 },
      { id: "i4", descricao: "Mão de obra especializada", categoria: "Mão de obra", unidade: "dia", quantidade: 180, precoUnitario: 1500, desconto: 0 },
    ],
    descontoGeral: 0, imposto: 0, custosAdicionais: 46000,
    notas: "Prazo de execução: 8 meses. Materiais incluídos.",
    condicoes: "30% de sinal, 40% durante a execução, 30% na entrega.",
    historico: [
      { id: "h1", data: "2026-03-20T09:00:00.000Z", descricao: "Orçamento criado" },
      { id: "h2", data: "2026-03-22T14:00:00.000Z", descricao: "Estado alterado para Enviado" },
      { id: "h3", data: "2026-03-25T10:00:00.000Z", descricao: "Estado alterado para Aceite" },
    ],
    criadoEm: "2026-03-20T09:00:00.000Z",
    atualizadoEm: "2026-03-25T10:00:00.000Z",
  },
  {
    id: "orc2", numero: "ORC-2026-002", clienteId: "c3", obraId: "o2",
    titulo: "Renovação de Escritório — Maputo",
    descricao: "Renovação completa incluindo canalização, elétrica e acabamentos.",
    emissao: "2026-02-01", validade: "2026-03-01", estado: "aceite",
    itens: [
      { id: "i1", descricao: "Demolição e remoção de entulho", categoria: "Preliminares", unidade: "serviço", quantidade: 1, precoUnitario: 45000, desconto: 0 },
      { id: "i2", descricao: "Canalização de água e esgoto", categoria: "Canalização", unidade: "serviço", quantidade: 1, precoUnitario: 120000, desconto: 0 },
      { id: "i3", descricao: "Pintura interior", categoria: "Pintura", unidade: "m²", quantidade: 180, precoUnitario: 320, desconto: 0 },
      { id: "i4", descricao: "Revestimento cerâmico", categoria: "Revestimento", unidade: "m²", quantidade: 42, precoUnitario: 1800, desconto: 0 },
      { id: "i5", descricao: "Instalação elétrica", categoria: "Instalação elétrica", unidade: "serviço", quantidade: 1, precoUnitario: 118400, desconto: 0 },
    ],
    descontoGeral: 0, imposto: 0, custosAdicionais: 0,
    notas: "", condicoes: "50% no início, 50% na conclusão.",
    historico: [
      { id: "h1", data: "2026-02-01T09:00:00.000Z", descricao: "Orçamento criado" },
      { id: "h2", data: "2026-02-05T14:00:00.000Z", descricao: "Estado alterado para Aceite" },
    ],
    criadoEm: "2026-02-01T09:00:00.000Z",
    atualizadoEm: "2026-02-05T14:00:00.000Z",
  },
  {
    id: "orc3", numero: "ORC-2026-003", clienteId: "c2", obraId: "o3",
    titulo: "Renovação apartamento T2", descricao: "Renovação completa",
    emissao: "2026-04-15", validade: "2026-05-15", estado: "aceite",
    itens: [
      { id: "i1", descricao: "Canalização", categoria: "Canalização", unidade: "serviço", quantidade: 1, precoUnitario: 180000, desconto: 0 },
      { id: "i2", descricao: "Pintura", categoria: "Pintura", unidade: "m²", quantidade: 180, precoUnitario: 800, desconto: 0 },
      { id: "i3", descricao: "Revestimento", categoria: "Revestimento", unidade: "m²", quantidade: 100, precoUnitario: 2960, desconto: 0 },
    ],
    descontoGeral: 20000, imposto: 0, custosAdicionais: 0,
    notas: "", condicoes: "50/50.",
    historico: [{ id: "h1", data: "2026-04-15T09:00:00.000Z", descricao: "Orçamento criado" }],
    criadoEm: "2026-04-15T09:00:00.000Z",
    atualizadoEm: "2026-04-15T09:00:00.000Z",
  },
  {
    id: "orc4", numero: "ORC-2026-004", clienteId: "c4", obraId: "o4",
    titulo: "Ampliação residencial", descricao: "Dois quartos e casa de banho",
    emissao: "2026-07-05", validade: "2026-08-05", estado: "enviado",
    itens: [
      { id: "i1", descricao: "Fundação e estrutura", categoria: "Fundação", unidade: "lote", quantidade: 1, precoUnitario: 380000, desconto: 0 },
      { id: "i2", descricao: "Alvenaria e cobertura", categoria: "Alvenaria", unidade: "lote", quantidade: 1, precoUnitario: 320000, desconto: 0 },
      { id: "i3", descricao: "Acabamentos", categoria: "Revestimento", unidade: "lote", quantidade: 1, precoUnitario: 190000, desconto: 0 },
    ],
    descontoGeral: 0, imposto: 0, custosAdicionais: 0,
    notas: "Prazo estimado: 3,5 meses.", condicoes: "30/40/30.",
    historico: [{ id: "h1", data: "2026-07-05T09:00:00.000Z", descricao: "Orçamento criado" }],
    criadoEm: "2026-07-05T09:00:00.000Z",
    atualizadoEm: "2026-07-05T09:00:00.000Z",
  },
  {
    id: "orc5", numero: "ORC-2026-005", clienteId: "c5", obraId: "o5",
    titulo: "Pintura vivenda", descricao: "Interior e exterior",
    emissao: "2026-05-30", validade: "2026-06-30", estado: "aceite",
    itens: [
      { id: "i1", descricao: "Preparação de superfície", categoria: "Preliminares", unidade: "m²", quantidade: 260, precoUnitario: 180, desconto: 0 },
      { id: "i2", descricao: "Pintura tinta acrílica 2 demãos", categoria: "Pintura", unidade: "m²", quantidade: 260, precoUnitario: 480, desconto: 0 },
      { id: "i3", descricao: "Mão de obra", categoria: "Mão de obra", unidade: "dia", quantidade: 15, precoUnitario: 3200, desconto: 0 },
    ],
    descontoGeral: 0, imposto: 0, custosAdicionais: 0,
    notas: "", condicoes: "50/50.",
    historico: [{ id: "h1", data: "2026-05-30T09:00:00.000Z", descricao: "Orçamento criado" }],
    criadoEm: "2026-05-30T09:00:00.000Z",
    atualizadoEm: "2026-05-30T09:00:00.000Z",
  },
  {
    id: "orc6", numero: "ORC-2026-006", clienteId: "c6", obraId: "o6",
    titulo: "Instalação elétrica loja", descricao: "Instalação completa",
    emissao: "2026-05-01", validade: "2026-06-01", estado: "visualizado",
    itens: [
      { id: "i1", descricao: "Quadro elétrico e cablagem", categoria: "Instalação elétrica", unidade: "lote", quantidade: 1, precoUnitario: 240000, desconto: 0 },
      { id: "i2", descricao: "Iluminação LED", categoria: "Instalação elétrica", unidade: "unidade", quantidade: 32, precoUnitario: 3500, desconto: 0 },
    ],
    descontoGeral: 0, imposto: 0, custosAdicionais: 28000,
    notas: "", condicoes: "50% no início, 50% na conclusão.",
    historico: [{ id: "h1", data: "2026-05-01T09:00:00.000Z", descricao: "Orçamento criado" }],
    criadoEm: "2026-05-01T09:00:00.000Z",
    atualizadoEm: "2026-05-01T09:00:00.000Z",
  },
  {
    id: "orc7", numero: "ORC-2026-007", clienteId: "c1",
    titulo: "Muro de vedação", descricao: "Muro perimetral 60m",
    emissao: "2026-07-08", validade: "2026-07-25", estado: "rascunho",
    itens: [
      { id: "i1", descricao: "Fundação corrida", categoria: "Fundação", unidade: "m", quantidade: 60, precoUnitario: 1200, desconto: 0 },
      { id: "i2", descricao: "Alvenaria de bloco", categoria: "Alvenaria", unidade: "m²", quantidade: 108, precoUnitario: 950, desconto: 0 },
    ],
    descontoGeral: 0, imposto: 0, custosAdicionais: 0,
    notas: "", condicoes: "",
    historico: [{ id: "h1", data: "2026-07-08T09:00:00.000Z", descricao: "Orçamento criado" }],
    criadoEm: "2026-07-08T09:00:00.000Z",
    atualizadoEm: "2026-07-08T09:00:00.000Z",
  },
];

const pagamentosSeed: Pagamento[] = [
  {
    id: "p1", clienteId: "c1", obraId: "o1", orcamentoId: "orc1",
    valor: 500000, data: "2026-04-05", metodo: "transferencia", referencia: "TRF-88213",
    estado: "confirmado", criadoEm: "2026-04-05T09:00:00.000Z",
  },
  {
    id: "p2", clienteId: "c3", obraId: "o2", orcamentoId: "orc2",
    valor: 240000, data: "2026-02-10", metodo: "transferencia", referencia: "TRF-77120",
    estado: "confirmado", criadoEm: "2026-02-10T09:00:00.000Z",
  },
  {
    id: "p3", clienteId: "c3", obraId: "o2", orcamentoId: "orc2",
    valor: 240000, data: "2026-05-30", metodo: "transferencia", referencia: "TRF-80013",
    estado: "confirmado", criadoEm: "2026-05-30T09:00:00.000Z",
  },
  {
    id: "p4", clienteId: "c2", obraId: "o3", orcamentoId: "orc3",
    valor: 310000, data: "2026-04-20", metodo: "mpesa", referencia: "MP-6621",
    estado: "confirmado", criadoEm: "2026-04-20T09:00:00.000Z",
  },
  {
    id: "p5", clienteId: "c5", obraId: "o5", orcamentoId: "orc5",
    valor: 220000, data: "2026-07-11", metodo: "emola", referencia: "EM-4482",
    estado: "confirmado", criadoEm: "2026-07-11T09:00:00.000Z",
  },
];

const atividadesSeed: Atividade[] = [
  { id: "a1", data: "2026-07-11T09:00:00.000Z", descricao: "Pagamento de 220 000 MZN recebido de Celina Mucavele", entidade: "pagamento", entidadeId: "p5" },
  { id: "a2", data: "2026-07-08T09:00:00.000Z", descricao: "Orçamento ORC-2026-007 criado", entidade: "orcamento", entidadeId: "orc7" },
  { id: "a3", data: "2026-07-05T09:00:00.000Z", descricao: "Orçamento ORC-2026-004 enviado a Alberto Mondlane", entidade: "orcamento", entidadeId: "orc4" },
];

// -------------------------------------------------------------------
// Store
// -------------------------------------------------------------------

export type ObraMZState = {
  clientes: Cliente[];
  obras: Obra[];
  orcamentos: Orcamento[];
  pagamentos: Pagamento[];
  atividades: Atividade[];
  workers: Worker[];
  teams: Team[];
  projectAssignments: ProjectAssignment[];
  empresa: Empresa;
  utilizador: Utilizador;
  _hydrated: boolean;

  // internas
  _addAtividade: (descricao: string, entidade: Atividade["entidade"], entidadeId: string) => void;
  _addHistorico: (orcId: string, descricao: string) => void;

  // Clientes
  createCliente: (data: Omit<Cliente, "id" | "criadoEm">) => Cliente;
  updateCliente: (id: string, patch: Partial<Cliente>) => void;
  deleteCliente: (id: string) => void;

  // Obras
  createObra: (data: Omit<Obra, "id" | "criadoEm" | "eventos"> & { eventos?: ObraEvento[] }) => Obra;
  updateObra: (id: string, patch: Partial<Obra>) => void;
  updateObraProgresso: (id: string, progresso: number) => void;
  updateObraEstado: (id: string, estado: EstadoObra) => void;
  deleteObra: (id: string) => void;
  addObraEvento: (obraId: string, evento: Omit<ObraEvento, "id">) => void;
  updateObraEvento: (obraId: string, evento: ObraEvento) => void;
  deleteObraEvento: (obraId: string, eventoId: string) => void;
  addObraFoto: (obraId: string, foto: Omit<ObraFoto, "id" | "criadoEm">) => void;
  updateObraFoto: (obraId: string, fotoId: string, patch: Partial<ObraFoto>) => void;
  deleteObraFoto: (obraId: string, fotoId: string) => void;
  addObraFase: (obraId: string, fase: Omit<ObraFase, "id" | "ordem">) => void;
  updateObraFase: (obraId: string, faseId: string, patch: Partial<ObraFase>) => void;
  deleteObraFase: (obraId: string, faseId: string) => void;
  reorderObraFases: (obraId: string, faseId: string, direcao: "cima" | "baixo") => void;
  aplicarProgressoFases: (obraId: string) => void;


  // Orçamentos
  createOrcamento: (data: Omit<Orcamento, "id" | "criadoEm" | "atualizadoEm" | "historico" | "numero"> & { numero?: string }) => Orcamento;
  updateOrcamento: (id: string, patch: Partial<Orcamento>) => void;
  updateOrcamentoEstado: (id: string, estado: EstadoOrcamento) => void;
  duplicateOrcamento: (id: string) => Orcamento | null;
  deleteOrcamento: (id: string) => void;

  // Pagamentos
  createPagamento: (data: Omit<Pagamento, "id" | "criadoEm">) => Pagamento;
  updatePagamento: (id: string, patch: Partial<Pagamento>) => void;
  deletePagamento: (id: string) => void;

  // Empresa & utilizador
  updateEmpresa: (patch: Partial<Empresa>) => void;
  updateUtilizador: (patch: Partial<Utilizador>) => void;

  // Trabalhadores
  createWorker: (data: Omit<Worker, "id" | "createdAt" | "updatedAt">) => Worker;
  updateWorker: (id: string, patch: Partial<Worker>) => void;
  setWorkerStatus: (id: string, status: Worker["status"]) => void;

  // Equipas
  createTeam: (data: Omit<Team, "id" | "createdAt" | "updatedAt">) => Team;
  updateTeam: (id: string, patch: Partial<Team>) => void;
  setTeamStatus: (id: string, status: Team["status"]) => void;

  // Atribuições
  createProjectAssignment: (data: Omit<ProjectAssignment, "id" | "createdAt" | "updatedAt" | "status">) => ProjectAssignment;
  updateProjectAssignment: (id: string, patch: Partial<ProjectAssignment>) => void;
  completeProjectAssignment: (id: string, endDate: string) => void;
  cancelProjectAssignment: (id: string) => void;

  // Presenças (Sprint 4.1)
  attendanceRecords: AttendanceRecord[];
  addAttendanceRecord: (data: Omit<AttendanceRecord, "id" | "createdAt" | "updatedAt">) => AttendanceRecord;
  updateAttendanceRecord: (id: string, patch: Partial<AttendanceRecord>) => void;
  deleteAttendanceRecord: (id: string) => void;
  getAttendanceRecordById: (id: string) => AttendanceRecord | undefined;
  bulkUpsertAttendanceRecords: (data: Omit<AttendanceRecord, "id" | "createdAt" | "updatedAt">[]) => { created: number; updated: number };

  // Materiais (Etapa 6.1)
  materials: Material[];
  materialCategories: MaterialCategory[];
  materialUnits: MaterialUnit[];

  addMaterial: (data: Omit<Material, "id" | "createdAt" | "updatedAt">) => Material;
  updateMaterial: (id: string, patch: Partial<Material>) => void;
  activateMaterial: (id: string) => void;
  deactivateMaterial: (id: string) => void;
  getMaterialById: (id: string) => Material | undefined;

  addMaterialCategory: (data: Omit<MaterialCategory, "id" | "createdAt" | "updatedAt">) => MaterialCategory;
  updateMaterialCategory: (id: string, patch: Partial<MaterialCategory>) => void;
  activateMaterialCategory: (id: string) => void;
  deactivateMaterialCategory: (id: string) => void;

  addMaterialUnit: (data: Omit<MaterialUnit, "id" | "createdAt" | "updatedAt">) => MaterialUnit;
  updateMaterialUnit: (id: string, patch: Partial<MaterialUnit>) => void;
  activateMaterialUnit: (id: string) => void;
  deactivateMaterialUnit: (id: string) => void;

  // Armazéns (Fase 3.6)
  warehouses: Warehouse[];
  addWarehouse: (data: CreateWarehouseInput) => Warehouse;
  updateWarehouse: (id: string, patch: UpdateWarehouseInput) => void;
  toggleWarehouseActive: (id: string) => void;
  setMainWarehouse: (id: string) => void;
  canDeleteWarehouse: (id: string) => { canDelete: boolean; reason?: string };
  deleteWarehouse: (id: string) => void;

  // Fornecedores (Etapa 6.2)
  suppliers: Supplier[];
  supplierMaterials: SupplierMaterial[];
  supplierPriceHistories: SupplierPriceHistory[];

  addSupplier: (data: Omit<Supplier, "id" | "createdAt" | "updatedAt">) => Supplier;
  updateSupplier: (id: string, patch: Partial<Supplier>) => void;
  activateSupplier: (id: string) => void;
  deactivateSupplier: (id: string) => void;
  getSupplierById: (id: string) => Supplier | undefined;

  addSupplierMaterial: (data: Omit<SupplierMaterial, "id" | "createdAt" | "updatedAt" | "priceUpdatedAt">) => SupplierMaterial;
  updateSupplierMaterial: (id: string, patch: Partial<SupplierMaterial>, reason?: string) => void;
  activateSupplierMaterial: (id: string) => void;
  deactivateSupplierMaterial: (id: string) => void;
  setPreferredSupplierForMaterial: (materialId: string, supplierMaterialId: string | undefined) => void;

  // Compras (Etapa 6.3)
  purchaseOrders: PurchaseOrder[];
  purchaseOrderItems: PurchaseOrderItem[];
  deliveries: Delivery[];
  deliveryItems: DeliveryItem[];
  stockMovements: StockMovement[];
  inventoryBalances: InventoryBalance[];

  // Pedidos de Compra
  addPurchaseOrder: (data: Omit<PurchaseOrder, "id" | "orderNumber" | "createdAt" | "updatedAt" | "subtotal" | "totalAmount" | "approvedAt" | "sentAt" | "cancelledAt">) => PurchaseOrder;
  updatePurchaseOrder: (id: string, patch: Partial<PurchaseOrder>) => void;
  approvePurchaseOrder: (id: string) => void;
  sendPurchaseOrder: (id: string) => void;
  cancelPurchaseOrder: (id: string) => void;
  getPurchaseOrderById: (id: string) => PurchaseOrder | undefined;
  preparePurchaseOrderDuplicate: (id: string) => PurchaseOrderDuplicateData | null;

  // Itens do Pedido
  addPurchaseOrderItem: (data: Omit<PurchaseOrderItem, "id" | "createdAt" | "updatedAt" | "orderedBaseQuantity" | "baseUnitPrice" | "lineTotal" | "receivedPurchaseQuantity" | "receivedBaseQuantity" | "remainingPurchaseQuantity">) => PurchaseOrderItem;
  updatePurchaseOrderItem: (id: string, patch: Partial<PurchaseOrderItem>) => void;
  removePurchaseOrderItem: (id: string) => void;

  // Entregas
  addDelivery: (data: Omit<Delivery, "id" | "deliveryNumber" | "createdAt" | "updatedAt" | "confirmedAt" | "cancelledAt">) => Delivery;
  updateDelivery: (id: string, patch: Partial<Delivery>) => void;
  confirmDelivery: (id: string) => void;
  cancelDelivery: (id: string) => void;

  // Itens de Entrega
  addDeliveryItem: (data: Omit<DeliveryItem, "id" | "createdAt" | "receivedBaseQuantity" | "actualBaseUnitCost" | "acceptedPurchaseQuantity">) => DeliveryItem;
  updateDeliveryItem: (id: string, patch: Partial<DeliveryItem>) => void;
  removeDeliveryItem: (id: string) => void;

  // Selectors de Inventário
  getInventoryBalance: (materialId: string, locationType: InventoryLocationType, projectId?: string) => InventoryBalance | undefined;
  getInventoryBalancesByMaterial: (materialId: string) => InventoryBalance[];
  getInventoryBalancesByProject: (projectId: string) => InventoryBalance[];
  getTotalStockByMaterial: (materialId: string) => number;
  getTotalInventoryValue: () => number;
  getInventoryValueByProject: (projectId: string) => number;
  getStockMovementsByMaterial: (materialId: string) => StockMovement[];
  getStockMovementsByDelivery: (deliveryId: string) => StockMovement[];

  // Utilidades
  resetDemoData: () => void;
};

const workersSeed: Worker[] = [
  {
    id: "w1",
    name: "Mateus Tembe",
    phone: "+258 84 999 1111",
    role: "Pedreiro",
    status: "active",
    hireDate: "2026-01-10",
    paymentType: "daily",
    dailyRate: 1200,
    createdAt: "2026-01-10T09:00:00.000Z",
    updatedAt: "2026-01-10T09:00:00.000Z",
  },
  {
    id: "w2",
    name: "Lucas Mondlane",
    phone: "+258 82 888 2222",
    role: "Servente",
    status: "active",
    hireDate: "2026-02-15",
    paymentType: "daily",
    dailyRate: 800,
    createdAt: "2026-02-15T09:00:00.000Z",
    updatedAt: "2026-02-15T09:00:00.000Z",
  },
  {
    id: "w3",
    name: "Jonas Machava",
    phone: "+258 87 777 3333",
    role: "Carpinteiro",
    status: "active",
    hireDate: "2026-03-20",
    paymentType: "hourly",
    hourlyRate: 150,
    createdAt: "2026-03-20T09:00:00.000Z",
    updatedAt: "2026-03-20T09:00:00.000Z",
  },
];

const teamsSeed: Team[] = [
  {
    id: "t1",
    name: "Equipa de Alvenaria A",
    description: "Equipa responsável pelo levantamento de paredes e alvenarias estruturais.",
    leaderWorkerId: "w1",
    workerIds: ["w1", "w2"],
    status: "active",
    createdAt: "2026-04-01T09:00:00.000Z",
    updatedAt: "2026-04-01T09:00:00.000Z",
  },
  {
    id: "t2",
    name: "Equipa de Acabamentos",
    description: "Equipa focada em revestimentos, pinturas e retoques finais.",
    leaderWorkerId: undefined,
    workerIds: ["w3"],
    status: "active",
    createdAt: "2026-05-15T09:00:00.000Z",
    updatedAt: "2026-05-15T09:00:00.000Z",
  }
];

const initialState = {
  clientes: clientesSeed,
  obras: obrasSeed,
  orcamentos: orcamentosSeed,
  pagamentos: pagamentosSeed,
  atividades: atividadesSeed,
  workers: workersSeed,
  teams: teamsSeed,
  projectAssignments: [],
  attendanceRecords: [],
  disabledProjectDays: [],
  materials: demoMaterialsSeed,
  materialCategories: initialMaterialCategories,
  materialUnits: initialMaterialUnits,
  suppliers: initialSuppliersSeed,
  supplierMaterials: initialSupplierMaterialsSeed,
  supplierPriceHistories: initialSupplierPriceHistoriesSeed,
  purchaseOrders: demoPurchaseOrdersSeed,
  purchaseOrderItems: demoPurchaseOrderItemsSeed,
  deliveries: demoDeliveriesSeed,
  deliveryItems: demoDeliveryItemsSeed,
  stockMovements: demoStockMovementsSeed,
  inventoryBalances: demoInventoryBalancesSeed,
  empresa: empresaSeed,
  utilizador: utilizadorSeed,
};

function nextOrcamentoNumero(orcs: Orcamento[]): string {
  const year = new Date().getFullYear();
  const prefix = `ORC-${year}-`;
  const nums = orcs
    .map((o) => o.numero)
    .filter((n) => n.startsWith(prefix))
    .map((n) => parseInt(n.slice(prefix.length), 10))
    .filter((n) => !isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
}

export const useObraMZStore = create<ObraMZState>()(
  persist(
    (set, get) => ({
      ...initialState,
      _hydrated: false,

      _addAtividade: (descricao, entidade, entidadeId) =>
        set((s) => ({
          atividades: [
            { id: uid(), data: nowIso(), descricao, entidade, entidadeId },
            ...s.atividades,
          ].slice(0, 100),
        })),

      _addHistorico: (orcId, descricao) =>
        set((s) => ({
          orcamentos: s.orcamentos.map((o) =>
            o.id === orcId
              ? { ...o, historico: [...o.historico, { id: uid(), data: nowIso(), descricao }] }
              : o,
          ),
        })),

      // ---- Clientes ----
      createCliente: (data) => {
        const cliente: Cliente = { ...data, id: uid(), criadoEm: nowIso() };
        set((s) => ({ clientes: [cliente, ...s.clientes] }));
        get()._addAtividade(`Cliente ${cliente.nome} criado`, "cliente", cliente.id);
        return cliente;
      },
      updateCliente: (id, patch) => {
        set((s) => ({ clientes: s.clientes.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
        const c = get().clientes.find((x) => x.id === id);
        if (c) get()._addAtividade(`Cliente ${c.nome} atualizado`, "cliente", id);
      },
      deleteCliente: (id) => {
        const c = get().clientes.find((x) => x.id === id);
        set((s) => ({ clientes: s.clientes.filter((x) => x.id !== id) }));
        if (c) get()._addAtividade(`Cliente ${c.nome} eliminado`, "cliente", id);
      },

      // ---- Obras ----
      createObra: (data) => {
        const obra: Obra = {
          ...data,
          id: uid(),
          criadoEm: nowIso(),
          eventos: data.eventos ?? [
            { id: uid(), data: data.inicio || new Date().toISOString().slice(0, 10), titulo: "Obra criada", tipo: "obra_criada", visibilidade: "publica" },
          ],
        };
        set((s) => ({ obras: [obra, ...s.obras] }));
        get()._addAtividade(`Obra ${obra.nome} criada`, "obra", obra.id);
        return obra;
      },
      updateObra: (id, patch) => {
        set((s) => ({ obras: s.obras.map((o) => (o.id === id ? { ...o, ...patch } : o)) }));
        const o = get().obras.find((x) => x.id === id);
        if (o) get()._addAtividade(`Obra ${o.nome} atualizada`, "obra", id);
      },
      updateObraProgresso: (id, progresso) => {
        const clamped = Math.min(100, Math.max(0, Math.round(progresso)));
        set((s) => ({
          obras: s.obras.map((o) =>
            o.id === id
              ? {
                  ...o,
                  progresso: clamped,
                  progressoAtualizadoEm: nowIso(),
                  eventos: [
                    ...o.eventos,
                    { id: uid(), data: new Date().toISOString().slice(0, 10), titulo: `Progresso atualizado para ${clamped}%`, tipo: "progresso", visibilidade: "publica" },
                  ],
                }
              : o,
          ),
        }));
      },
      updateObraEstado: (id, estado) => {
        set((s) => ({
          obras: s.obras.map((o) =>
            o.id === id
              ? { ...o, estado, progresso: estado === "concluida" ? 100 : o.progresso }
              : o,
          ),
        }));
        const o = get().obras.find((x) => x.id === id);
        if (o) get()._addAtividade(`Obra ${o.nome}: estado alterado`, "obra", id);
      },
      deleteObra: (id) => {
        const o = get().obras.find((x) => x.id === id);
        set((s) => ({ obras: s.obras.filter((x) => x.id !== id) }));
        if (o) get()._addAtividade(`Obra ${o.nome} eliminada`, "obra", id);
      },
      addObraEvento: (obraId, evento) => {
        set((s) => ({
          obras: s.obras.map((o) =>
            o.id === obraId ? { ...o, eventos: [...o.eventos, { ...evento, id: uid() }] } : o,
          ),
        }));
      },
      updateObraEvento: (obraId, evento) => {
        set((s) => ({
          obras: s.obras.map((o) =>
            o.id === obraId ? { ...o, eventos: o.eventos.map((e) => (e.id === evento.id ? evento : e)) } : o,
          ),
        }));
      },
      deleteObraEvento: (obraId, eventoId) => {
        set((s) => ({
          obras: s.obras.map((o) =>
            o.id === obraId ? { ...o, eventos: o.eventos.filter((e) => e.id !== eventoId) } : o,
          ),
        }));
      },

      addObraFoto: (obraId, foto) => {
        const id = uid();
        const now = nowIso();
        const tipo = foto.tipo || "normal";
        const finalFoto: ObraFoto = {
          ...foto,
          id,
          tipo,
          criadoEm: now,
          createdAt: now,
          projectId: obraId,
        };

        if (tipo === "antes") {
          finalFoto.beforeAfterGroupId = id;
        }

        set((s) => ({
          obras: s.obras.map((o) => {
            if (o.id !== obraId) return o;
            let fotos = o.fotos ?? [];

            if (tipo === "depois" && foto.beforeAfterGroupId) {
              const antesFotoId = foto.beforeAfterGroupId;
              const antesFoto = fotos.find((f) => f.id === antesFotoId);
              if (antesFoto && antesFoto.tipo === "antes" && antesFoto.id !== id) {
                fotos = fotos.map((f) =>
                  f.id === antesFotoId
                    ? { ...f, beforeAfterGroupId: antesFotoId }
                    : f
                );
              } else {
                finalFoto.beforeAfterGroupId = undefined;
              }
            }

            return { ...o, fotos: [...fotos, finalFoto] };
          }),
        }));
      },
      updateObraFoto: (obraId, fotoId, patch) => {
        set((s) => ({
          obras: s.obras.map((o) => {
            if (o.id !== obraId) return o;
            let fotos = o.fotos ?? [];
            const current = fotos.find((f) => f.id === fotoId);
            if (!current) return o;

            const merged = { ...current, ...patch };

            if (patch.tipo && patch.tipo !== current.tipo) {
              if (patch.tipo === "antes") {
                merged.beforeAfterGroupId = fotoId;
              } else if (patch.tipo === "normal") {
                merged.beforeAfterGroupId = undefined;
              }
            }

            if (merged.tipo === "depois") {
              if (merged.beforeAfterGroupId) {
                const antesFotoId = merged.beforeAfterGroupId;
                const antesFoto = fotos.find((f) => f.id === antesFotoId);
                if (antesFoto && antesFoto.tipo === "antes" && antesFotoId !== fotoId) {
                  fotos = fotos.map((f) =>
                    f.id === antesFotoId
                      ? { ...f, beforeAfterGroupId: antesFotoId }
                      : f
                  );
                } else {
                  merged.beforeAfterGroupId = undefined;
                }
              }
            }

            if (current.tipo === "antes" && merged.tipo !== "antes") {
              fotos = fotos.map((f) =>
                f.beforeAfterGroupId === current.id && f.id !== fotoId
                  ? { ...f, beforeAfterGroupId: undefined }
                  : f
              );
            }

            fotos = fotos.map((f) => (f.id === fotoId ? merged : f));
            return { ...o, fotos };
          }),
        }));
      },
      deleteObraFoto: (obraId, fotoId) => {
        set((s) => ({
          obras: s.obras.map((o) => {
            if (o.id !== obraId) return o;
            let fotos = o.fotos ?? [];
            const fotoToDelete = fotos.find((f) => f.id === fotoId);
            if (!fotoToDelete) return o;

            const targetGroupId = fotoToDelete.beforeAfterGroupId;
            fotos = fotos.filter((f) => f.id !== fotoId);

            if (targetGroupId) {
              fotos = fotos.map((f) =>
                f.beforeAfterGroupId === targetGroupId
                  ? { ...f, beforeAfterGroupId: undefined }
                  : f
              );
            }

            return { ...o, fotos };
          }),
        }));
      },

      addObraFase: (obraId, fase) => {
        set((s) => ({
          obras: s.obras.map((o) => {
            if (o.id !== obraId) return o;
            const fases = o.fases ?? [];
            const ordem = fases.length ? Math.max(...fases.map((f) => f.ordem)) + 1 : 1;
            return { ...o, fases: [...fases, { ...fase, id: uid(), ordem }] };
          }),
        }));
      },
      updateObraFase: (obraId, faseId, patch) => {
        set((s) => ({
          obras: s.obras.map((o) => {
            if (o.id !== obraId) return o;
            return {
              ...o,
              fases: (o.fases ?? []).map((f) => {
                if (f.id !== faseId) return f;
                const merged = { ...f, ...patch };
                // sync progresso/estado convenience
                if (patch.estado === "concluida") merged.progresso = 100;
                if (patch.estado === "pendente" && merged.progresso === undefined) merged.progresso = 0;
                if (patch.progresso === 100) merged.estado = "concluida";
                else if (patch.progresso !== undefined && patch.progresso > 0 && merged.estado === "pendente") merged.estado = "em_andamento";
                return merged;
              }),
            };
          }),
        }));
      },
      deleteObraFase: (obraId, faseId) => {
        set((s) => ({
          obras: s.obras.map((o) =>
            o.id === obraId ? { ...o, fases: (o.fases ?? []).filter((f) => f.id !== faseId) } : o,
          ),
        }));
      },
      reorderObraFases: (obraId, faseId, direcao) => {
        set((s) => ({
          obras: s.obras.map((o) => {
            if (o.id !== obraId) return o;
            const fases = [...(o.fases ?? [])].sort((a, b) => a.ordem - b.ordem);
            const idx = fases.findIndex((f) => f.id === faseId);
            if (idx === -1) return o;
            const target = direcao === "cima" ? idx - 1 : idx + 1;
            if (target < 0 || target >= fases.length) return o;
            [fases[idx], fases[target]] = [fases[target]!, fases[idx]!];
            return { ...o, fases: fases.map((f, i) => ({ ...f, ordem: i + 1 })) };
          }),
        }));
      },
      aplicarProgressoFases: (obraId) => {
        const obra = get().obras.find((o) => o.id === obraId);
        if (!obra || !obra.fases || obra.fases.length === 0) return;
        const media = Math.round(
          obra.fases.reduce((s, f) => s + Math.min(100, Math.max(0, f.progresso ?? 0)), 0) / obra.fases.length,
        );
        get().updateObraProgresso(obraId, media);
      },


      // ---- Orçamentos ----
      createOrcamento: (data) => {
        const numero = data.numero || nextOrcamentoNumero(get().orcamentos);
        const orc: Orcamento = {
          ...data,
          numero,
          id: uid(),
          criadoEm: nowIso(),
          atualizadoEm: nowIso(),
          historico: [{ id: uid(), data: nowIso(), descricao: "Orçamento criado" }],
        };
        set((s) => ({ orcamentos: [orc, ...s.orcamentos] }));
        get()._addAtividade(`Orçamento ${orc.numero} criado`, "orcamento", orc.id);
        return orc;
      },
      updateOrcamento: (id, patch) => {
        set((s) => ({
          orcamentos: s.orcamentos.map((o) =>
            o.id === id ? { ...o, ...patch, atualizadoEm: nowIso() } : o,
          ),
        }));
        get()._addHistorico(id, "Orçamento atualizado");
        const o = get().orcamentos.find((x) => x.id === id);
        if (o) get()._addAtividade(`Orçamento ${o.numero} atualizado`, "orcamento", id);
      },
      updateOrcamentoEstado: (id, estado) => {
        set((s) => ({
          orcamentos: s.orcamentos.map((o) =>
            o.id === id ? { ...o, estado, atualizadoEm: nowIso() } : o,
          ),
        }));
        const o = get().orcamentos.find((x) => x.id === id);
        get()._addHistorico(id, `Estado alterado para ${estado}`);
        if (o) get()._addAtividade(`Orçamento ${o.numero}: estado alterado para ${estado}`, "orcamento", id);
      },
      duplicateOrcamento: (id) => {
        const orig = get().orcamentos.find((x) => x.id === id);
        if (!orig) return null;
        const hoje = new Date();
        const validade = new Date(hoje);
        validade.setDate(hoje.getDate() + 30);
        const novo: Orcamento = {
          ...orig,
          id: uid(),
          numero: nextOrcamentoNumero(get().orcamentos),
          estado: "rascunho",
          emissao: hoje.toISOString().slice(0, 10),
          validade: validade.toISOString().slice(0, 10),
          itens: orig.itens.map((i) => ({ ...i, id: uid() })),
          historico: [{ id: uid(), data: nowIso(), descricao: `Duplicado de ${orig.numero}` }],
          criadoEm: nowIso(),
          atualizadoEm: nowIso(),
        };
        set((s) => ({ orcamentos: [novo, ...s.orcamentos] }));
        get()._addAtividade(`Orçamento ${novo.numero} duplicado de ${orig.numero}`, "orcamento", novo.id);
        return novo;
      },
      deleteOrcamento: (id) => {
        const o = get().orcamentos.find((x) => x.id === id);
        set((s) => ({ orcamentos: s.orcamentos.filter((x) => x.id !== id) }));
        if (o) get()._addAtividade(`Orçamento ${o.numero} eliminado`, "orcamento", id);
      },

      // ---- Pagamentos ----
      createPagamento: (data) => {
        const pag: Pagamento = { ...data, id: uid(), criadoEm: nowIso() };
        set((s) => ({ pagamentos: [pag, ...s.pagamentos] }));
        const cli = get().clientes.find((c) => c.id === pag.clienteId);
        get()._addAtividade(`Pagamento de ${pag.valor.toLocaleString("pt-PT")} MZN registado${cli ? ` (${cli.nome})` : ""}`, "pagamento", pag.id);
        if (pag.obraId) {
          const obra = get().obras.find((o) => o.id === pag.obraId);
          if (obra) {
            get().addObraEvento(pag.obraId, {
              data: pag.data,
              titulo: `Pagamento recebido: ${pag.valor.toLocaleString("pt-PT")} MZN`,
              descricao: pag.referencia,
              tipo: "pagamento",
              visibilidade: "publica",
            });
          }
        }
        return pag;
      },
      updatePagamento: (id, patch) => {
        set((s) => ({ pagamentos: s.pagamentos.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
        get()._addAtividade(`Pagamento atualizado`, "pagamento", id);
      },
      deletePagamento: (id) => {
        set((s) => ({ pagamentos: s.pagamentos.filter((p) => p.id !== id) }));
        get()._addAtividade(`Pagamento eliminado`, "pagamento", id);
      },

      updateEmpresa: (patch) => set((s) => ({ empresa: { ...s.empresa, ...patch } })),
      updateUtilizador: (patch) => set((s) => ({ utilizador: { ...s.utilizador, ...patch } })),

      // ---- Trabalhadores ----
      createWorker: (data) => {
        const worker: Worker = {
          ...data,
          id: uid(),
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        set((s) => ({ workers: [worker, ...(s.workers || [])] }));
        get()._addAtividade(`Trabalhador ${worker.name} registado`, "obra", worker.id);
        return worker;
      },
      updateWorker: (id, patch) => {
        set((s) => ({
          workers: (s.workers || []).map((w) =>
            w.id === id ? { ...w, ...patch, updatedAt: nowIso() } : w
          ),
        }));
        const w = get().workers?.find((x) => x.id === id);
        if (w) get()._addAtividade(`Trabalhador ${w.name} atualizado`, "obra", id);
      },
      setWorkerStatus: (id, status) => {
        set((s) => ({
          workers: (s.workers || []).map((w) =>
            w.id === id ? { ...w, status, updatedAt: nowIso() } : w
          ),
        }));
        const w = get().workers?.find((x) => x.id === id);
        if (w) {
          const accao = status === "active" ? "ativado" : "desativado";
          get()._addAtividade(`Trabalhador ${w.name} ${accao}`, "obra", id);
        }
      },

      // ---- Equipas ----
      createTeam: (data) => {
        const team: Team = {
          ...data,
          id: uid(),
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        set((s) => ({ teams: [team, ...(s.teams || [])] }));
        get()._addAtividade(`Equipa ${team.name} criada`, "obra", team.id);
        return team;
      },
      updateTeam: (id, patch) => {
        set((s) => ({
          teams: (s.teams || []).map((t) =>
            t.id === id ? { ...t, ...patch, updatedAt: nowIso() } : t
          ),
        }));
        const t = get().teams?.find((x) => x.id === id);
        if (t) get()._addAtividade(`Equipa ${t.name} atualizada`, "obra", id);
      },
      setTeamStatus: (id, status) => {
        set((s) => ({
          teams: (s.teams || []).map((t) =>
            t.id === id ? { ...t, status, updatedAt: nowIso() } : t
          ),
        }));
        const t = get().teams?.find((x) => x.id === id);
        if (t) {
          const accao = status === "active" ? "ativada" : "desativada";
          get()._addAtividade(`Equipa ${t.name} ${accao}`, "obra", id);
        }
      },

      // ---- Atribuições ----
      createProjectAssignment: (data) => {
        if (!data.assignmentType) {
          throw new Error("O tipo de atribuição (assignmentType) é obrigatório.");
        }

        let assignedWorkerIds: string[] | undefined = undefined;

        if (data.assignmentType === "worker") {
          if (!data.workerId) throw new Error("workerId é obrigatório para atribuições individuais.");
          const w = get().workers?.find((x) => x.id === data.workerId);
          if (!w || w.status !== "active") throw new Error("Trabalhador não encontrado ou inativo.");

          data.teamId = undefined;
          data.assignedWorkerIds = undefined;
        } else if (data.assignmentType === "team") {
          if (!data.teamId) throw new Error("teamId é obrigatório para atribuições de equipas.");
          const t = get().teams?.find((x) => x.id === data.teamId);
          if (!t || t.status !== "active") throw new Error("Equipa não encontrada ou inativa.");

          data.workerId = undefined;
          const activeMembers = get().workers
            .filter((w) => w.status === "active" && t.workerIds.includes(w.id))
            .map((w) => w.id);
          assignedWorkerIds = Array.from(new Set(activeMembers));
        }

        const assignment: ProjectAssignment = {
          ...data,
          assignedWorkerIds,
          id: uid(),
          status: "active",
          createdAt: nowIso(),
          updatedAt: nowIso(),
        } as ProjectAssignment;

        set((s) => ({ projectAssignments: [assignment, ...(s.projectAssignments || [])] }));

        if (data.assignmentType === "team" && data.teamId) {
          const t = get().teams?.find((x) => x.id === data.teamId);
          const o = get().obras?.find((x) => x.id === data.projectId);
          if (t && o) {
            get()._addAtividade(`Equipa ${t.name} atribuída à obra ${o.nome}`, "obra", o.id);
          }
        } else {
          const w = get().workers?.find((x) => x.id === data.workerId);
          const o = get().obras?.find((x) => x.id === data.projectId);
          if (w && o) {
            get()._addAtividade(`Trabalhador ${w.name} atribuído à obra ${o.nome}`, "obra", o.id);
          }
        }
        return assignment;
      },
      updateProjectAssignment: (id, patch) => {
        set((s) => ({
          projectAssignments: (s.projectAssignments || []).map((a) => {
            if (a.id === id) {
              // Impedir mudança de tipo de atribuição
              if (patch.assignmentType && patch.assignmentType !== a.assignmentType) {
                console.error("Não é permitido alterar o tipo de atribuição de uma alocação existente.");
                return a;
              }

              // Bloquear alteração de beneficiário em atribuições históricas (concluídas ou canceladas)
              if (a.status !== "active") {
                const hasStructuralChange =
                  "assignmentType" in patch ||
                  "workerId" in patch ||
                  "teamId" in patch ||
                  "assignedWorkerIds" in patch;

                if (hasStructuralChange) {
                  return a;
                }
              }

              const updated = { ...a, ...patch, updatedAt: nowIso() };

              // Se mudou o teamId, recalcular o snapshot
              if (updated.assignmentType === "team" && patch.teamId && patch.teamId !== a.teamId) {
                const team = s.teams?.find((t) => t.id === patch.teamId);
                if (team) {
                  const activeMembers = s.workers
                    .filter((w) => w.status === "active" && team.workerIds.includes(w.id))
                    .map((w) => w.id);
                  updated.assignedWorkerIds = Array.from(new Set(activeMembers));
                } else {
                  updated.assignedWorkerIds = [];
                }
              }

              // Garantir integridade de campos com base no tipo
              if (updated.assignmentType === "worker") {
                updated.teamId = undefined;
                updated.assignedWorkerIds = undefined;
              } else if (updated.assignmentType === "team") {
                updated.workerId = undefined;
                if (!updated.assignedWorkerIds) {
                  updated.assignedWorkerIds = [];
                }
              }

              return updated;
            }
            return a;
          }),
        }));

        const a = get().projectAssignments?.find((x) => x.id === id);
        if (a) {
          const o = get().obras?.find((x) => x.id === a.projectId);
          if (o) {
            if (a.assignmentType === "team") {
              const t = get().teams?.find((x) => x.id === a.teamId);
              if (t) {
                get()._addAtividade(`Atribuição da equipa ${t.name} em ${o.nome} atualizada`, "obra", o.id);
              }
            } else {
              const w = get().workers?.find((x) => x.id === a.workerId);
              if (w) {
                get()._addAtividade(`Atribuição de ${w.name} em ${o.nome} atualizada`, "obra", o.id);
              }
            }
          }
        }
      },
      completeProjectAssignment: (id, endDate) => {
        set((s) => ({
          projectAssignments: (s.projectAssignments || []).map((a) =>
            a.id === id ? { ...a, status: "completed", endDate, updatedAt: nowIso() } : a
          ),
        }));

        const a = get().projectAssignments?.find((x) => x.id === id);
        if (a) {
          const w = get().workers?.find((x) => x.id === a.workerId);
          const o = get().obras?.find((x) => x.id === a.projectId);
          if (w && o) {
            get()._addAtividade(`Atribuição de ${w.name} em ${o.nome} concluída`, "obra", o.id);
          }
        }
      },
      cancelProjectAssignment: (id) => {
        set((s) => ({
          projectAssignments: (s.projectAssignments || []).map((a) =>
            a.id === id ? { ...a, status: "cancelled", updatedAt: nowIso() } : a
          ),
        }));

        const a = get().projectAssignments?.find((x) => x.id === id);
        if (a) {
          const w = get().workers?.find((x) => x.id === a.workerId);
          const o = get().obras?.find((x) => x.id === a.projectId);
          if (w && o) {
            get()._addAtividade(`Atribuição de ${w.name} em ${o.nome} cancelada`, "obra", o.id);
          }
        }
      },

      // ---- Presenças ----
      addAttendanceRecord: (data) => {
        // 1. Validar duplicações na store
        const exists = (get().attendanceRecords || []).some(
          (r) => r.workerId === data.workerId && r.projectId === data.projectId && r.date === data.date
        );
        if (exists) {
          throw new Error("Já existe um registo de presença para este trabalhador nesta obra e data.");
        }

        // 2. Validar referências
        const worker = get().workers?.find((w) => w.id === data.workerId);
        if (!worker) throw new Error("Trabalhador não encontrado.");
        const obra = get().obras?.find((o) => o.id === data.projectId);
        if (!obra) throw new Error("Obra não encontrada.");
        if (data.phaseId) {
          const faseExists = obra.fases?.some((f) => f.id === data.phaseId);
          if (!faseExists) throw new Error("A fase selecionada não pertence à obra.");
        }

        // 3. Trabalhador ativo
        if (worker.status !== "active") {
          throw new Error("Não é possível registar presenças para trabalhadores inativos.");
        }

        // 4. Obra ativa (não concluída ou cancelada)
        if (obra.estado === "concluida" || obra.estado === "cancelada") {
          throw new Error("Não é possível registar presenças para obras concluídas ou canceladas.");
        }

        const record: AttendanceRecord = {
          ...data,
          id: uid(),
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };

        set((s) => ({
          attendanceRecords: [record, ...(s.attendanceRecords || [])],
        }));

        get()._addAtividade(`Presença de ${worker.name} registada em ${obra.nome}`, "obra", obra.id);
        return record;
      },
      updateAttendanceRecord: (id, patch) => {
        set((s) => ({
          attendanceRecords: (s.attendanceRecords || []).map((r) => {
            if (r.id === id) {
              const updated = { ...r, ...patch, updatedAt: nowIso() };

              // Limpar campos de horas se o estado for ausente ou falta justificada
              if (updated.status === "absent" || updated.status === "justified_absence") {
                updated.checkInTime = undefined;
                updated.checkOutTime = undefined;
                updated.breakMinutes = undefined;
                updated.workedMinutes = undefined;
                updated.overtimeMinutes = undefined;
              }

              // Validar duplicações na store ao editar
              const exists = (s.attendanceRecords || []).some(
                (other) =>
                  other.id !== id &&
                  other.workerId === updated.workerId &&
                  other.projectId === updated.projectId &&
                  other.date === updated.date
              );
              if (exists) {
                throw new Error("Já existe um registo de presença para este trabalhador nesta obra e data.");
              }

              // Validar referências
              const worker = s.workers?.find((w) => w.id === updated.workerId);
              if (!worker) throw new Error("Trabalhador não encontrado.");
              const obra = s.obras?.find((o) => o.id === updated.projectId);
              if (!obra) throw new Error("Obra não encontrada.");
              if (updated.phaseId) {
                const faseExists = obra.fases?.some((f) => f.id === updated.phaseId);
                if (!faseExists) throw new Error("A fase selecionada não pertence à obra.");
              }

              // Trabalhador ativo
              if (patch.workerId && worker.status !== "active") {
                throw new Error("Não é possível associar presenças a trabalhadores inativos.");
              }

              return updated;
            }
            return r;
          }),
        }));
      },
      deleteAttendanceRecord: (id) => {
        const r = get().attendanceRecords?.find((x) => x.id === id);
        set((s) => ({
          attendanceRecords: (s.attendanceRecords || []).filter((x) => x.id !== id),
        }));
        if (r) {
          const w = get().workers?.find((x) => x.id === r.workerId);
          if (w) get()._addAtividade(`Presença de ${w.name} eliminada`, "obra", r.projectId);
        }
      },
      getAttendanceRecordById: (id) => {
        return get().attendanceRecords?.find((r) => r.id === id);
      },
      bulkUpsertAttendanceRecords: (payloads) => {
        let created = 0;
        let updated = 0;

        const now = nowIso();
        const currentRecords = get().attendanceRecords || [];
        const nextRecords = [...currentRecords];

        payloads.forEach((payload) => {
          // Validar referências
          const worker = get().workers?.find((w) => w.id === payload.workerId);
          if (!worker) throw new Error(`Trabalhador ${payload.workerId} não encontrado.`);
          const obra = get().obras?.find((o) => o.id === payload.projectId);
          if (!obra) throw new Error(`Obra ${payload.projectId} não encontrada.`);

          if (worker.status !== "active") {
            throw new Error(`Não é possível registar presenças para o trabalhador inativo ${worker.name}.`);
          }
          if (obra.estado === "concluida" || obra.estado === "cancelada") {
            throw new Error(`Não é possível registar presenças para a obra concluída ou cancelada ${obra.nome}.`);
          }

          const idx = nextRecords.findIndex(
            (r) => r.workerId === payload.workerId && r.projectId === payload.projectId && r.date === payload.date
          );

          // Sanitizar payloads de ausência para não guardar horas
          const targetPayload = { ...payload };
          if (targetPayload.status === "absent" || targetPayload.status === "justified_absence") {
            targetPayload.checkInTime = undefined;
            targetPayload.checkOutTime = undefined;
            targetPayload.breakMinutes = undefined;
            targetPayload.workedMinutes = undefined;
            targetPayload.overtimeMinutes = undefined;
          }

          if (idx > -1) {
            const existing = nextRecords[idx]!;
            const statusChanged = existing.status !== targetPayload.status;
            const notesChanged = (existing.notes || "") !== (targetPayload.notes || "");

            const checkInChanged = (existing.checkInTime || "") !== (targetPayload.checkInTime || "");
            const checkOutChanged = (existing.checkOutTime || "") !== (targetPayload.checkOutTime || "");
            const breakChanged = (existing.breakMinutes || 0) !== (targetPayload.breakMinutes || 0);
            const workedChanged = (existing.workedMinutes || 0) !== (targetPayload.workedMinutes || 0);
            const overtimeChanged = (existing.overtimeMinutes || 0) !== (targetPayload.overtimeMinutes || 0);

            if (
              statusChanged ||
              notesChanged ||
              checkInChanged ||
              checkOutChanged ||
              breakChanged ||
              workedChanged ||
              overtimeChanged
            ) {
              nextRecords[idx] = {
                ...existing,
                ...targetPayload,
                updatedAt: now,
              };
              updated++;
            }
          } else {
            const record: AttendanceRecord = {
              ...targetPayload,
              id: uid(),
              createdAt: now,
              updatedAt: now,
            };
            nextRecords.unshift(record);
            created++;
          }
        });

        if (created > 0 || updated > 0) {
          set({ attendanceRecords: nextRecords });
        }

        return { created, updated };
      },

      addAttendanceSchedule: (data) => {
        const currentSchedules = get().attendanceSchedules || [];
        const validation = validateScheduleOverlap(data, currentSchedules);
        if (!validation.valid) {
          throw new Error("Já existe uma escala de presença ativa para este trabalhador nesta obra no período selecionado.");
        }

        const now = nowIso();
        const schedule: AttendanceSchedule = {
          ...data,
          id: uid(),
          workingDays: data.workingDays || ["monday", "tuesday", "wednesday", "thursday", "friday"],
          excludedDates: data.excludedDates || [],
          includedDates: data.includedDates || [],
          status: data.status || "active",
          createdAt: now,
          updatedAt: now,
        };

        set((s) => ({
          attendanceSchedules: [schedule, ...(s.attendanceSchedules || [])],
        }));

        return schedule;
      },

      updateAttendanceSchedule: (id, patch) => {
        const currentSchedules = get().attendanceSchedules || [];
        const existing = currentSchedules.find((s) => s.id === id);
        if (!existing) throw new Error("Escala de presença não encontrada.");

        const updatedCandidate = { ...existing, ...patch };
        const validation = validateScheduleOverlap(updatedCandidate, currentSchedules, id);
        if (!validation.valid) {
          throw new Error("Já existe uma escala de presença ativa para este trabalhador nesta obra no período selecionado.");
        }

        set((s) => ({
          attendanceSchedules: (s.attendanceSchedules || []).map((item) =>
            item.id === id ? { ...updatedCandidate, updatedAt: nowIso() } : item
          ),
        }));
      },

      deleteAttendanceSchedule: (id) => {
        set((s) => ({
          attendanceSchedules: (s.attendanceSchedules || []).filter((item) => item.id !== id),
        }));
      },

      getAttendanceSchedulesByProject: (projectId) => {
        return (get().attendanceSchedules || []).filter(
          (s) => s.projectId === projectId && s.status === "active"
        );
      },

      bulkAddTeamAttendanceSchedules: (teamId, projectId, scheduleData) => {
        const team = get().teams?.find((t) => t.id === teamId);
        if (!team) throw new Error("Equipa não encontrada.");

        const activeWorkers = (get().workers || []).filter(
          (w) => w.status === "active" && team.workerIds.includes(w.id)
        );

        if (activeWorkers.length === 0) {
          throw new Error("Esta equipa não possui trabalhadores ativos para criar escalas.");
        }

        const currentSchedules = get().attendanceSchedules || [];
        const conflictingWorkers: string[] = [];

        for (const w of activeWorkers) {
          const candidate = {
            ...scheduleData,
            projectId,
            workerId: w.id,
            teamId,
          };
          const validation = validateScheduleOverlap(candidate, currentSchedules);
          if (!validation.valid) {
            conflictingWorkers.push(w.name);
          }
        }

        if (conflictingWorkers.length > 0) {
          throw new Error(
            `Conflito de escala detetado para os seguintes trabalhadores: ${conflictingWorkers.join(", ")}. Nenhuma escala foi criada.`
          );
        }

        const now = nowIso();
        const newSchedules: AttendanceSchedule[] = activeWorkers.map((w) => ({
          ...scheduleData,
          id: uid(),
          projectId,
          workerId: w.id,
          teamId,
          workingDays: scheduleData.workingDays || ["monday", "tuesday", "wednesday", "thursday", "friday"],
          excludedDates: scheduleData.excludedDates || [],
          includedDates: scheduleData.includedDates || [],
          status: scheduleData.status || "active",
          createdAt: now,
          updatedAt: now,
        }));

        set((s) => ({
          attendanceSchedules: [...newSchedules, ...(s.attendanceSchedules || [])],
        }));

        return newSchedules;
      },

      disableProjectDay: (projectId, date, reason, notes) => {
        const existing = (get().disabledProjectDays || []).filter(
          (d) => !(d.projectId === projectId && d.date === date)
        );
        const record: DisabledDayRecord = {
          id: uid(),
          projectId,
          date,
          reason,
          notes: notes?.trim() || undefined,
          createdAt: nowIso(),
        };
        set({ disabledProjectDays: [record, ...existing] });
        return record;
      },

      enableProjectDay: (projectId, date) => {
        set((s) => ({
          disabledProjectDays: (s.disabledProjectDays || []).filter(
            (d) => !(d.projectId === projectId && d.date === date)
          ),
        }));
      },

      // ---- Materiais (Etapa 6.1) ----
      addMaterial: (data) => {
        const err = validateMaterialInput(data, undefined, get().materials || []);
        if (err) throw new Error(err);

        const now = nowIso();
        const material: Material = {
          ...data,
          id: uid(),
          name: data.name.trim(),
          internalCode: data.internalCode?.trim() || undefined,
          sku: data.sku?.trim() || undefined,
          categoryId: data.categoryId,
          unitId: data.unitId,
          description: data.description?.trim() || undefined,
          referencePrice: data.referencePrice !== undefined ? Math.max(0, data.referencePrice) : undefined,
          averagePrice: data.averagePrice !== undefined ? Math.max(0, data.averagePrice) : undefined,
          currency: data.currency?.trim() || "MZN",
          minimumStock: data.minimumStock !== undefined ? Math.max(0, data.minimumStock) : undefined,
          preferredBrand: data.preferredBrand?.trim() || undefined,
          specifications: data.specifications?.trim() || undefined,
          imageUrl: data.imageUrl?.trim() || undefined,
          status: data.status || "active",
          notes: data.notes?.trim() || undefined,
          createdAt: now,
          updatedAt: now,
        };

        set((s) => ({ materials: [material, ...(s.materials || [])] }));
        get()._addAtividade(`Material ${material.name} criado no catálogo`, "obra", material.id);
        return material;
      },

      updateMaterial: (id, patch) => {
        const existing = (get().materials || []).find((m) => m.id === id);
        if (!existing) throw new Error("Material não encontrado.");

        const candidate = { ...existing, ...patch };
        const err = validateMaterialInput(candidate, id, get().materials || []);
        if (err) throw new Error(err);

        const updated: Material = {
          ...candidate,
          name: candidate.name.trim(),
          internalCode: candidate.internalCode?.trim() || undefined,
          sku: candidate.sku?.trim() || undefined,
          description: candidate.description?.trim() || undefined,
          referencePrice: candidate.referencePrice !== undefined ? Math.max(0, candidate.referencePrice) : undefined,
          averagePrice: candidate.averagePrice !== undefined ? Math.max(0, candidate.averagePrice) : undefined,
          currency: candidate.currency?.trim() || "MZN",
          minimumStock: candidate.minimumStock !== undefined ? Math.max(0, candidate.minimumStock) : undefined,
          preferredBrand: candidate.preferredBrand?.trim() || undefined,
          specifications: candidate.specifications?.trim() || undefined,
          imageUrl: candidate.imageUrl?.trim() || undefined,
          notes: candidate.notes?.trim() || undefined,
          updatedAt: nowIso(),
        };

        set((s) => ({
          materials: (s.materials || []).map((m) => (m.id === id ? updated : m)),
        }));
      },

      activateMaterial: (id) => {
        set((s) => ({
          materials: (s.materials || []).map((m) => (m.id === id ? { ...m, status: "active", updatedAt: nowIso() } : m)),
        }));
      },

      deactivateMaterial: (id) => {
        set((s) => ({
          materials: (s.materials || []).map((m) => (m.id === id ? { ...m, status: "inactive", updatedAt: nowIso() } : m)),
        }));
      },

      getMaterialById: (id) => {
        return (get().materials || []).find((m) => m.id === id);
      },

      // ---- Categorias de Materiais ----
      addMaterialCategory: (data) => {
        const err = validateCategoryInput(data, undefined, get().materialCategories || []);
        if (err) throw new Error(err);

        const now = nowIso();
        const category: MaterialCategory = {
          ...data,
          id: uid(),
          name: data.name.trim(),
          description: data.description?.trim() || undefined,
          status: data.status || "active",
          createdAt: now,
          updatedAt: now,
        };

        set((s) => ({ materialCategories: [...(s.materialCategories || []), category] }));
        return category;
      },

      updateMaterialCategory: (id, patch) => {
        const existing = (get().materialCategories || []).find((c) => c.id === id);
        if (!existing) throw new Error("Categoria não encontrada.");

        const candidate = { ...existing, ...patch };
        const err = validateCategoryInput(candidate, id, get().materialCategories || []);
        if (err) throw new Error(err);

        const updated: MaterialCategory = {
          ...candidate,
          name: candidate.name.trim(),
          description: candidate.description?.trim() || undefined,
          updatedAt: nowIso(),
        };

        set((s) => ({
          materialCategories: (s.materialCategories || []).map((c) => (c.id === id ? updated : c)),
        }));
      },

      activateMaterialCategory: (id) => {
        set((s) => ({
          materialCategories: (s.materialCategories || []).map((c) => (c.id === id ? { ...c, status: "active", updatedAt: nowIso() } : c)),
        }));
      },

      deactivateMaterialCategory: (id) => {
        set((s) => ({
          materialCategories: (s.materialCategories || []).map((c) => (c.id === id ? { ...c, status: "inactive", updatedAt: nowIso() } : c)),
        }));
      },

      // ---- Unidades de Medida ----
      addMaterialUnit: (data) => {
        const err = validateUnitInput(data, undefined, get().materialUnits || []);
        if (err) throw new Error(err);

        const now = nowIso();
        const unit: MaterialUnit = {
          ...data,
          id: uid(),
          name: data.name.trim(),
          symbol: data.symbol.trim(),
          type: data.type?.trim() || undefined,
          precision: data.precision !== undefined ? Math.max(0, data.precision) : 2,
          status: data.status || "active",
          createdAt: now,
          updatedAt: now,
        };

        set((s) => ({ materialUnits: [...(s.materialUnits || []), unit] }));
        return unit;
      },

      updateMaterialUnit: (id, patch) => {
        const existing = (get().materialUnits || []).find((u) => u.id === id);
        if (!existing) throw new Error("Unidade não encontrada.");

        const candidate = { ...existing, ...patch };
        const err = validateUnitInput(candidate, id, get().materialUnits || []);
        if (err) throw new Error(err);

        const updated: MaterialUnit = {
          ...candidate,
          name: candidate.name.trim(),
          symbol: candidate.symbol.trim(),
          updatedAt: nowIso(),
        };

        set((s) => ({
          materialUnits: (s.materialUnits || []).map((u) => (u.id === id ? updated : u)),
        }));
      },

      activateMaterialUnit: (id) => {
        set((s) => ({
          materialUnits: (s.materialUnits || []).map((u) => (u.id === id ? { ...u, status: "active", updatedAt: nowIso() } : u)),
        }));
      },

      deactivateMaterialUnit: (id) => {
        set((s) => ({
          materialUnits: (s.materialUnits || []).map((u) => (u.id === id ? { ...u, status: "inactive", updatedAt: nowIso() } : u)),
        }));
      },

      // ---- Armazéns (Fase 3.6) ----
      warehouses: DEFAULT_INITIAL_WAREHOUSES,
      addWarehouse: (data) => {
        const companyId = data.companyId || "COMP-1";
        const code = data.code.trim().toUpperCase();
        const name = data.name.trim();

        if (!code) throw new Error("O código do armazém é obrigatório.");
        if (!name) throw new Error("O nome do armazém é obrigatório.");

        const currentWarehouses = get().warehouses || DEFAULT_INITIAL_WAREHOUSES;
        if (currentWarehouses.some((w) => w.companyId === companyId && w.code.toUpperCase() === code)) {
          throw new Error(`Já existe um armazém com o código "${code}".`);
        }
        if (currentWarehouses.some((w) => w.companyId === companyId && w.name.toLowerCase() === name.toLowerCase())) {
          throw new Error(`Já existe um armazém com o nome "${name}".`);
        }

        const isMainWarehouse = !!data.isMainWarehouse || currentWarehouses.length === 0;
        const now = nowIso();
        const warehouse: Warehouse = {
          id: `WH-${uid()}`,
          companyId,
          code,
          name,
          address: data.address?.trim(),
          province: data.province?.trim(),
          city: data.city?.trim(),
          isMainWarehouse,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        };

        let updatedList = [...currentWarehouses];
        if (isMainWarehouse) {
          updatedList = updatedList.map((w) => ({ ...w, isMainWarehouse: false, updatedAt: now }));
        }

        set({ warehouses: [warehouse, ...updatedList] });
        get()._addAtividade(`Armazém ${warehouse.name} (${warehouse.code}) criado`, "obra", warehouse.id);
        return warehouse;
      },

      updateWarehouse: (id, patch) => {
        const currentWarehouses = get().warehouses || DEFAULT_INITIAL_WAREHOUSES;
        const existing = currentWarehouses.find((w) => w.id === id);
        if (!existing) throw new Error("Armazém não encontrado.");

        const now = nowIso();
        let updatedList = currentWarehouses.map((w) => {
          if (w.id !== id) return w;
          return {
            ...w,
            ...patch,
            code: patch.code ? patch.code.trim().toUpperCase() : w.code,
            name: patch.name ? patch.name.trim() : w.name,
            updatedAt: now,
          };
        });

        if (patch.isMainWarehouse) {
          updatedList = updatedList.map((w) => ({
            ...w,
            isMainWarehouse: w.id === id,
            updatedAt: now,
          }));
        }

        set({ warehouses: updatedList });
      },

      toggleWarehouseActive: (id) => {
        const currentWarehouses = get().warehouses || DEFAULT_INITIAL_WAREHOUSES;
        const target = currentWarehouses.find((w) => w.id === id);
        if (!target) throw new Error("Armazém não encontrado.");

        if (target.isActive && target.isMainWarehouse) {
          throw new Error("Não é possível desativar o Armazém Principal sem definir outro Armazém Principal primeiro.");
        }

        set({
          warehouses: currentWarehouses.map((w) =>
            w.id === id ? { ...w, isActive: !w.isActive, updatedAt: nowIso() } : w
          ),
        });
      },

      setMainWarehouse: (id) => {
        const currentWarehouses = get().warehouses || DEFAULT_INITIAL_WAREHOUSES;
        const target = currentWarehouses.find((w) => w.id === id);
        if (!target) throw new Error("Armazém não encontrado.");
        if (!target.isActive) throw new Error("Não é possível definir um armazém inativo como Armazém Principal.");

        set({
          warehouses: currentWarehouses.map((w) => ({
            ...w,
            isMainWarehouse: w.id === id,
            updatedAt: nowIso(),
          })),
        });
      },

      canDeleteWarehouse: (id) => {
        const s = get();
        const warehouse = (s.warehouses || []).find((w) => w.id === id);
        if (!warehouse) return { canDelete: true };

        const hasMovements = (s.stockMovements || []).some(
          (m) => m.destinationLocationType === "central_stock" || (m as any).warehouseId === id
        );
        const hasBalances = (s.inventoryBalances || []).some(
          (b) => b.locationType === "central_stock" && b.onHandQuantity > 0
        );
        const hasDeliveries = (s.deliveries || []).some(
          (d) => d.destinationType === "central_stock"
        );

        if (hasMovements || hasBalances || hasDeliveries) {
          return {
            canDelete: false,
            reason: `O armazém "${warehouse.name}" possui registos históricos ou saldos ativos de inventário. Desative o armazém em vez de eliminar.`,
          };
        }
        return { canDelete: true };
      },

      deleteWarehouse: (id) => {
        const check = get().canDeleteWarehouse(id);
        if (!check.canDelete) {
          throw new Error(check.reason);
        }
        set((s) => ({
          warehouses: (s.warehouses || []).filter((w) => w.id !== id),
        }));
      },

      // -------------------------------------------------------------------
      // Fornecedores (Etapa 6.2)
      // -------------------------------------------------------------------
      getSupplierById: (id) => (get().suppliers || []).find((s) => s.id === id),

      addSupplier: (data) => {
        const candidate: Partial<Supplier> = {
          ...data,
          status: data.status || "active",
          country: data.country || "Moçambique",
        };
        const err = validateSupplierInput(candidate, undefined, get().suppliers || []);
        if (err) throw new Error(err);

        const newSupplier: Supplier = {
          id: `supp-${uid()}`,
          name: candidate.name!.trim(),
          legalName: candidate.legalName?.trim(),
          nuit: candidate.nuit?.trim(),
          country: candidate.country!.trim(),
          province: candidate.province?.trim() || "",
          city: candidate.city!.trim(),
          address: candidate.address?.trim(),
          phone: candidate.phone!.trim(),
          secondaryPhone: candidate.secondaryPhone?.trim(),
          email: candidate.email?.trim(),
          contactPerson: candidate.contactPerson?.trim(),
          contactPersonPhone: candidate.contactPersonPhone?.trim(),
          rating: candidate.rating,
          paymentTermType: candidate.paymentTermType,
          paymentTermDays: candidate.paymentTermDays,
          paymentTermsNotes: candidate.paymentTermsNotes?.trim(),
          defaultLeadTimeDays: candidate.defaultLeadTimeDays,
          notes: candidate.notes?.trim(),
          status: candidate.status as "active" | "inactive",
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };

        set((s) => ({ suppliers: [newSupplier, ...(s.suppliers || [])] }));
        return newSupplier;
      },

      updateSupplier: (id, patch) => {
        const existing = (get().suppliers || []).find((s) => s.id === id);
        if (!existing) throw new Error("Fornecedor não encontrado.");

        const candidate = { ...existing, ...patch };
        const err = validateSupplierInput(candidate, id, get().suppliers || []);
        if (err) throw new Error(err);

        const updated: Supplier = {
          ...candidate,
          name: candidate.name.trim(),
          legalName: candidate.legalName?.trim(),
          nuit: candidate.nuit?.trim(),
          country: candidate.country.trim(),
          province: candidate.province?.trim() || "",
          city: candidate.city.trim(),
          address: candidate.address?.trim(),
          phone: candidate.phone.trim(),
          secondaryPhone: candidate.secondaryPhone?.trim(),
          email: candidate.email?.trim(),
          contactPerson: candidate.contactPerson?.trim(),
          contactPersonPhone: candidate.contactPersonPhone?.trim(),
          paymentTermsNotes: candidate.paymentTermsNotes?.trim(),
          notes: candidate.notes?.trim(),
          updatedAt: nowIso(),
        };

        set((s) => ({
          suppliers: (s.suppliers || []).map((sup) => (sup.id === id ? updated : sup)),
        }));
      },

      activateSupplier: (id) => {
        set((s) => ({
          suppliers: (s.suppliers || []).map((sup) => (sup.id === id ? { ...sup, status: "active", updatedAt: nowIso() } : sup)),
        }));
      },

      deactivateSupplier: (id) => {
        set((s) => ({
          suppliers: (s.suppliers || []).map((sup) => (sup.id === id ? { ...sup, status: "inactive", updatedAt: nowIso() } : sup)),
        }));
      },

      addSupplierMaterial: (data) => {
        const candidate: Partial<SupplierMaterial> = {
          ...data,
          status: data.status || "active",
          currency: data.currency || "MZN",
          isPreferred: !!data.isPreferred,
        };
        const err = validateSupplierMaterialInput(
          candidate,
          undefined,
          get().supplierMaterials || [],
          get().materials || [],
          get().materialUnits || [],
          get().suppliers || []
        );
        if (err) throw new Error(err);

        // Se for preferencial, desmarcar preferencial anterior deste mesmo material
        let currentRels = get().supplierMaterials || [];
        if (candidate.isPreferred) {
          currentRels = currentRels.map((r) =>
            r.materialId === candidate.materialId ? { ...r, isPreferred: false, updatedAt: nowIso() } : r
          );
        }

        const newRel: SupplierMaterial = {
          id: `supp-mat-${uid()}`,
          supplierId: candidate.supplierId!,
          materialId: candidate.materialId!,
          supplierCode: candidate.supplierCode?.trim(),
          brand: candidate.brand?.trim(),
          purchaseUnitId: candidate.purchaseUnitId!,
          conversionFactor: candidate.conversionFactor!,
          unitPrice: candidate.unitPrice!,
          currency: candidate.currency!,
          minimumOrderQuantity: candidate.minimumOrderQuantity,
          leadTimeDays: candidate.leadTimeDays,
          commercialConditions: candidate.commercialConditions?.trim(),
          priceUpdatedAt: nowIso(),
          isPreferred: !!candidate.isPreferred,
          status: candidate.status as "active" | "inactive",
          notes: candidate.notes?.trim(),
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };

        // Registar Snapshot Inicial no Histórico
        const historySnapshot: SupplierPriceHistory = {
          id: `sph-${uid()}`,
          supplierMaterialId: newRel.id,
          supplierId: newRel.supplierId,
          materialId: newRel.materialId,
          newUnitPrice: newRel.unitPrice,
          currency: newRel.currency,
          purchaseUnitId: newRel.purchaseUnitId,
          conversionFactor: newRel.conversionFactor,
          minimumOrderQuantity: newRel.minimumOrderQuantity,
          leadTimeDays: newRel.leadTimeDays,
          brand: newRel.brand,
          effectiveDate: nowIso(),
          reason: "Registo inicial de cotação comercial.",
          createdAt: nowIso(),
        };

        set((s) => ({
          supplierMaterials: [newRel, ...currentRels],
          supplierPriceHistories: [historySnapshot, ...(s.supplierPriceHistories || [])],
        }));

        return newRel;
      },

      updateSupplierMaterial: (id, patch, reason) => {
        const existing = (get().supplierMaterials || []).find((r) => r.id === id);
        if (!existing) throw new Error("Relação comercial não encontrada.");

        const candidate = { ...existing, ...patch };
        const err = validateSupplierMaterialInput(
          candidate,
          id,
          get().supplierMaterials || [],
          get().materials || [],
          get().materialUnits || [],
          get().suppliers || []
        );
        if (err) throw new Error(err);

        let currentRels = get().supplierMaterials || [];
        // Se for preferencial, desmarcar preferencial anterior deste mesmo material
        if (patch.isPreferred) {
          currentRels = currentRels.map((r) =>
            r.materialId === candidate.materialId && r.id !== id
              ? { ...r, isPreferred: false, updatedAt: nowIso() }
              : r
          );
        }

        const priceChanged = patch.unitPrice !== undefined && patch.unitPrice !== existing.unitPrice;
        const updated: SupplierMaterial = {
          ...candidate,
          supplierCode: candidate.supplierCode?.trim(),
          brand: candidate.brand?.trim(),
          commercialConditions: candidate.commercialConditions?.trim(),
          notes: candidate.notes?.trim(),
          priceUpdatedAt: priceChanged ? nowIso() : existing.priceUpdatedAt,
          updatedAt: nowIso(),
        };

        let newHistories = get().supplierPriceHistories || [];
        if (priceChanged) {
          const snapshot: SupplierPriceHistory = {
            id: `sph-${uid()}`,
            supplierMaterialId: updated.id,
            supplierId: updated.supplierId,
            materialId: updated.materialId,
            previousUnitPrice: existing.unitPrice,
            newUnitPrice: updated.unitPrice,
            currency: updated.currency,
            purchaseUnitId: updated.purchaseUnitId,
            conversionFactor: updated.conversionFactor,
            minimumOrderQuantity: updated.minimumOrderQuantity,
            leadTimeDays: updated.leadTimeDays,
            brand: updated.brand,
            effectiveDate: nowIso(),
            reason: reason || "Atualização de preço comercial pelo utilizador.",
            createdAt: nowIso(),
          };
          newHistories = [snapshot, ...newHistories];
        }

        set((s) => ({
          supplierMaterials: currentRels.map((r) => (r.id === id ? updated : r)),
          supplierPriceHistories: newHistories,
        }));
      },

      activateSupplierMaterial: (id) => {
        set((s) => ({
          supplierMaterials: (s.supplierMaterials || []).map((r) =>
            r.id === id ? { ...r, status: "active", updatedAt: nowIso() } : r
          ),
        }));
      },

      deactivateSupplierMaterial: (id) => {
        set((s) => ({
          supplierMaterials: (s.supplierMaterials || []).map((r) =>
            r.id === id ? { ...r, status: "inactive", isPreferred: false, updatedAt: nowIso() } : r
          ),
        }));
      },

      setPreferredSupplierForMaterial: (materialId, supplierMaterialId) => {
        set((s) => ({
          supplierMaterials: (s.supplierMaterials || []).map((r) => {
            if (r.materialId !== materialId) return r;
            if (supplierMaterialId && r.id === supplierMaterialId) {
              return { ...r, isPreferred: true, updatedAt: nowIso() };
            }
            return { ...r, isPreferred: false, updatedAt: nowIso() };
          }),
        }));
      },

      // ─────────────────────────────────────────────────────────────────
      // Compras (Etapa 6.3)
      // ─────────────────────────────────────────────────────────────────

      addPurchaseOrder: (data) => {
        const s = get();
        const err = validatePurchaseOrderInput(data, s.suppliers);
        if (err) throw new Error(err);
        const items = (s.purchaseOrderItems || []).filter(i => i.purchaseOrderId === "__pending__");
        const { subtotal, totalAmount } = calculateOrderTotals(items, data.discountAmount, data.taxAmount);
        const order: PurchaseOrder = {
          ...data,
          id: uid(),
          orderNumber: nextPurchaseOrderNumber(s.purchaseOrders || []),
          subtotal,
          totalAmount,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        set(s => ({ purchaseOrders: [...(s.purchaseOrders || []), order] }));
        return order;
      },

      updatePurchaseOrder: (id, patch) => {
        const s = get();
        const po = (s.purchaseOrders || []).find(o => o.id === id);
        if (!po) throw new Error("Pedido de compra não encontrado.");
        if (po.status !== "draft") throw new Error("Só é possível editar pedidos em rascunho.");
        const err = validatePurchaseOrderInput({ ...po, ...patch }, s.suppliers);
        if (err) throw new Error(err);
        set(s => ({
          purchaseOrders: (s.purchaseOrders || []).map(o =>
            o.id === id ? { ...o, ...patch, updatedAt: nowIso() } : o
          ),
        }));
      },

      approvePurchaseOrder: (id) => {
        const s = get();
        const po = (s.purchaseOrders || []).find(o => o.id === id);
        if (!po) throw new Error("Pedido de compra não encontrado.");
        if (po.status !== "draft" && po.status !== "pending_approval")
          throw new Error(`Não é possível aprovar um pedido no estado "${po.status}".`);
        set(s => ({
          purchaseOrders: (s.purchaseOrders || []).map(o =>
            o.id === id ? { ...o, status: "approved" as const, approvedAt: nowIso(), updatedAt: nowIso() } : o
          ),
        }));
      },

      sendPurchaseOrder: (id) => {
        const s = get();
        const po = (s.purchaseOrders || []).find(o => o.id === id);
        if (!po) throw new Error("Pedido de compra não encontrado.");
        if (po.status !== "approved")
          throw new Error(`Não é possível enviar um pedido no estado "${po.status}".`);
        set(s => ({
          purchaseOrders: (s.purchaseOrders || []).map(o =>
            o.id === id ? { ...o, status: "sent" as const, sentAt: nowIso(), updatedAt: nowIso() } : o
          ),
        }));
      },

      cancelPurchaseOrder: (id) => {
        const s = get();
        const po = (s.purchaseOrders || []).find(o => o.id === id);
        if (!po) throw new Error("Pedido de compra não encontrado.");
        const hasConfirmedDelivery = (s.deliveries || []).some(
          d => d.purchaseOrderId === id && d.status === "confirmed"
        );
        if (hasConfirmedDelivery)
          throw new Error("Não é possível cancelar um pedido com entregas já confirmadas.");
        const terminalStates = ["received", "cancelled"];
        if (terminalStates.includes(po.status))
          throw new Error(`Não é possível cancelar um pedido no estado "${po.status}".`);
        set(s => ({
          purchaseOrders: (s.purchaseOrders || []).map(o =>
            o.id === id ? { ...o, status: "cancelled" as const, cancelledAt: nowIso(), updatedAt: nowIso() } : o
          ),
        }));
      },

      getPurchaseOrderById: (id) =>
        (get().purchaseOrders || []).find(o => o.id === id),

      preparePurchaseOrderDuplicate: (id) => {
        const s = get();
        const po = (s.purchaseOrders || []).find(o => o.id === id);
        if (!po) return null;
        const items = (s.purchaseOrderItems || []).filter(i => i.purchaseOrderId === id);
        return {
          supplierId: po.supplierId,
          supplierReference: po.supplierReference,
          destinationType: po.destinationType,
          destinationProjectId: po.destinationProjectId,
          currency: po.currency,
          paymentTermType: po.paymentTermType,
          paymentTermDays: po.paymentTermDays,
          commercialConditions: po.commercialConditions,
          notes: po.notes,
          internalNotes: po.internalNotes,
          orderDate: new Date().toISOString().slice(0, 10),
          status: "draft" as const,
          items: items.map(item => ({
            materialId: item.materialId,
            supplierMaterialId: item.supplierMaterialId,
            descriptionSnapshot: item.descriptionSnapshot,
            brandSnapshot: item.brandSnapshot,
            purchaseUnitId: item.purchaseUnitId,
            purchaseUnitSymbolSnapshot: item.purchaseUnitSymbolSnapshot,
            baseUnitId: item.baseUnitId,
            baseUnitSymbolSnapshot: item.baseUnitSymbolSnapshot,
            conversionFactor: item.conversionFactor,
            orderedPurchaseQuantity: item.orderedPurchaseQuantity,
            unitPrice: item.unitPrice,
            notes: item.notes,
          })),
        };
      },

      // ── Itens do Pedido ──────────────────────────────────────────────

      addPurchaseOrderItem: (data) => {
        const s = get();
        const po = (s.purchaseOrders || []).find(o => o.id === data.purchaseOrderId);
        const err = validatePurchaseOrderItemInput(data, po?.status);
        if (err) throw new Error(err);
        const cf = data.conversionFactor;
        const item: PurchaseOrderItem = {
          ...data,
          id: uid(),
          orderedBaseQuantity: data.orderedPurchaseQuantity * cf,
          baseUnitPrice: cf > 0 ? data.unitPrice / cf : data.unitPrice,
          lineTotal: calculateItemLineTotal(data.orderedPurchaseQuantity, data.unitPrice, data.discountAmount, data.taxAmount),
          receivedPurchaseQuantity: 0,
          receivedBaseQuantity: 0,
          remainingPurchaseQuantity: data.orderedPurchaseQuantity,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        // Recalcular totais do PO
        const allItems = [...(s.purchaseOrderItems || []).filter(i => i.purchaseOrderId === data.purchaseOrderId), item];
        const { subtotal, totalAmount } = calculateOrderTotals(allItems, po?.discountAmount, po?.taxAmount);
        set(s => ({
          purchaseOrderItems: [...(s.purchaseOrderItems || []), item],
          purchaseOrders: (s.purchaseOrders || []).map(o =>
            o.id === data.purchaseOrderId ? { ...o, subtotal, totalAmount, updatedAt: nowIso() } : o
          ),
        }));
        return item;
      },

      updatePurchaseOrderItem: (id, patch) => {
        const s = get();
        const item = (s.purchaseOrderItems || []).find(i => i.id === id);
        if (!item) throw new Error("Item de pedido não encontrado.");
        const po = (s.purchaseOrders || []).find(o => o.id === item.purchaseOrderId);
        if (po?.status !== "draft") throw new Error("Itens só podem ser editados em pedidos em rascunho.");
        const cf = patch.conversionFactor ?? item.conversionFactor;
        const qty = patch.orderedPurchaseQuantity ?? item.orderedPurchaseQuantity;
        const price = patch.unitPrice ?? item.unitPrice;
        const updated: PurchaseOrderItem = {
          ...item,
          ...patch,
          orderedBaseQuantity: qty * cf,
          baseUnitPrice: cf > 0 ? price / cf : price,
          lineTotal: calculateItemLineTotal(qty, price, patch.discountAmount ?? item.discountAmount, patch.taxAmount ?? item.taxAmount),
          remainingPurchaseQuantity: qty - item.receivedPurchaseQuantity,
          updatedAt: nowIso(),
        };
        const allItems = (s.purchaseOrderItems || []).map(i => i.id === id ? updated : i).filter(i => i.purchaseOrderId === item.purchaseOrderId);
        const { subtotal, totalAmount } = calculateOrderTotals(allItems, po?.discountAmount, po?.taxAmount);
        set(s => ({
          purchaseOrderItems: (s.purchaseOrderItems || []).map(i => i.id === id ? updated : i),
          purchaseOrders: (s.purchaseOrders || []).map(o =>
            o.id === item.purchaseOrderId ? { ...o, subtotal, totalAmount, updatedAt: nowIso() } : o
          ),
        }));
      },

      removePurchaseOrderItem: (id) => {
        const s = get();
        const item = (s.purchaseOrderItems || []).find(i => i.id === id);
        if (!item) throw new Error("Item de pedido não encontrado.");
        const po = (s.purchaseOrders || []).find(o => o.id === item.purchaseOrderId);
        if (po?.status !== "draft") throw new Error("Itens só podem ser removidos em pedidos em rascunho.");
        const remaining = (s.purchaseOrderItems || []).filter(i => i.purchaseOrderId === item.purchaseOrderId && i.id !== id);
        if (remaining.length === 0) throw new Error("Não é possível remover o único item do pedido.");
        const { subtotal, totalAmount } = calculateOrderTotals(remaining, po?.discountAmount, po?.taxAmount);
        set(s => ({
          purchaseOrderItems: (s.purchaseOrderItems || []).filter(i => i.id !== id),
          purchaseOrders: (s.purchaseOrders || []).map(o =>
            o.id === item.purchaseOrderId ? { ...o, subtotal, totalAmount, updatedAt: nowIso() } : o
          ),
        }));
      },

      // ── Entregas ─────────────────────────────────────────────────────

      addDelivery: (data) => {
        const s = get();
        const err = validateDeliveryInput(data, s.purchaseOrders || [], s.deliveries || []);
        if (err) throw new Error(err);
        const delivery: Delivery = {
          ...data,
          id: uid(),
          deliveryNumber: nextDeliveryNumber(s.deliveries || []),
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        set(s => ({ deliveries: [...(s.deliveries || []), delivery] }));
        return delivery;
      },

      updateDelivery: (id, patch) => {
        const s = get();
        const del = (s.deliveries || []).find(d => d.id === id);
        if (!del) throw new Error("Entrega não encontrada.");
        if (del.status === "confirmed") throw new Error("Não é possível editar uma entrega já confirmada.");
        set(s => ({
          deliveries: (s.deliveries || []).map(d =>
            d.id === id ? { ...d, ...patch, updatedAt: nowIso() } : d
          ),
        }));
      },

      confirmDelivery: (id) => {
        // ──────────────────────────────────────────────────────────────
        // FASE 0 — Leitura (sem set)
        // ──────────────────────────────────────────────────────────────
        const s = get();
        const delivery = (s.deliveries || []).find(d => d.id === id);

        // ──────────────────────────────────────────────────────────────
        // FASE 1 — Validações (falha = throw; sem set)
        // ──────────────────────────────────────────────────────────────
        if (!delivery) throw new Error("Entrega não encontrada.");

        // 1.2 — Idempotência: entrega já confirmada → retorno silencioso
        if (delivery.status === "confirmed") return;

        // 1.3 — Entrega cancelada
        if (delivery.status === "cancelled")
          throw new Error("Não é possível confirmar uma entrega cancelada.");

        // 1.4 — PO existe
        const po = (s.purchaseOrders || []).find(o => o.id === delivery.purchaseOrderId);
        if (!po) throw new Error("Pedido de compra associado não encontrado.");

        // 1.5 — PO não está encerrado
        if (po.status === "cancelled" || po.status === "received")
          throw new Error(`O pedido de compra está no estado "${po.status}" e não aceita novas entregas.`);

        // 1.6 — Detetar movimentos orfãos (draft com movimentos preexistentes)
        const delItemIds = (s.deliveryItems || [])
          .filter(i => i.deliveryId === id)
          .map(i => i.id);
        const hasOrphanMovements = (s.stockMovements || []).some(
          m => m.deliveryItemId && delItemIds.includes(m.deliveryItemId)
        );
        if (hasOrphanMovements)
          throw new Error(
            "Foi detetado um movimento de stock associado a uma entrega ainda não confirmada. " +
            "Execute a auditoria ou reconstrução dos saldos antes de continuar."
          );

        // 1.7 — Validar cada DeliveryItem
        const delItems = (s.deliveryItems || []).filter(i => i.deliveryId === id);
        for (const item of delItems) {
          if (!Number.isFinite(item.acceptedQuantity) || item.acceptedQuantity < 0)
            throw new Error(`Item ${item.id}: acceptedQuantity inválido.`);
          if (!Number.isFinite(item.acceptedPurchaseQuantity) || item.acceptedPurchaseQuantity < 0)
            throw new Error(`Item ${item.id}: acceptedPurchaseQuantity inválido.`);
          if (!Number.isFinite(item.actualUnitCost) || item.actualUnitCost < 0)
            throw new Error(`Item ${item.id}: actualUnitCost inválido.`);
          if (!Number.isFinite(item.actualBaseUnitCost) || item.actualBaseUnitCost < 0)
            throw new Error(`Item ${item.id}: actualBaseUnitCost inválido.`);
          if (!Number.isFinite(item.conversionFactor) || item.conversionFactor <= 0)
            throw new Error(`Item ${item.id}: conversionFactor inválido.`);
          if (item.acceptedQuantity > item.receivedBaseQuantity + 0.001)
            throw new Error(`Item ${item.id}: acceptedQuantity excede receivedBaseQuantity.`);
        }

        // 1.8 — Destino coerente
        if (delivery.destinationType !== "central_stock" && !delivery.destinationProjectId)
          throw new Error("destinationProjectId é obrigatório para o destino desta entrega.");

        // ──────────────────────────────────────────────────────────────
        // FASE 2 — Construção dos novos arrays (sem set)
        // ──────────────────────────────────────────────────────────────
        const newMovements: StockMovement[] = [];
        const updatedBalancesMap = new Map<string, InventoryBalance>();
        const updatedItemsMap = new Map<string, PurchaseOrderItem>();
        const now = nowIso();

        for (const item of delItems) {
          if (item.acceptedQuantity <= 0) continue;

          // 2.1 — Resolver destino de inventário
          const { locationType: destLocationType, projectId: destProjectId } =
            resolveInventoryDestination(delivery.destinationType, delivery.destinationProjectId);

          // 2.2 — Criar StockMovement
          const movement: StockMovement = {
            id: uid(),
            materialId: item.materialId,
            movementType: "purchase_receipt",
            quantity: item.acceptedQuantity,
            unitId: (s.materials || []).find(m => m.id === item.materialId)?.unitId ?? "",
            unitCost: item.actualBaseUnitCost,
            totalCost: item.acceptedQuantity * item.actualBaseUnitCost,
            destinationLocationType: destLocationType,
            destinationProjectId: destProjectId,
            purchaseOrderId: delivery.purchaseOrderId,
            deliveryId: delivery.id,
            deliveryItemId: item.id,
            referenceType: "delivery_item",
            referenceId: item.id,
            movementDate: delivery.deliveryDate,
            performedBy: delivery.receivedBy,
            reason: `Receção de compra ${po.orderNumber} / ${delivery.deliveryNumber}`,
            notes: undefined,
            createdAt: now,
          };
          newMovements.push(movement);

          // 2.3–2.6 — Atualizar InventoryBalance
          const balKey = getInventoryBalanceKey(item.materialId, destLocationType, destProjectId);
          const currentBal =
            updatedBalancesMap.get(balKey) ??
            (s.inventoryBalances || []).find(
              b => getInventoryBalanceKey(b.materialId, b.locationType, b.projectId) === balKey
            );
          const currentQty = currentBal?.quantityOnHand ?? 0;
          const currentAvg = currentBal?.averageCost ?? 0;
          const newAvg = calculateWeightedAverageCost(currentQty, currentAvg, item.acceptedQuantity, item.actualBaseUnitCost);
          const newQty = (Number.isFinite(currentQty) && currentQty >= 0 ? currentQty : 0) + item.acceptedQuantity;
          const newTotalValue = Number.isFinite(newQty) && Number.isFinite(newAvg) ? newQty * newAvg : 0;
          const updatedBal: InventoryBalance = {
            id: currentBal?.id ?? uid(),
            materialId: item.materialId,
            locationType: destLocationType,
            projectId: destProjectId,
            quantityOnHand: newQty,
            averageCost: newAvg,
            totalValue: newTotalValue,
            lastMovementAt: now,
            createdAt: currentBal?.createdAt ?? now,
            updatedAt: now,
          };
          updatedBalancesMap.set(balKey, updatedBal);

          // 2.7 — Acumular PurchaseOrderItem atualizado
          const existingPOI =
            updatedItemsMap.get(item.purchaseOrderItemId) ??
            (s.purchaseOrderItems || []).find(p => p.id === item.purchaseOrderItemId);
          if (existingPOI) {
            const newReceivedPurchase = existingPOI.receivedPurchaseQuantity + item.acceptedPurchaseQuantity;
            const newReceivedBase = existingPOI.receivedBaseQuantity + item.acceptedQuantity;
            const newRemaining = existingPOI.orderedPurchaseQuantity - newReceivedPurchase;
            updatedItemsMap.set(item.purchaseOrderItemId, {
              ...existingPOI,
              receivedPurchaseQuantity: newReceivedPurchase,
              receivedBaseQuantity: newReceivedBase,
              remainingPurchaseQuantity: newRemaining,
              updatedAt: now,
            });
          }
        }

        // ──────────────────────────────────────────────────────────────
        // FASE 3 — Calcular estado do PurchaseOrder
        // ──────────────────────────────────────────────────────────────
        const allPOItems = (s.purchaseOrderItems || [])
          .filter(p => p.purchaseOrderId === delivery.purchaseOrderId)
          .map(p => updatedItemsMap.get(p.id) ?? p);
        const newOrderStatus = calculateOrderStatusFromItems(allPOItems);

        // ──────────────────────────────────────────────────────────────
        // FASE 3.5 — Ponte Atómica com o InventoryEngine da Fase 2B/3
        // ──────────────────────────────────────────────────────────────
        try {
          const destLocId = delivery.destinationType === "central_stock"
            ? (delivery as any).warehouseId || "LOC-MAIN-WH"
            : delivery.destinationProjectId || "LOC-SITE-PROJ";

          inventoryActions.processDelivery({
            deliveryId: delivery.id,
            receiptId: `REC-${delivery.id}`,
            tenantId: "TENANT-A",
            companyId: "COMP-1",
            supplierId: po.supplierId,
            destinationType: delivery.destinationType === "central_stock" ? "warehouse" : "project",
            destinationLocationId: destLocId,
            confirmedAt: delivery.deliveryDate,
            confirmedByActorId: delivery.receivedBy || "actor-manager",
            items: delItems
              .filter((i) => i.acceptedQuantity > 0)
              .map((i) => ({
                deliveryItemId: i.id,
                materialId: i.materialId,
                receivedQuantity: i.acceptedQuantity,
                unitCost: i.actualBaseUnitCost,
              })),
          });
        } catch (engineErr) {
          // Se o InventoryEngine rejeitar por idempotência ou erro de validação,
          // permitimos que a confirmação prossiga se for replay idempotente.
          console.warn("[confirmDelivery Bridge] Notificação ao InventoryEngine:", engineErr);
        }

        // ──────────────────────────────────────────────────────────────
        // FASE 4 — Único set() — tudo ou nada
        // ──────────────────────────────────────────────────────────────
        const updatedBalanceKeys = new Set(updatedBalancesMap.keys());
        const mergedBalances = [
          ...(s.inventoryBalances || []).filter(
            b => !updatedBalanceKeys.has(getInventoryBalanceKey(b.materialId, b.locationType, b.projectId))
          ),
          ...[...updatedBalancesMap.values()],
        ];

        set(s => ({
          stockMovements: [...(s.stockMovements || []), ...newMovements],
          inventoryBalances: mergedBalances,
          deliveries: (s.deliveries || []).map(d =>
            d.id === id ? { ...d, status: "confirmed" as const, confirmedAt: now, updatedAt: now } : d
          ),
          purchaseOrderItems: (s.purchaseOrderItems || []).map(p =>
            updatedItemsMap.has(p.id) ? updatedItemsMap.get(p.id)! : p
          ),
          purchaseOrders: (s.purchaseOrders || []).map(o =>
            o.id === delivery.purchaseOrderId ? { ...o, status: newOrderStatus, updatedAt: now } : o
          ),
        }));
      },

      cancelDelivery: (id) => {
        const s = get();
        const del = (s.deliveries || []).find(d => d.id === id);
        if (!del) throw new Error("Entrega não encontrada.");
        if (del.status !== "draft") throw new Error("Só é possível cancelar entregas em rascunho.");
        set(s => ({
          deliveries: (s.deliveries || []).map(d =>
            d.id === id ? { ...d, status: "cancelled" as const, cancelledAt: nowIso(), updatedAt: nowIso() } : d
          ),
        }));
      },

      // ── Itens de Entrega ─────────────────────────────────────────────

      addDeliveryItem: (data) => {
        const s = get();
        const del = (s.deliveries || []).find(d => d.id === data.deliveryId);
        if (del?.status !== "draft") throw new Error("Itens de entrega só podem ser adicionados a entregas em rascunho.");
        const poItem = (s.purchaseOrderItems || []).find(p => p.id === data.purchaseOrderItemId);
        const err = validateDeliveryItemInput(data, poItem, del?.status);
        if (err) throw new Error(err);
        const cf = data.conversionFactor;
        const acceptedPurchaseQuantity = cf > 0 ? data.acceptedQuantity / cf : 0;
        const item: DeliveryItem = {
          ...data,
          id: uid(),
          receivedBaseQuantity: data.receivedPurchaseQuantity * cf,
          acceptedPurchaseQuantity,
          actualBaseUnitCost: cf > 0 ? data.actualUnitCost / cf : data.actualUnitCost,
          createdAt: nowIso(),
        };
        set(s => ({ deliveryItems: [...(s.deliveryItems || []), item] }));
        return item;
      },

      updateDeliveryItem: (id, patch) => {
        const s = get();
        const item = (s.deliveryItems || []).find(i => i.id === id);
        if (!item) throw new Error("Item de entrega não encontrado.");
        const del = (s.deliveries || []).find(d => d.id === item.deliveryId);
        if (del?.status !== "draft") throw new Error("Itens de entrega só podem ser editados enquanto a entrega está em rascunho.");
        const cf = patch.conversionFactor ?? item.conversionFactor;
        const acceptedQty = patch.acceptedQuantity ?? item.acceptedQuantity;
        const receivedPurchaseQty = patch.receivedPurchaseQuantity ?? item.receivedPurchaseQuantity;
        const actualUnitCost = patch.actualUnitCost ?? item.actualUnitCost;
        const updated: DeliveryItem = {
          ...item,
          ...patch,
          receivedBaseQuantity: receivedPurchaseQty * cf,
          acceptedPurchaseQuantity: cf > 0 ? acceptedQty / cf : 0,
          actualBaseUnitCost: cf > 0 ? actualUnitCost / cf : actualUnitCost,
        };
        set(s => ({
          deliveryItems: (s.deliveryItems || []).map(i => i.id === id ? updated : i),
        }));
      },

      removeDeliveryItem: (id) => {
        const s = get();
        const item = (s.deliveryItems || []).find(i => i.id === id);
        if (!item) throw new Error("Item de entrega não encontrado.");
        const del = (s.deliveries || []).find(d => d.id === item.deliveryId);
        if (del?.status !== "draft") throw new Error("Itens de entrega só podem ser removidos enquanto a entrega está em rascunho.");
        set(s => ({
          deliveryItems: (s.deliveryItems || []).filter(i => i.id !== id),
        }));
      },

      // ── Selectors de Inventário ──────────────────────────────────────

      getInventoryBalance: (materialId, locationType, projectId) => {
        const key = getInventoryBalanceKey(materialId, locationType, projectId);
        return (get().inventoryBalances || []).find(
          b => getInventoryBalanceKey(b.materialId, b.locationType, b.projectId) === key
        );
      },

      getInventoryBalancesByMaterial: (materialId) =>
        (get().inventoryBalances || []).filter(b => b.materialId === materialId),

      getInventoryBalancesByProject: (projectId) =>
        (get().inventoryBalances || []).filter(b => b.projectId === projectId),

      getTotalStockByMaterial: (materialId) =>
        (get().inventoryBalances || [])
          .filter(b => b.materialId === materialId)
          .reduce((sum, b) => sum + (Number.isFinite(b.quantityOnHand) ? b.quantityOnHand : 0), 0),

      getTotalInventoryValue: () =>
        calculateInventoryTotalValue(get().inventoryBalances || []),

      getInventoryValueByProject: (projectId) =>
        (get().inventoryBalances || [])
          .filter(b => b.projectId === projectId)
          .reduce((sum, b) => sum + (Number.isFinite(b.totalValue) ? b.totalValue : 0), 0),

      getStockMovementsByMaterial: (materialId) =>
        (get().stockMovements || []).filter(m => m.materialId === materialId),

      getStockMovementsByDelivery: (deliveryId) =>
        (get().stockMovements || []).filter(m => m.deliveryId === deliveryId),

      resetDemoData: () => set({ ...initialState, _hydrated: true }),
    }),
    {
      name: "obramz-store-v1",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
        }
        return {
          getItem: (name) => window.localStorage.getItem(name),
          setItem: (name, value) => {
            try {
              window.localStorage.setItem(name, value);
            } catch (e: any) {
              console.error("Erro ao guardar no localStorage:", e);
              if (
                e.name === "QuotaExceededError" ||
                e.code === 22 ||
                e.code === 1014 ||
                e.message?.toLowerCase().includes("quota") ||
                e.message?.toLowerCase().includes("exceeded")
              ) {
                setTimeout(() => {
                  import("sonner").then(({ toast }) => {
                    toast.error("Erro de armazenamento: Limite de espaço excedido no navegador. O progresso foi mantido em memória, mas liberte espaço apagando fotos antigas.");
                  }).catch(() => {});
                }, 0);
              }
            }
          },
          removeItem: (name) => window.localStorage.removeItem(name),
        };
      }),
      skipHydration: true,
      partialize: (s) => ({
        clientes: s.clientes,
        obras: s.obras,
        orcamentos: s.orcamentos,
        pagamentos: s.pagamentos,
        atividades: s.atividades,
        empresa: s.empresa,
        utilizador: s.utilizador,
        workers: s.workers || [],
        teams: s.teams || [],
        projectAssignments: s.projectAssignments || [],
        attendanceRecords: s.attendanceRecords || [],
        attendanceSchedules: s.attendanceSchedules || [],
        disabledProjectDays: s.disabledProjectDays || [],
        materials: s.materials || [],
        materialCategories: s.materialCategories || [],
        materialUnits: s.materialUnits || [],
        suppliers: s.suppliers || [],
        supplierMaterials: s.supplierMaterials || [],
        supplierPriceHistories: s.supplierPriceHistories || [],
        purchaseOrders: s.purchaseOrders || [],
        purchaseOrderItems: s.purchaseOrderItems || [],
        deliveries: s.deliveries || [],
        deliveryItems: s.deliveryItems || [],
        stockMovements: s.stockMovements || [],
        inventoryBalances: s.inventoryBalances || [],
      }),
    },
  ),
);

// Função de migração segura e idempotente para atribuições antigas
const migrateAssignments = (assignments: any[], workers: any[], teams: any[]) => {
  return (assignments || []).map((a) => {
    if (a.assignmentType) return a; // Idempotente: já migrada

    // 1. Contém ambos: priorizar trabalhador e alertar
    if (a.workerId && a.teamId) {
      console.warn("Atribuição incoerente: contém workerId e teamId. Priorizando integridade de trabalhador.", a);
      return {
        ...a,
        assignmentType: "worker" as const,
        teamId: undefined,
        assignedWorkerIds: undefined,
      };
    }

    // 2. Contém workerId: marcar como worker
    if (a.workerId) {
      return {
        ...a,
        assignmentType: "worker" as const,
        teamId: undefined,
        assignedWorkerIds: undefined,
      };
    }

    // 3. Contém teamId: marcar como team e gerar snapshot
    if (a.teamId) {
      let assignedWorkerIds = a.assignedWorkerIds;
      if (!assignedWorkerIds) {
        const team = teams?.find((t) => t.id === a.teamId);
        if (team) {
          const activeMembers = workers
            .filter((w) => w.status === "active" && team.workerIds.includes(w.id))
            .map((w) => w.id);
          assignedWorkerIds = Array.from(new Set(activeMembers));
        } else {
          assignedWorkerIds = [];
        }
      }
      return {
        ...a,
        assignmentType: "team" as const,
        workerId: undefined,
        assignedWorkerIds,
      };
    }

    // 4. Nenhum dos dois: entrada corrompida
    console.warn("Atribuição corrompida detetada durante a migração.", a);
    return {
      ...a,
      assignmentType: "worker" as const,
      workerId: "invalid-orphan",
      teamId: undefined,
      assignedWorkerIds: undefined,
    };
  });
};

// Função de migração segura e idempotente para escalas de presença
const migrateSchedules = (schedules: any[]) => {
  return (schedules || []).map((s) => ({
    ...s,
    workingDays: s.workingDays || ["monday", "tuesday", "wednesday", "thursday", "friday"],
    excludedDates: s.excludedDates || [],
    includedDates: s.includedDates || [],
    status: s.status || "active",
  }));
};

// Funções de migração para dados da Etapa 6.3
const migratePurchaseOrders = (orders: any[]): PurchaseOrder[] =>
  (orders || []).map(o => ({
    ...o,
    currency: o.currency || "MZN",
    subtotal: Number.isFinite(o.subtotal) ? o.subtotal : 0,
    totalAmount: Number.isFinite(o.totalAmount) ? o.totalAmount : 0,
  }));

const migratePurchaseOrderItems = (items: any[]): PurchaseOrderItem[] =>
  (items || []).map(i => ({
    ...i,
    receivedPurchaseQuantity: Number.isFinite(i.receivedPurchaseQuantity) ? i.receivedPurchaseQuantity : 0,
    receivedBaseQuantity: Number.isFinite(i.receivedBaseQuantity) ? i.receivedBaseQuantity : 0,
    remainingPurchaseQuantity: Number.isFinite(i.remainingPurchaseQuantity)
      ? i.remainingPurchaseQuantity
      : (Number.isFinite(i.orderedPurchaseQuantity) ? i.orderedPurchaseQuantity : 0),
  }));

const migrateDeliveries = (deliveries: any[]): Delivery[] =>
  (deliveries || []).map(d => ({
    ...d,
    status: d.status || "draft",
  }));

const migrateDeliveryItems = (items: any[]): DeliveryItem[] =>
  (items || []).map(i => {
    const cf = Number.isFinite(i.conversionFactor) && i.conversionFactor > 0 ? i.conversionFactor : 1;
    const acceptedQty = Number.isFinite(i.acceptedQuantity) && i.acceptedQuantity >= 0 ? i.acceptedQuantity : 0;
    return {
      ...i,
      receivedBaseQuantity: Number.isFinite(i.receivedBaseQuantity)
        ? i.receivedBaseQuantity
        : (Number.isFinite(i.receivedPurchaseQuantity) ? i.receivedPurchaseQuantity * cf : 0),
      acceptedPurchaseQuantity: Number.isFinite(i.acceptedPurchaseQuantity)
        ? i.acceptedPurchaseQuantity
        : acceptedQty / cf,
      actualBaseUnitCost: Number.isFinite(i.actualBaseUnitCost)
        ? i.actualBaseUnitCost
        : (Number.isFinite(i.actualUnitCost) ? i.actualUnitCost / cf : 0),
    };
  });

const migrateStockMovements = (movements: any[]): StockMovement[] =>
  (movements || []).map(m => ({
    ...m,
    destinationLocationType: m.destinationLocationType || m.destinationType || "central_stock",
    destinationProjectId: m.destinationProjectId ?? m.projectId,
  }));

const migrateInventoryBalances = (balances: any[]): InventoryBalance[] =>
  (balances || []).map(b => {
    const qty = Number.isFinite(b.quantityOnHand) && b.quantityOnHand >= 0 ? b.quantityOnHand : 0;
    const avg = Number.isFinite(b.averageCost) && b.averageCost >= 0 ? b.averageCost : 0;
    return {
      ...b,
      quantityOnHand: qty,
      averageCost: avg,
      totalValue: Number.isFinite(b.totalValue) ? b.totalValue : qty * avg,
    };
  });

// Rehydrate seguro e idempotente no cliente (evita mismatch SSR ↔ CSR e recupera propriedades em falta)
const ensureHydratedState = () => {
  const state = useObraMZStore.getState();
  const migrated = migrateAssignments(state.projectAssignments || [], state.workers || [], state.teams || []);
  const migratedSchedules = migrateSchedules(state.attendanceSchedules || []);
  useObraMZStore.setState({
    clientes: state.clientes && state.clientes.length > 0 ? state.clientes : clientesSeed,
    obras: state.obras && state.obras.length > 0 ? state.obras : obrasSeed,
    orcamentos: state.orcamentos && state.orcamentos.length > 0 ? state.orcamentos : orcamentosSeed,
    pagamentos: state.pagamentos && state.pagamentos.length > 0 ? state.pagamentos : pagamentosSeed,
    atividades: state.atividades || atividadesSeed,
    workers: state.workers || workersSeed,
    teams: state.teams || teamsSeed,
    empresa: state.empresa?.nome ? state.empresa : empresaSeed,
    utilizador: state.utilizador?.nome ? state.utilizador : utilizadorSeed,
    projectAssignments: migrated,
    attendanceRecords: state.attendanceRecords || [],
    attendanceSchedules: migratedSchedules,
    disabledProjectDays: state.disabledProjectDays || [],
    materials: state.materials && state.materials.length > 0 ? state.materials : demoMaterialsSeed,
    materialCategories: state.materialCategories && state.materialCategories.length > 0 ? state.materialCategories : initialMaterialCategories,
    materialUnits: state.materialUnits && state.materialUnits.length > 0 ? state.materialUnits : initialMaterialUnits,
    suppliers: state.suppliers !== undefined ? state.suppliers : initialSuppliersSeed,
    supplierMaterials: state.supplierMaterials !== undefined ? state.supplierMaterials : initialSupplierMaterialsSeed,
    supplierPriceHistories: state.supplierPriceHistories !== undefined ? state.supplierPriceHistories : initialSupplierPriceHistoriesSeed,
    // Etapa 6.3 — usar !== undefined para preservar arrays vazios do utilizador
    purchaseOrders: state.purchaseOrders !== undefined ? migratePurchaseOrders(state.purchaseOrders) : demoPurchaseOrdersSeed,
    purchaseOrderItems: state.purchaseOrderItems !== undefined ? migratePurchaseOrderItems(state.purchaseOrderItems) : demoPurchaseOrderItemsSeed,
    deliveries: state.deliveries !== undefined ? migrateDeliveries(state.deliveries) : demoDeliveriesSeed,
    deliveryItems: state.deliveryItems !== undefined ? migrateDeliveryItems(state.deliveryItems) : demoDeliveryItemsSeed,
    stockMovements: state.stockMovements !== undefined ? migrateStockMovements(state.stockMovements) : demoStockMovementsSeed,
    inventoryBalances: state.inventoryBalances !== undefined ? migrateInventoryBalances(state.inventoryBalances) : demoInventoryBalancesSeed,
    _hydrated: true,
  });
};

if (typeof window !== "undefined") {
  useObraMZStore.persist.rehydrate()?.then?.(() => {
    ensureHydratedState();
  });
  // fallback de execução imediata
  setTimeout(() => {
    if (!useObraMZStore.getState()._hydrated) {
      ensureHydratedState();
    }
  }, 0);
}

// -------------------------------------------------------------------
// Selectors derivados
// -------------------------------------------------------------------

export function totalsPorObra(obraId: string, state = useObraMZStore.getState()) {
  const orcs = (state?.orcamentos || []).filter((o) => o.obraId === obraId);
  const orcado = orcs.reduce((s, o) => s + totalOrcamento(o).total, 0);
  const recebido = (state?.pagamentos || [])
    .filter((p) => p.obraId === obraId && p.estado === "confirmado")
    .reduce((s, p) => s + p.valor, 0);
  const pendente = Math.max(0, orcado - recebido);
  return { orcado, recebido, pendente, orcamentos: orcs };
}

export function totalsPorCliente(clienteId: string, state = useObraMZStore.getState()) {
  const orcs = (state?.orcamentos || []).filter((o) => o.clienteId === clienteId);
  const orcado = orcs.reduce((s, o) => s + totalOrcamento(o).total, 0);
  const aceite = orcs.filter((o) => o.estado === "aceite").reduce((s, o) => s + totalOrcamento(o).total, 0);
  const recebido = (state?.pagamentos || [])
    .filter((p) => p.clienteId === clienteId && p.estado === "confirmado")
    .reduce((s, p) => s + p.valor, 0);
  const pendente = Math.max(0, aceite - recebido);
  const obras = (state?.obras || []).filter((o) => o.clienteId === clienteId);
  return { orcado, aceite, recebido, pendente, obras };
}

export function metricasGlobais(state = useObraMZStore.getState()) {
  const obras = state?.obras || [];
  const orcamentos = state?.orcamentos || [];
  const pagamentos = state?.pagamentos || [];
  const clientes = state?.clientes || [];

  const obrasAtivas = obras.filter((o) => o.estado === "em_andamento").length;
  const orcamentosEmitidos = orcamentos.length;
  const orcamentosAceites = orcamentos.filter((o) => o.estado === "aceite").length;
  const totalOrcado = orcamentos.reduce((s, o) => s + totalOrcamento(o).total, 0);
  const totalAceite = orcamentos.filter((o) => o.estado === "aceite").reduce((s, o) => s + totalOrcamento(o).total, 0);
  const totalRecebido = pagamentos.filter((p) => p.estado === "confirmado").reduce((s, p) => s + p.valor, 0);
  const pendente = Math.max(0, totalAceite - totalRecebido);
  const pagamentosPendentes = pagamentos.filter((p) => p.estado === "pendente").length;
  return {
    obrasAtivas,
    orcamentosEmitidos,
    orcamentosAceites,
    totalOrcado,
    totalAceite,
    totalRecebido,
    pendente,
    pagamentosPendentes,
    clientesRegistados: state.clientes.length,
  };
}

// Helpers de acesso
export const useClienteById = (id: string | undefined) =>
  useObraMZStore((s) => (id ? s.clientes.find((c) => c.id === id) : undefined));
export const useObraById = (id: string | undefined) =>
  useObraMZStore((s) => (id ? s.obras.find((o) => o.id === id) : undefined));
export const useOrcamentoById = (id: string | undefined) =>
  useObraMZStore((s) => (id ? s.orcamentos.find((o) => o.id === id) : undefined));
