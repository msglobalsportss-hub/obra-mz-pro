// Tipos e constantes partilhados. Os dados propriamente ditos vivem em src/store/obramz-store.ts.

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
  observacoes?: string;
  criadoEm: string;
};

export type EstadoObra = "planeada" | "em_andamento" | "suspensa" | "concluida" | "cancelada";

export type TimelineEventoTipo =
  | "obra_criada"
  | "progresso"
  | "orcamento_criado"
  | "orcamento_aceite"
  | "pagamento"
  | "nota"
  | "outro";

export type ObraEvento = {
  id: string;
  data: string;
  titulo: string;
  descricao?: string;
  tipo: TimelineEventoTipo;
  visibilidade: "publica" | "privada";
};

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
  estado: EstadoObra;
  responsavel: string;
  observacoes?: string;
  progressoAtualizadoEm?: string;
  eventos: ObraEvento[];
  criadoEm: string;
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

export type OrcamentoHistorico = {
  id: string;
  data: string;
  descricao: string;
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
  notasInternas?: string;
  condicoes: string;
  historico: OrcamentoHistorico[];
  criadoEm: string;
  atualizadoEm: string;
};

export type MetodoPagamento = "mpesa" | "emola" | "transferencia" | "deposito" | "numerario" | "outro";
export type EstadoPagamento = "pendente" | "confirmado" | "cancelado" | "reembolsado";

export type PagamentoComprovativo = {
  nome: string;
  tipo: string;
  dataUrl: string;
  enviadoEm: string;
};

export type Pagamento = {
  id: string;
  clienteId: string;
  obraId?: string;
  orcamentoId?: string;
  valor: number;
  data: string;
  metodo: MetodoPagamento;
  referencia: string;
  estado: EstadoPagamento;
  observacoes?: string;
  comprovativo?: PagamentoComprovativo;
  criadoEm: string;
};

export type Atividade = {
  id: string;
  data: string;
  descricao: string;
  entidade: "cliente" | "obra" | "orcamento" | "pagamento";
  entidadeId: string;
};

export type Empresa = {
  nome: string;
  nuit: string;
  telefone: string;
  email: string;
  website: string;
  provincia: string;
  cidade: string;
  endereco: string;
  descricao: string;
  banco: string;
  mpesa: string;
  emola: string;
};

export type Utilizador = {
  nome: string;
  email: string;
  cargo: string;
};

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

export const estadoPagamentoLabel: Record<EstadoPagamento, string> = {
  pendente: "Pendente", confirmado: "Confirmado",
  cancelado: "Cancelado", reembolsado: "Reembolsado",
};

export const tipoEventoLabel: Record<TimelineEventoTipo, string> = {
  obra_criada: "Obra criada",
  progresso: "Progresso atualizado",
  orcamento_criado: "Orçamento criado",
  orcamento_aceite: "Orçamento aceite",
  pagamento: "Pagamento recebido",
  nota: "Nota",
  outro: "Outro",
};

export function totalOrcamento(o: Orcamento): { subtotal: number; total: number } {
  const subtotal = o.itens.reduce(
    (s, i) => s + Math.max(0, i.quantidade) * Math.max(0, i.precoUnitario) - Math.max(0, i.desconto),
    0,
  );
  const total = subtotal - o.descontoGeral + o.imposto + o.custosAdicionais;
  return { subtotal, total: Math.max(0, total) };
}
