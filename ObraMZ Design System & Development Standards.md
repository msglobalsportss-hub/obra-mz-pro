# ObraMZ Design System & Development Standards

---

## 1. Visão Geral e Princípios
O **ObraMZ Design System** define os padrões visuais, técnicos e funcionais para o desenvolvimento de todos os módulos do ERP ObraMZ. O objetivo principal é garantir consistência visual, legibilidade, acessibilidade e alta reutilização de componentes.

### Princípios Fundamentais:
1. **Identidade Visual Preservada**:
   - **Laranja ObraMZ (`#F97316` / `oklch(0.706 0.187 41)`)**: Cor primária para ações principais, destaques ativos e marca.
   - **Azul Escuro Institucional (`#1F2937` / `oklch(0.21 0.03 264)`)**: Cor para superfícies escuras, sidebar corporativa e cabeçalhos operacionais.
   - **Cores Semânticas Padronizadas**:
     - 🟢 **Sucesso / Verde (`emerald-600`)**: Confirmações, pagamentos recebidos, concluídos e estados normais.
     - 🟡 **Atenção / Âmbar (`amber-500`)**: Avisos, entregas pendentes e rascunhos.
     - 🔴 **Perigo / Vermelho (`rose-600`)**: Eliminação destrutiva, atrasos críticos, ausências e erros.
     - 🔵 **Informação / Azul (`blue-600`)**: Links, navegação e notas contextuais.
     - ⚪ **Neutro / Slate/Gray (`slate-500`/`slate-700`)**: Rascunhos, inativos e dados auxiliares.

---

## 2. Estrutura de Componentes
O projeto organiza componentes em 3 níveis claros:

1. **`src/components/ui/` (Base Radix/Tailwind primitives)**:
   - Button, Card, Input, Select, Dialog, DropdownMenu, Tooltip, Progress, Badge, Skeleton.
2. **`src/components/shared/` (Componentes Globais Reutilizáveis)**:
   - `PageContainer`: Content layout wrapper com padding e max-width responsivo.
   - `PageHeader`: Cabeçalho oficial com breadcrumbs com ícones, título, descrição e ações.
   - `PageBreadcrumb`: Navegação estrutural com ícones e truncamento gracioso.
   - `StatusBadge`: Badge semântico unificado orientado a mapeamentos de estado.
   - `EmptyState`: Estado vazio universal para listas, pesquisas e gráficos.
   - `ConfirmDialog`: Modal padronizado para ações de confirmação ou eliminações.
   - `PageSkeleton`: Esqueleto de carregamento prevenindo layout shift.
3. **`src/components/[modulo]/` (Componentes de Domínio)**:
   - `purchases/`, `projects/`, `teams/`, `materials/`, `suppliers/`, `clients/`, `payments/`.

---

## 3. Tokens de Design Centralizados (`src/lib/design-tokens.ts`)
- **Espaçamento**: Escala de 4px, 8px, 12px, 16px, 24px, 32px.
- **Tipografia**:
  - Título Principal: `text-2xl font-bold tracking-tight sm:text-3xl`
  - Subtítulo de Página: `text-xs text-muted-foreground`
  - Título de Seção: `text-xs font-bold uppercase tracking-wider text-muted-foreground`
  - KPI Grande: `text-xl sm:text-2xl font-bold tracking-tight text-foreground`
  - Valores Monetários: `font-mono font-bold` + Tooltip com valor em MZN e copiar ao clicar.
- **Microinterações**: Duração padrão de **180ms a 220ms** (`transition-all duration-200 ease-in-out`).

---

## 4. Configurações Semânticas de Domínio (`src/lib/status-configs.ts`)
Mapeamentos unificados fora do JSX:
- `projectStatusConfig`: `planeada`, `em_andamento`, `pausada`, `concluida`, `cancelada`.
- `paymentStatusConfig`: `pendente`, `confirmado`, `atrasado`, `cancelado`.
- `purchaseStatusConfig`: `draft`, `pending_approval`, `approved`, `sent`, `partially_received`, `received`, `cancelled`.
- `attendanceStatusConfig`: `presente`, `falta`, `meio_dia`, `ferias`, `baixa`.
- `supplierStatusConfig`: `active`, `inactive`, `blocked`.

---

## 5. Diretrizes para Novos Módulos (Ex: Etapa 6.4 — Inventário)
Cada novo módulo deve ser implementado seguindo a mesma estrutura comprovada no módulo de Compras:
1. **Rota**: `src/routes/app.[modulo].index.tsx` usando `PageContainer` e `PageHeader`.
2. **KPIs**: Cartões responsivos usando `PageKPICards` / `StatCard` com tooltips e navegação contextual por clique.
3. **Resumo Operacional**: Banner com timestamp local e indicador dinâmico de estado.
4. **Filtros & Pesquisa**: Input com ícone de busca, seletores e badge de filtro ativo.
5. **Tabela / Lista Operacional**: Linhas clicáveis com hover destacado e menu contextual acionável.
6. **Estados Vazios & Skeletons**: Rendition limpa de `EmptyState` e `PageSkeleton`.
