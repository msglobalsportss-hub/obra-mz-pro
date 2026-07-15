// Dados fictícios para demonstração. Não representam clientes ou obras reais.

export type Cliente = {
  id: string;
  nome: string;
  tipo: "particular" | "empresa";
  telefone: string;
  telefone2?: string;
  email: string;
  nuit: string;
  provincia: string;
  cidade: string;
  endereco: string;
  obras: number;
  valorTotal: number;
  ultimaAtividade: string;
  observacoes?: string;
};

export type EstadoObra = "planeada" | "em_andamento" | "suspensa" | "concluida" | "cancelada";
export type Obra = {
  id: string;
  nome: string;
  clienteId: string;
  tipo: string;
  descricao: string;
  provincia: string;
  cidade: string;
  endereco: string;
  inicio: string;
  fimPrevisto: string;
  progresso: number;
  valorPrevisto: number;
  valorRecebido: number;
  estado: EstadoObra;
  responsavel: string;
};

export type EstadoOrcamento =
  | "rascunho"
  | "enviado"
  | "visualizado"
  | "aceite"
  | "rejeitado"
  | "expirado"
  | "cancelado";

export type OrcamentoItem = {
  id: string;
  descricao: string;
  categoria: string;
  unidade: string;
  quantidade: number;
  precoUnitario: number;
  desconto: number;
};

export type Orcamento = {
  id: string;
  numero: string;
  clienteId: string;
  obraId?: string;
  titulo: string;
  descricao: string;
  emissao: string;
  validade: string;
  estado: EstadoOrcamento;
  itens: OrcamentoItem[];
  descontoGeral: number;
  imposto: number;
  custosAdicionais: number;
  notas: string;
  condicoes: string;
};

export type MetodoPagamento = "mpesa" | "emola" | "transferencia" | "deposito" | "numerario" | "outro";
export type Pagamento = {
  id: string;
  clienteId: string;
  obraId: string;
  orcamentoId?: string;
  valor: number;
  data: string;
  metodo: MetodoPagamento;
  referencia: string;
  estado: "confirmado" | "pendente";
  observacoes?: string;
};

