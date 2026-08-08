import type { ReactNode } from "react";

export type StatusTone = "success" | "warning" | "destructive" | "info" | "neutral" | "primary";

export interface StatusConfig {
  label: string;
  tone: StatusTone;
  iconName?: string;
  description?: string;
}

// 1. Obras / Projetos Status Config
export const projectStatusConfig: Record<string, StatusConfig> = {
  planeada: { label: "Planeada", tone: "info", description: "Obra em fase de planeamento" },
  em_andamento: { label: "Em Andamento", tone: "primary", description: "Obra fisicamente em execução" },
  pausada: { label: "Pausada", tone: "warning", description: "Obra temporariamente suspensa" },
  concluida: { label: "Concluída", tone: "success", description: "Obra finalizada e entregue" },
  cancelada: { label: "Cancelada", tone: "destructive", description: "Obra cancelada" },
};

// 2. Pagamentos Status Config
export const paymentStatusConfig: Record<string, StatusConfig> = {
  pendente: { label: "Pendente", tone: "warning", description: "Aguardando confirmação financeira" },
  confirmado: { label: "Confirmado", tone: "success", description: "Pagamento recebido/confirmado" },
  atrasado: { label: "Atrasado", tone: "destructive", description: "Pagamento fora do prazo" },
  cancelado: { label: "Cancelado", tone: "neutral", description: "Pagamento anulado" },
};

// 3. Orçamentos Status Config
export const quotationStatusConfig: Record<string, StatusConfig> = {
  rascunho: { label: "Rascunho", tone: "neutral" },
  enviado: { label: "Enviado", tone: "info" },
  visualizado: { label: "Visualizado", tone: "info" },
  aceite: { label: "Aceite", tone: "success" },
  rejeitado: { label: "Rejeitado", tone: "destructive" },
  expirado: { label: "Expirado", tone: "warning" },
  cancelado: { label: "Cancelado", tone: "neutral" },
};

// 4. Pedidos de Compra Status Config
export const purchaseStatusConfig: Record<string, StatusConfig> = {
  draft: { label: "Rascunho", tone: "neutral" },
  pending_approval: { label: "Pendente Aprovação", tone: "warning" },
  approved: { label: "Aprovado", tone: "info" },
  sent: { label: "Enviado ao Fornecedor", tone: "info" },
  partially_received: { label: "Parcialmente Recebido", tone: "warning" },
  received: { label: "Recebido 100%", tone: "success" },
  cancelled: { label: "Cancelado", tone: "destructive" },
};

// 5. Entregas Status Config
export const deliveryStatusConfig: Record<string, StatusConfig> = {
  draft: { label: "Em Conferência", tone: "neutral" },
  confirmed: { label: "Confirmada / Entrada Stock", tone: "success" },
  cancelled: { label: "Cancelada", tone: "destructive" },
};

// 6. Presenças / Trabalhadores Status Config
export const attendanceStatusConfig: Record<string, StatusConfig> = {
  presente: { label: "Presente", tone: "success" },
  falta: { label: "Falta", tone: "destructive" },
  meio_dia: { label: "Meio Dia", tone: "warning" },
  ferias: { label: "Férias", tone: "info" },
  baixa: { label: "Baixa Médica", tone: "neutral" },
};

// 7. Fornecedores Status Config
export const supplierStatusConfig: Record<string, StatusConfig> = {
  active: { label: "Ativo", tone: "success" },
  inactive: { label: "Inativo", tone: "neutral" },
  blocked: { label: "Bloqueado", tone: "destructive" },
};

// 8. Clientes Status Config
export const clientStatusConfig: Record<string, StatusConfig> = {
  ativo: { label: "Ativo", tone: "success" },
  inativo: { label: "Inativo", tone: "neutral" },
  prospecto: { label: "Prospecto", tone: "info" },
};
