## Objetivo

Tornar o protótipo ObraMZ realmente funcional com dados simulados persistentes (localStorage), corrigindo bugs existentes e completando os módulos de Clientes, Obras, Orçamentos e Pagamentos — sem alterar o design nem introduzir backend real.

## Abordagem geral

1. **Camada de dados central persistente** — Substituir `src/lib/mock-data.ts` estático por um store Zustand com persistência `localStorage`, exposto via hooks. Todas as páginas passam a ler/escrever daí, garantindo sincronização automática entre Dashboard, Clientes, Obras, Orçamentos e Pagamentos.
2. **Serviços CRUD** — Criar `src/services/` com funções (`createClient`, `updateQuote`, `duplicateQuote`, `addProjectTimelineEvent`, etc.) que encapsulam mutações no store. Pronto para trocar por Supabase depois.
3. **Correções transversais** — Fixar hydration mismatch da saudação ("Bom dia/Boa noite"), formatos MZN/DD-MM-AAAA, textos em português, responsividade de tabelas → cartões em mobile.

## Módulos

### Clientes

- Formulário novo/editar (dialog) com validação Zod: nome, tipo, telefone(s), email, NUIT, província, cidade, endereço, observações.
- Eliminar com aviso de dependências (obras/orçamentos/pagamentos).
- Página de detalhes com totais reais (orçado, aceite, recebido, pendente) e botões "Nova obra" / "Novo orçamento" pré-associando o cliente.
- Pesquisa + filtro tipo + ordenação + contagem de resultados.

### Obras

- Criar/editar/eliminar (dialog).
- Alterar estado (Planeada/Em andamento/Suspensa/Concluída/Cancelada) e progresso (slider 0-100).
- Linha temporal editável: adicionar/editar/eliminar eventos (data, título, descrição, tipo, visibilidade).
- Filtros por estado/cliente/província, pesquisa, ordenação.

### Orçamentos

- Editor unificado (mesma página serve criar e editar via `?id=`), com todos os campos, itens duplicáveis/reordenáveis/elimináveis, cálculo automático subtotal/total.
- Validações: sem negativos, quantidade > 0, campos obrigatórios.
- Aviso "alterações não guardadas" ao sair.
- Ações: guardar, duplicar, eliminar, alterar estado (modal confirmação), gerar PDF simulado (window.print/toast), partilhar WhatsApp (link `wa.me` com resumo), pré-visualizar.
- Estados: Rascunho/Enviado/Visualizado/Aceite/Rejeitado/Expirado/Cancelado.
- Histórico/linha temporal automáticos (criado, editado, estado alterado).
- Filtros por estado/cliente/obra/intervalo de datas + pesquisa + ordenação.

### Pagamentos

- Registar/editar/eliminar via dialog: cliente, obra, orçamento, valor, data, método (M-Pesa/e-Mola/Transferência/Depósito/Numerário/Outro), referência, estado, observações, comprovativo simulado.
- Comprovativo: FileReader → data URL guardado no store; modal para visualizar/substituir/remover.
- Validações: valor > 0, aviso se exceder saldo pendente do orçamento/obra (confirmar para continuar).
- Filtros por estado/método/cliente/obra/data + pesquisa.

### Dashboard

- Cartões e listas derivados do store (últimos orçamentos/pagamentos, obras recentes, atividades). Cada item liga à página correspondente.
- Corrigir saudação para não causar hydration mismatch (renderizar após mount).

## Detalhes técnicos

- **Stack de estado**: `zustand` + `zustand/middleware` persist (localStorage). Já existe `sonner` para toasts, `zod` presume-se disponível (verificar; senão instalar). Reutilizar componentes shadcn (Dialog, AlertDialog, Slider, Popover para date range).
- **Estrutura**:
  ```
  src/
    store/obramz-store.ts        (Zustand + persist, seed inicial com dados demo consistentes)
    services/
      clients.ts, projects.ts, quotes.ts, payments.ts, activities.ts
    lib/validations.ts           (schemas Zod)
    components/
      clients/client-form-dialog.tsx, delete-client-dialog.tsx
      projects/project-form-dialog.tsx, project-timeline.tsx
      quotes/quote-status-dialog.tsx, quote-share.tsx
      payments/payment-form-dialog.tsx, proof-viewer.tsx
      common/confirm-dialog.tsx, empty-state.tsx, unsaved-changes-guard.tsx
  ```
- **Dados iniciais**: seed com João Mabote + Nova Vida Lda e valores exatos do brief (ORC-2026-001 = 1 250 000 MZN, recebido 500 000; ORC-2026-002 = 480 000 MZN concluído).
- **Ligações inter-módulos**: helpers derivam totais (orçado, recebido, pendente) por cliente/obra a partir das listas relacionadas.
- **Responsividade**: componente `<ResponsiveList>` renderiza tabela em ≥md e cartões em mobile.
- **PDF simulado**: reutilizar rota de pré-visualização + `window.print()`.
- **WhatsApp**: `https://wa.me/?text=...` com número do cliente + resumo do orçamento.

## Fora do âmbito (conforme brief)

Sem Supabase/auth/EscalePay/IA, sem fases avançadas, sem folha salarial, sem materiais/fornecedores, sem upload real, sem Gantt.

## Validação final

Percurso manual em desktop e mobile: criar cliente → criar obra → criar orçamento → aceitar → registar pagamento → confirmar que dashboard, cliente e obra refletem tudo; recarregar página confirma persistência. 