export const empresa = {
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

export const utilizador = {
  nome: "António Machava",
  email: "antonio@horizonte.co.mz",
  cargo: "Gerente",
};

export const clientes: Cliente[] = [
  {
    id: "c1", nome: "João Mabote", tipo: "particular",
    telefone: "+258 82 111 2233", email: "joao.mabote@email.mz", nuit: "100200301",
    provincia: "Maputo", cidade: "Matola", endereco: "Bairro Machava, Rua 12",
    obras: 2, valorTotal: 1850000, ultimaAtividade: "2026-06-28",
  },
  {
    id: "c2", nome: "Ana Macamo", tipo: "particular",
    telefone: "+258 84 333 4455", email: "ana.macamo@email.mz", nuit: "100400502",
    provincia: "Maputo", cidade: "Maputo", endereco: "Bairro Polana, Av. Julius Nyerere",
    obras: 1, valorTotal: 620000, ultimaAtividade: "2026-07-02",
  },
  {
    id: "c3", nome: "Empresa Nova Vida, Lda.", tipo: "empresa",
    telefone: "+258 21 320 100", email: "contacto@novavida.co.mz", nuit: "400889977",
    provincia: "Sofala", cidade: "Beira", endereco: "Rua do Comércio, nº 45",
    obras: 3, valorTotal: 5240000, ultimaAtividade: "2026-07-10",
  },
  {
    id: "c4", nome: "Alberto Mondlane", tipo: "particular",
    telefone: "+258 87 555 6677", email: "alberto.m@email.mz", nuit: "100778899",
    provincia: "Gaza", cidade: "Xai-Xai", endereco: "Bairro Praia, Rua 4",
    obras: 1, valorTotal: 890000, ultimaAtividade: "2026-06-20",
  },
  {
    id: "c5", nome: "Celina Mucavele", tipo: "particular",
    telefone: "+258 82 998 7766", email: "celina.muc@email.mz", nuit: "100554433",
    provincia: "Maputo", cidade: "Marracuene", endereco: "Bairro Central, Rua 8",
    obras: 1, valorTotal: 430000, ultimaAtividade: "2026-07-11",
  },
  {
    id: "c6", nome: "Construções Índico, Lda.", tipo: "empresa",
    telefone: "+258 26 213 400", email: "obras@indico.co.mz", nuit: "400221133",
    provincia: "Inhambane", cidade: "Inhambane", endereco: "Av. da Independência, 78",
    obras: 2, valorTotal: 3120000, ultimaAtividade: "2026-07-05",
  },
];

export const obras: Obra[] = [
  {
    id: "o1", nome: "Moradia T3 — Bairro Machava", clienteId: "c1",
    tipo: "Construção de moradia", descricao: "Construção de moradia unifamiliar T3 com garagem.",
    provincia: "Maputo", cidade: "Matola", endereco: "Bairro Machava, Rua 12, nº 45",
    inicio: "2026-04-10", fimPrevisto: "2026-11-30",
    progresso: 62, valorPrevisto: 1250000, valorRecebido: 780000, estado: "em_andamento",
    responsavel: "Eng. Mário Sitoe",
  },
  {
    id: "o2", nome: "Renovação apartamento Polana", clienteId: "c2",
    tipo: "Renovação", descricao: "Renovação completa de apartamento T2, incluindo canalização e pintura.",
    provincia: "Maputo", cidade: "Maputo", endereco: "Av. Julius Nyerere, Edif. Polana",
    inicio: "2026-05-02", fimPrevisto: "2026-08-15",
    progresso: 85, valorPrevisto: 620000, valorRecebido: 500000, estado: "em_andamento",
    responsavel: "António Machava",
  },
  {
    id: "o3", nome: "Armazém Comercial Beira", clienteId: "c3",
    tipo: "Construção comercial", descricao: "Construção de armazém de 800m² com escritórios.",
    provincia: "Sofala", cidade: "Beira", endereco: "Zona Industrial, Lote 12",
    inicio: "2026-02-15", fimPrevisto: "2026-12-20",
    progresso: 45, valorPrevisto: 3800000, valorRecebido: 1600000, estado: "em_andamento",
    responsavel: "Eng. Paulo Chissano",
  },
  {
    id: "o4", nome: "Cobertura Escritório Maputo", clienteId: "c3",
    tipo: "Cobertura", descricao: "Substituição de cobertura em chapa metálica.",
    provincia: "Maputo", cidade: "Maputo", endereco: "Av. 25 de Setembro, nº 210",
    inicio: "2026-07-01", fimPrevisto: "2026-08-30",
    progresso: 20, valorPrevisto: 640000, valorRecebido: 200000, estado: "em_andamento",
    responsavel: "António Machava",
  },
  {
    id: "o5", nome: "Ampliação residencial Xai-Xai", clienteId: "c4",
    tipo: "Ampliação", descricao: "Ampliação de dois quartos e casa de banho.",
    provincia: "Gaza", cidade: "Xai-Xai", endereco: "Bairro Praia, Rua 4",
    inicio: "2026-08-01", fimPrevisto: "2026-11-15",
    progresso: 0, valorPrevisto: 890000, valorRecebido: 0, estado: "planeada",
    responsavel: "Eng. Mário Sitoe",
  },
  {
    id: "o6", nome: "Pintura exterior — Marracuene", clienteId: "c5",
    tipo: "Pintura", descricao: "Pintura exterior e interior de vivenda.",
    provincia: "Maputo", cidade: "Marracuene", endereco: "Bairro Central, Rua 8",
    inicio: "2026-06-10", fimPrevisto: "2026-07-15",
    progresso: 100, valorPrevisto: 220000, valorRecebido: 220000, estado: "concluida",
    responsavel: "António Machava",
  },
  {
    id: "o7", nome: "Instalação elétrica loja Inhambane", clienteId: "c6",
    tipo: "Instalação elétrica", descricao: "Instalação elétrica completa de loja comercial.",
    provincia: "Inhambane", cidade: "Inhambane", endereco: "Av. da Independência, 78",
    inicio: "2026-05-20", fimPrevisto: "2026-07-05",
    progresso: 40, valorPrevisto: 380000, valorRecebido: 100000, estado: "suspensa",
    responsavel: "Eng. Paulo Chissano",
  },
];

export const orcamentos: Orcamento[] = [
  {
    id: "orc1", numero: "ORC-2026-0031", clienteId: "c1", obraId: "o1",
    titulo: "Construção de moradia T3", descricao: "Orçamento para construção de moradia unifamiliar",
    emissao: "2026-03-20", validade: "2026-04-20", estado: "aceite",
    itens: [
      { id: "i1", descricao: "Escavação e movimento de terras", categoria: "Preliminares", unidade: "m³", quantidade: 120, precoUnitario: 850, desconto: 0 },
      { id: "i2", descricao: "Fundação em betão armado", categoria: "Fundação", unidade: "m³", quantidade: 45, precoUnitario: 8500, desconto: 0 },
      { id: "i3", descricao: "Alvenaria de bloco 20cm", categoria: "Alvenaria", unidade: "m²", quantidade: 320, precoUnitario: 950, desconto: 0 },
      { id: "i4", descricao: "Mão de obra especializada", categoria: "Mão de obra", unidade: "dia", quantidade: 180, precoUnitario: 1500, desconto: 0 },
    ],
    descontoGeral: 0, imposto: 0, custosAdicionais: 50000,
    notas: "Prazo de execução: 8 meses. Materiais incluídos.",
    condicoes: "30% de sinal, 40% durante a execução, 30% na entrega.",
  },
  {
    id: "orc2", numero: "ORC-2026-0042", clienteId: "c2", obraId: "o2",
    titulo: "Renovação apartamento T2", descricao: "Renovação completa",
    emissao: "2026-04-15", validade: "2026-05-15", estado: "aceite",
    itens: [
      { id: "i1", descricao: "Demolição e remoção de entulho", categoria: "Preliminares", unidade: "serviço", quantidade: 1, precoUnitario: 45000, desconto: 0 },
      { id: "i2", descricao: "Canalização de água e esgoto", categoria: "Canalização", unidade: "serviço", quantidade: 1, precoUnitario: 180000, desconto: 0 },
      { id: "i3", descricao: "Pintura interior", categoria: "Pintura", unidade: "m²", quantidade: 180, precoUnitario: 320, desconto: 0 },
      { id: "i4", descricao: "Revestimento cerâmico", categoria: "Revestimento", unidade: "m²", quantidade: 42, precoUnitario: 1800, desconto: 0 },
    ],
    descontoGeral: 20000, imposto: 0, custosAdicionais: 0,
    notas: "", condicoes: "50% no início, 50% na conclusão.",
  },
  {
    id: "orc3", numero: "ORC-2026-0055", clienteId: "c3", obraId: "o3",
    titulo: "Armazém comercial 800m²", descricao: "Construção de raiz",
    emissao: "2026-01-25", validade: "2026-02-25", estado: "aceite",
    itens: [
      { id: "i1", descricao: "Estrutura metálica", categoria: "Estrutura", unidade: "ton", quantidade: 18, precoUnitario: 95000, desconto: 0 },
      { id: "i2", descricao: "Cobertura em chapa", categoria: "Cobertura", unidade: "m²", quantidade: 850, precoUnitario: 1200, desconto: 0 },
      { id: "i3", descricao: "Pavimentação industrial", categoria: "Pavimentação", unidade: "m²", quantidade: 800, precoUnitario: 850, desconto: 0 },
    ],
    descontoGeral: 0, imposto: 0, custosAdicionais: 120000,
    notas: "", condicoes: "Pagamento faseado conforme cronograma.",
  },
  {
    id: "orc4", numero: "ORC-2026-0068", clienteId: "c4",
    titulo: "Ampliação residencial", descricao: "Dois quartos e casa de banho",
    emissao: "2026-07-05", validade: "2026-08-05", estado: "enviado",
    itens: [
      { id: "i1", descricao: "Fundação e estrutura", categoria: "Fundação", unidade: "lote", quantidade: 1, precoUnitario: 380000, desconto: 0 },
      { id: "i2", descricao: "Alvenaria e cobertura", categoria: "Alvenaria", unidade: "lote", quantidade: 1, precoUnitario: 320000, desconto: 0 },
      { id: "i3", descricao: "Acabamentos", categoria: "Revestimento", unidade: "lote", quantidade: 1, precoUnitario: 190000, desconto: 0 },
    ],
    descontoGeral: 0, imposto: 0, custosAdicionais: 0,
    notas: "Prazo estimado: 3,5 meses.", condicoes: "30/40/30.",
  },
  {
    id: "orc5", numero: "ORC-2026-0071", clienteId: "c5", obraId: "o6",
    titulo: "Pintura vivenda", descricao: "Interior e exterior",
    emissao: "2026-05-30", validade: "2026-06-30", estado: "aceite",
    itens: [
      { id: "i1", descricao: "Preparação de superfície", categoria: "Preliminares", unidade: "m²", quantidade: 260, precoUnitario: 180, desconto: 0 },
      { id: "i2", descricao: "Pintura tinta acrílica 2 demãos", categoria: "Pintura", unidade: "m²", quantidade: 260, precoUnitario: 480, desconto: 0 },
      { id: "i3", descricao: "Mão de obra", categoria: "Mão de obra", unidade: "dia", quantidade: 15, precoUnitario: 2500, desconto: 0 },
    ],
    descontoGeral: 0, imposto: 0, custosAdicionais: 0,
    notas: "", condicoes: "50/50.",
  },
  {
    id: "orc6", numero: "ORC-2026-0079", clienteId: "c6",
    titulo: "Instalação elétrica loja", descricao: "Instalação completa",
    emissao: "2026-05-01", validade: "2026-06-01", estado: "visualizado",
    itens: [
      { id: "i1", descricao: "Quadro elétrico e cablagem", categoria: "Instalação elétrica", unidade: "lote", quantidade: 1, precoUnitario: 240000, desconto: 0 },
      { id: "i2", descricao: "Iluminação LED", categoria: "Instalação elétrica", unidade: "unidade", quantidade: 32, precoUnitario: 3500, desconto: 0 },
    ],
    descontoGeral: 0, imposto: 0, custosAdicionais: 28000,
    notas: "", condicoes: "50% no início, 50% na conclusão.",
  },
  {
    id: "orc7", numero: "ORC-2026-0082", clienteId: "c3", obraId: "o4",
    titulo: "Substituição de cobertura", descricao: "Cobertura em chapa metálica",
    emissao: "2026-06-25", validade: "2026-07-25", estado: "aceite",
    itens: [
      { id: "i1", descricao: "Desmontagem cobertura existente", categoria: "Preliminares", unidade: "m²", quantidade: 280, precoUnitario: 220, desconto: 0 },
      { id: "i2", descricao: "Estrutura metálica nova", categoria: "Estrutura", unidade: "ton", quantidade: 4, precoUnitario: 95000, desconto: 0 },
      { id: "i3", descricao: "Chapa metálica", categoria: "Cobertura", unidade: "m²", quantidade: 300, precoUnitario: 680, desconto: 0 },
    ],
    descontoGeral: 0, imposto: 0, custosAdicionais: 0,
    notas: "", condicoes: "40% início, 60% conclusão.",
  },
  {
    id: "orc8", numero: "ORC-2026-0084", clienteId: "c1",
    titulo: "Muro de vedação", descricao: "Muro perimetral 60m",
    emissao: "2026-07-08", validade: "2026-07-20", estado: "rascunho",
    itens: [
      { id: "i1", descricao: "Fundação corrida", categoria: "Fundação", unidade: "m", quantidade: 60, precoUnitario: 1200, desconto: 0 },
      { id: "i2", descricao: "Alvenaria de bloco", categoria: "Alvenaria", unidade: "m²", quantidade: 108, precoUnitario: 950, desconto: 0 },
    ],
    descontoGeral: 0, imposto: 0, custosAdicionais: 0,
    notas: "", condicoes: "",
  },
];

export const pagamentos: Pagamento[] = [
  { id: "p1", clienteId: "c1", obraId: "o1", orcamentoId: "orc1", valor: 375000, data: "2026-03-25", metodo: "transferencia", referencia: "TRF-88213", estado: "confirmado" },
  { id: "p2", clienteId: "c1", obraId: "o1", orcamentoId: "orc1", valor: 405000, data: "2026-06-10", metodo: "transferencia", referencia: "TRF-91002", estado: "confirmado" },
  { id: "p3", clienteId: "c2", obraId: "o2", orcamentoId: "orc2", valor: 310000, data: "2026-04-20", metodo: "mpesa", referencia: "MP-6621", estado: "confirmado" },
  { id: "p4", clienteId: "c2", obraId: "o2", orcamentoId: "orc2", valor: 190000, data: "2026-06-28", metodo: "mpesa", referencia: "MP-8891", estado: "confirmado" },
  { id: "p5", clienteId: "c3", obraId: "o3", orcamentoId: "orc3", valor: 1000000, data: "2026-02-20", metodo: "transferencia", referencia: "TRF-77120", estado: "confirmado" },
  { id: "p6", clienteId: "c3", obraId: "o3", orcamentoId: "orc3", valor: 600000, data: "2026-05-15", metodo: "transferencia", referencia: "TRF-80013", estado: "confirmado" },
  { id: "p7", clienteId: "c3", obraId: "o4", orcamentoId: "orc7", valor: 200000, data: "2026-07-02", metodo: "deposito", referencia: "DEP-3311", estado: "confirmado" },
  { id: "p8", clienteId: "c5", obraId: "o6", orcamentoId: "orc5", valor: 220000, data: "2026-07-11", metodo: "emola", referencia: "EM-4482", estado: "confirmado" },
  { id: "p9", clienteId: "c6", obraId: "o7", valor: 100000, data: "2026-05-25", metodo: "numerario", referencia: "NUM-002", estado: "confirmado" },
];

export const provincias = [
  "Maputo Cidade", "Maputo", "Gaza", "Inhambane", "Sofala", "Manica",
  "Tete", "Zambézia", "Nampula", "Cabo Delgado", "Niassa",
];

export const tiposObra = [
  "Construção de moradia", "Renovação", "Ampliação", "Construção comercial",
  "Pintura", "Instalação elétrica", "Canalização", "Cobertura", "Pavimentação", "Outra",
];

export const unidades = [
  "unidade", "m", "m²", "m³", "kg", "ton", "saco", "caixa", "L", "dia", "hora", "serviço", "lote",
];

export const categorias = [
  "Preliminares", "Fundação", "Estrutura", "Alvenaria", "Cobertura",
  "Revestimento", "Pintura", "Instalação elétrica", "Canalização",
  "Carpintaria", "Mão de obra", "Transporte", "Equipamentos", "Outros",
];

// Helpers
export const clienteById = (id: string) => clientes.find((c) => c.id === id);
export const obraById = (id: string) => obras.find((o) => o.id === id);
export const orcamentoById = (id: string) => orcamentos.find((o) => o.id === id);

export function totalOrcamento(o: Orcamento): { subtotal: number; total: number } {
  const subtotal = o.itens.reduce((s, i) => s + i.quantidade * i.precoUnitario - i.desconto, 0);
  const total = subtotal - o.descontoGeral + o.imposto + o.custosAdicionais;
  return { subtotal, total };
}

// Métricas do dashboard
export function metricas() {
  const obrasAtivas = obras.filter((o) => o.estado === "em_andamento").length;
  const totalOrcado = orcamentos
    .filter((o) => o.estado === "aceite")
    .reduce((s, o) => s + totalOrcamento(o).total, 0);
  const totalRecebido = pagamentos.reduce((s, p) => s + p.valor, 0);
  const pendente = totalOrcado - totalRecebido;
  return {
    obrasAtivas,
    orcamentosEmitidos: orcamentos.length,
    totalOrcado,
    totalRecebido,
    pendente,
    clientesRegistados: clientes.length,
  };
}

export const chartMensal = [
  { mes: "Jan", orcado: 380000, recebido: 240000 },
  { mes: "Fev", orcado: 1250000, recebido: 1000000 },
  { mes: "Mar", orcado: 1800000, recebido: 780000 },
  { mes: "Abr", orcado: 720000, recebido: 500000 },
  { mes: "Mai", orcado: 950000, recebido: 820000 },
  { mes: "Jun", orcado: 1420000, recebido: 1105000 },
  { mes: "Jul", orcado: 890000, recebido: 520000 },
];

export const chartEstados = [
  { nome: "Aceite", valor: 5, cor: "var(--color-success)" },
  { nome: "Enviado", valor: 1, cor: "var(--color-primary)" },
  { nome: "Visualizado", valor: 1, cor: "var(--color-info)" },
  { nome: "Rascunho", valor: 1, cor: "var(--color-muted-foreground)" },
];

export const estadoOrcamentoLabel: Record<EstadoOrcamento, string> = {
  rascunho: "Rascunho", enviado: "Enviado", visualizado: "Visualizado",
  aceite: "Aceite", rejeitado: "Rejeitado", expirado: "Expirado", cancelado: "Cancelado",
};

export const estadoObraLabel: Record<EstadoObra, string> = {
  planeada: "Planeada", em_andamento: "Em andamento", suspensa: "Suspensa",
  concluida: "Concluída", cancelada: "Cancelada",
};

export const metodoPagamentoLabel: Record<MetodoPagamento, string> = {
  mpesa: "M-Pesa", emola: "e-Mola", transferencia: "Transferência bancária",
  deposito: "Depósito bancário", numerario: "Numerário", outro: "Outro",
};
