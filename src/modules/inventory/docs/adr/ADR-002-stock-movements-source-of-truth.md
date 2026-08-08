# ADR-002: StockMovements como Fonte Única de Verdade

- **Estado**: Aprovado
- **Data**: 2026-07-28

## Contexto
O histórico de entradas, saídas, transferências e ajustes de inventário deve ser auditável e à prova de corrupção de dados.

## Decisão
1. `StockMovement` (Movimento de Stock) será a **Fonte Única de Verdade** (*Source of Truth*) de todo o sistema de Inventário.
2. Todos os movimentos confirmados serão **imutáveis**.
3. Correções de movimento nunca alterarão ou eliminarão registos existentes; serão efetuadas obrigatoriamente através de movimentos compensatórios (estornos ou ajustes).
4. `InventoryBalance` será tratado como um *Read Model* (visão agregada) totalmente derivável e reconstruível a partir do histórico de movimentos.

## Consequências
- **Positivas**: Rastreabilidade auditável completa de todo o ciclo de vida do stock; resiliência a inconsistências; suporte nativo a reconciliações e auditorias.
- **Negativas**: Necessidade de rigor no registo de todas as transações de inventário.
