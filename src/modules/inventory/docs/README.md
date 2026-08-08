# Arquitetura do Módulo de Inventário (ObraMZ)

Este diretório contém a documentação técnica e as **Architecture Decision Records (ADRs)** do módulo de Inventário do ERP ObraMZ.

## Estrutura do Módulo

- `core/`: Regras de negócio puras, contratos, políticas, eventos e engine do Inventário (100% TypeScript puro, sem dependências de UI/React/Zustand).
- `application/`: Camada de orquestração de casos de uso (Commands, Queries, DTOs, Mappers, Facades).
- `features/`: Módulos funcionais e visualizações da aplicação.
- `components/`: Componentes visuais reutilizáveis do módulo de Inventário.
- `hooks/`: React hooks de integração com a aplicação.
- `store/`: Estado de UI do módulo.
- `docs/`: Documentação arquitetural e registo de decisões (ADRs).
- `index.ts`: Ponto de entrada e única barreira da API pública do módulo.

## Decisões Arquiteturais Registadas (ADRs)

- [ADR-001: Limites e Camadas do Módulo de Inventário](./adr/ADR-001-inventory-module-boundaries.md)
- [ADR-002: StockMovements como Fonte Única de Verdade](./adr/ADR-002-stock-movements-source-of-truth.md)
- [ADR-003: Controlo Exclusivo de Saldos pelo Inventory Engine](./adr/ADR-003-inventory-engine-exclusive-balance-control.md)
- [ADR-004: Limites da API Pública e Separação de Contratos](./adr/ADR-004-public-api-and-contract-boundaries.md)
- [ADR-005: Integração Orientada a Eventos (Event-Driven Architecture)](./adr/ADR-005-event-driven-inventory-integration.md)
