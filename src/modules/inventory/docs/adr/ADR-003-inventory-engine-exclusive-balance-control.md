# ADR-003: Controlo Exclusivo de Saldos pelo Inventory Engine

- **Estado**: Aprovado
- **Data**: 2026-07-28

## Contexto
Mudanças de stock efetuadas diretamente por múltiplos subsistemas sem um ponto central de orquestração causam race conditions, desfasamento de valores monetários e saldos negativos acidentais.

## Decisão
1. O `Inventory Engine` será o **único responsável** por processar e autorizar modificações de saldos, reservas, custos e transferências de inventário.
2. Nenhum outro módulo (Compras, Obras, Deliveries, Financeiro) poderá alterar registos de saldo ou stock diretamente.
3. Todas as solicitações deverão passar estritamente pela pipeline do Inventory Engine: `Evento/Comando -> Inventory Engine -> Validation -> Policies -> Movement -> Balance -> Timeline -> Audit -> Evento Final`.

## Consequências
- **Positivas**: Garantia de consistência das regras de negócio, centralização da aplicação de políticas e eliminação de mutações paralelas não autorizadas.
- **Negativas**: Todas as operações de stock dependem da passagem explicita pelo Engine.
