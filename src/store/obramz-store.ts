import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Cliente, Obra, ObraEvento, Orcamento, OrcamentoHistorico, Pagamento,
  Atividade, Empresa, Utilizador, EstadoOrcamento, EstadoObra,
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

  // Utilidades
  resetDemoData: () => void;
};

const initialState = {
  clientes: clientesSeed,
  obras: obrasSeed,
  orcamentos: orcamentosSeed,
  pagamentos: pagamentosSeed,
  atividades: atividadesSeed,
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

      resetDemoData: () => set({ ...initialState, _hydrated: true }),
    }),
    {
      name: "obramz-store-v1",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? window.localStorage
          : { getItem: () => null, setItem: () => {}, removeItem: () => {} },
      ),
      skipHydration: true,
      partialize: (s) => ({
        clientes: s.clientes,
        obras: s.obras,
        orcamentos: s.orcamentos,
        pagamentos: s.pagamentos,
        atividades: s.atividades,
        empresa: s.empresa,
        utilizador: s.utilizador,
      }),
    },
  ),
);

// Rehydrate manualmente no cliente (evita mismatch SSR ↔ CSR)
if (typeof window !== "undefined") {
  useObraMZStore.persist.rehydrate()?.then?.(() => {
    useObraMZStore.setState({ _hydrated: true });
  });
  // fallback
  setTimeout(() => {
    if (!useObraMZStore.getState()._hydrated) {
      useObraMZStore.setState({ _hydrated: true });
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
