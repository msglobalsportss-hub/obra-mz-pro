# ADR-010: Fronteiras do Repositório e Unit of Work do Inventário

- **Estado**: Aprovado
- **Data**: 2026-07-28

## Contexto

O módulo de Inventário do ObraMZ necessita de garantir atomicidade em operações complexas que envolvem múltiplas entidades (movimento, saldo, auditoria, idempotência). É necessário definir como os repositórios são organizados e como a atomicidade é garantida sem acoplar o Core a tecnologias concretas.

## Decisão

### Repositórios

1. Cada entidade de domínio tem o seu próprio repositório com interface no Core.
2. Os repositórios são **persistence-agnostic**: as interfaces no Core não conhecem Supabase, SQL, localStorage, Zustand ou React Query.
3. Os adaptadores concretos (ex: `SupabaseInventoryBalanceRepository`) vivem fora do Core e dependem do Core, nunca o contrário.
4. `StockMovement` usa semântica de `append` (nunca `update`) para reforçar imutabilidade.
5. `InventoryBalance` usa semântica de `upsert` (é um read model substituível).

### Unit of Work

1. `IInventoryUnitOfWork` agrupa todos os repositórios num `InventoryRepositoryContext`.
2. O Engine recebe o `IInventoryUnitOfWork` por injeção de dependência.
3. A implementação concreta (transações Supabase, commit/rollback) pertence à camada de infraestrutura.
4. O Core nunca acede diretamente a Supabase, SQL ou outros adaptadores.

### Interfaces Existentes vs. Novas

- `core/interfaces/repositories/` (Fase 1): mantida como referência arquitectural; Fase 2A introduz `core/domain/repositories/` com interfaces concretas completas.

## Alternativas Consideradas

- **Repositório único genérico**: Anti-pattern — viola o Single Responsibility Principle.
- **Transações diretamente no Engine**: Acopla o Core à tecnologia de persistência.
- **Zustand como store de repositório**: Inadequado para operações atómicas server-side.

## Consequências

- **Positivas**: Testabilidade elevada (mock de interfaces). Substituição de tecnologia sem alterar o Core. Suporte nativo a transações atómicas.
- **Negativas**: Maior número de interfaces a manter. Requer disciplina para não contornar a fronteira do repositório.
