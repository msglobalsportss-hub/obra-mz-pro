import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Cliente, Obra, ObraEvento, ObraFoto, ObraFase, Orcamento, OrcamentoHistorico, Pagamento,
  Atividade, Empresa, Utilizador, EstadoOrcamento, EstadoObra, Worker, Team, ProjectAssignment,
  AttendanceStatus, AttendanceRecord,
} from "@/lib/mock-data";

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

// Rehydrate manualmente no cliente (evita mismatch SSR ↔ CSR)
if (typeof window !== "undefined") {
  useObraMZStore.persist.rehydrate()?.then?.(() => {
    const state = useObraMZStore.getState();
    const migrated = migrateAssignments(state.projectAssignments, state.workers, state.teams);
    useObraMZStore.setState({
      projectAssignments: migrated,
      attendanceRecords: state.attendanceRecords || [],
      _hydrated: true,
    });
  });
  // fallback
  setTimeout(() => {
    if (!useObraMZStore.getState()._hydrated) {
      const state = useObraMZStore.getState();
      const migrated = migrateAssignments(state.projectAssignments, state.workers, state.teams);
      useObraMZStore.setState({
        projectAssignments: migrated,
        attendanceRecords: state.attendanceRecords || [],
        _hydrated: true,
      });
    }
  }, 0);
}

// -------------------------------------------------------------------
// Selectors derivados
// -------------------------------------------------------------------

export function totalsPorObra(obraId: string, state = useObraMZStore.getState()) {
  const orcs = state.orcamentos.filter((o) => o.obraId === obraId);
  const orcado = orcs.filter((o) => o.estado === "aceite").reduce((s, o) => s + totalOrcamento(o).total, 0);
  const recebido = state.pagamentos
    .filter((p) => p.obraId === obraId && p.estado === "confirmado")
    .reduce((s, p) => s + p.valor, 0);
  const pendente = Math.max(0, orcado - recebido);
  return { orcado, recebido, pendente, orcamentos: orcs };
}

export function totalsPorCliente(clienteId: string, state = useObraMZStore.getState()) {
  const orcs = state.orcamentos.filter((o) => o.clienteId === clienteId);
  const orcado = orcs.reduce((s, o) => s + totalOrcamento(o).total, 0);
  const aceite = orcs.filter((o) => o.estado === "aceite").reduce((s, o) => s + totalOrcamento(o).total, 0);
  const recebido = state.pagamentos
    .filter((p) => p.clienteId === clienteId && p.estado === "confirmado")
    .reduce((s, p) => s + p.valor, 0);
  const pendente = Math.max(0, aceite - recebido);
  const obras = state.obras.filter((o) => o.clienteId === clienteId);
  return { orcado, aceite, recebido, pendente, obras };
}

export function metricasGlobais(state = useObraMZStore.getState()) {
  const obrasAtivas = state.obras.filter((o) => o.estado === "em_andamento").length;
  const orcamentosEmitidos = state.orcamentos.length;
  const orcamentosAceites = state.orcamentos.filter((o) => o.estado === "aceite").length;
  const totalOrcado = state.orcamentos.reduce((s, o) => s + totalOrcamento(o).total, 0);
  const totalAceite = state.orcamentos.filter((o) => o.estado === "aceite").reduce((s, o) => s + totalOrcamento(o).total, 0);
  const totalRecebido = state.pagamentos.filter((p) => p.estado === "confirmado").reduce((s, p) => s + p.valor, 0);
  const pendente = Math.max(0, totalAceite - totalRecebido);
  const pagamentosPendentes = state.pagamentos.filter((p) => p.estado === "pendente").length;
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
