# ADR-004: Limites da API Pública e Separação de Contratos

- **Estado**: Aprovado
- **Data**: 2026-07-28

## Contexto
Para manter o acoplamento baixo entre módulos do ERP ObraMZ, detalhes internos da implementação do Inventário não devem ser expostos a outros módulos.

## Decisão
1. O ficheiro `src/modules/inventory/index.ts` será o **único ponto de entrada público** do módulo.
2. Contratos são categorizados estritamente em:
   - `core/contracts/internal`: Utilizados exclusivamente dentro do módulo Core. Não são exportados na API pública.
   - `core/contracts/external`: Contratos públicos utilizados por Compras, Entregas, Materiais, Obras, Financeiro.
   - `core/contracts/shared`: Contratos neutros e de contexto transacional (`InventoryOperationResult`, `InventoryCorrelationContext`).
3. Módulos externos deverão importar tipos e funções exclusivamente de `@/modules/inventory`. Importações profundas (ex: `@/modules/inventory/core/...`) são proibidas.

## Consequências
- **Positivas**: Refatorações internas do Core não quebram outros módulos do sistema.
- **Negativas**: Exige expor explicitamente no `index.ts` público apenas os tipos e contratos necessários para integração.
